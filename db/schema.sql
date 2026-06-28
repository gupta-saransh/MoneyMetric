-- MoneyMetric schema (CockroachDB / Postgres compatible).
-- Applied by `npm run db:setup`. Safe to re-run (IF NOT EXISTS everywhere).

create table if not exists users (
  id          int default unique_rowid() primary key,
  email       text unique,
  name        text,
  created_at  timestamptz not null default now()
);

create table if not exists categories (
  id               int default unique_rowid() primary key,
  user_id          int references users(id),
  name             text not null,
  group_name       text,                          -- Fixed | Daily | Lifestyle | Health | Financial
  is_discretionary bool not null default false,
  sort_order       int not null default 0,
  active           bool not null default true,
  unique (user_id, name)
);

create table if not exists accounts (
  id          int default unique_rowid() primary key,
  user_id     int references users(id),
  name        text not null,                      -- 'HDFC Credit Card'
  type        text not null,                      -- card | upi | cash | bank
  last4       text,
  active      bool not null default true,
  sort_order  int not null default 0,
  unique (user_id, name)
);

create table if not exists expenses (
  id               int default unique_rowid() primary key,
  user_id          int not null default 1 references users(id),
  amount           decimal(12,2) not null,
  category_id      int not null references categories(id),
  is_discretionary bool not null,                 -- resolved from category at insert
  account_id       int references accounts(id),
  payment_method   text not null,                 -- resolved from account.type at insert
  merchant         text,                          -- optional; backfill from dashboard later
  note             text,
  tags             text[],                        -- optional; backfill later
  type             text not null default 'expense', -- expense | income | refund
  currency         text not null default 'INR',
  source           text not null default 'shortcut',
  occurred_at      timestamptz not null default now(),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  deleted_at       timestamptz                     -- soft delete (undo / edit)
);

create table if not exists budgets (
  id            int default unique_rowid() primary key,
  user_id       int not null references users(id),
  category_id   int references categories(id),     -- null = overall budget
  period        text not null default 'monthly',
  limit_amount  decimal(12,2) not null,
  starts_on     date,
  created_at    timestamptz not null default now()
);

create index if not exists idx_expenses_user_time on expenses (user_id, occurred_at desc);
create index if not exists idx_expenses_user_cat_time on expenses (user_id, category_id, occurred_at desc);
create index if not exists idx_expenses_user_account on expenses (user_id, account_id);
