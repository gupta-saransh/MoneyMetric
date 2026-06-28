// Creates the schema and seeds users/categories/accounts from lib/options.js.
// Run with: npm run db:setup   (loads .env via node --env-file)
import postgres from 'postgres';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { CATEGORIES, ACCOUNTS, DEFAULT_USER } from '../lib/options.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('❌ DATABASE_URL is not set. Copy .env.example to .env and add your connection string.');
  process.exit(1);
}

const sql = postgres(url, { ssl: 'require', prepare: false, max: 1 });

try {
  // 1. Schema
  const schema = readFileSync(join(__dirname, '../db/schema.sql'), 'utf8');
  await sql.unsafe(schema);
  console.log('✅ schema applied');

  // 2. Default user
  await sql`
    insert into users (id, email, name)
    values (${DEFAULT_USER.id}, ${DEFAULT_USER.email}, ${DEFAULT_USER.name})
    on conflict (id) do nothing
  `;

  // 3. Categories
  for (const c of CATEGORIES) {
    await sql`
      insert into categories (id, user_id, name, group_name, is_discretionary, sort_order)
      values (${c.id}, ${DEFAULT_USER.id}, ${c.name}, ${c.group ?? null}, ${c.isDiscretionary}, ${c.id})
      on conflict (id) do update set
        name = excluded.name,
        group_name = excluded.group_name,
        is_discretionary = excluded.is_discretionary
    `;
  }
  console.log(`✅ seeded ${CATEGORIES.length} categories`);

  // 4. Accounts
  for (const a of ACCOUNTS) {
    await sql`
      insert into accounts (id, user_id, name, type, last4, sort_order)
      values (${a.id}, ${DEFAULT_USER.id}, ${a.name}, ${a.type}, ${a.last4 ?? null}, ${a.id})
      on conflict (id) do update set
        name = excluded.name,
        type = excluded.type,
        last4 = excluded.last4
    `;
  }
  console.log(`✅ seeded ${ACCOUNTS.length} accounts`);

  console.log('🎉 Database ready');
} catch (err) {
  console.error('❌ Setup failed:', err);
  process.exitCode = 1;
} finally {
  await sql.end();
}
