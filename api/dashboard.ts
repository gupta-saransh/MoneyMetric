import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getSql } from '../lib/db.js';
import { DEFAULT_USER_ID } from '../lib/options.js';

// All month bucketing is done in IST so months line up with your day.
const pad = (n: number) => String(n).padStart(2, '0');
const num = (v: unknown) => Number(v ?? 0); // CockroachDB int8 comes back as a string

function monthBounds(month: string) {
  const [y, m] = month.split('-').map(Number);
  const start = `${y}-${pad(m)}-01 00:00:00`;
  const ny = m === 12 ? y + 1 : y;
  const nm = m === 12 ? 1 : m + 1;
  const end = `${ny}-${pad(nm)}-01 00:00:00`;
  // 6-month trend window: first day of the month 5 months back
  let ty = y;
  let tm = m - 5;
  while (tm <= 0) {
    tm += 12;
    ty -= 1;
  }
  const trendStart = `${ty}-${pad(tm)}-01 00:00:00`;
  return { start, end, trendStart };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const sql = getSql();
    const user = DEFAULT_USER_ID;
    const monthParam = typeof req.query.month === 'string' ? req.query.month : '';
    const month = /^\d{4}-\d{2}$/.test(monthParam)
      ? monthParam
      : new Date().toISOString().slice(0, 7);
    const { start, end, trendStart } = monthBounds(month);

    const catRows = await sql`
      select c.name as category, c.group_name, c.is_discretionary,
             sum(e.amount)::float as total, count(*)::int as count
      from expenses e
      join categories c on c.id = e.category_id
      where e.user_id = ${user}
        and e.deleted_at is null
        and e.type = 'expense'
        and (e.occurred_at at time zone 'Asia/Kolkata') >= ${start}::timestamp
        and (e.occurred_at at time zone 'Asia/Kolkata') <  ${end}::timestamp
      group by c.name, c.group_name, c.is_discretionary
      order by total desc
    `;
    const byCategory = catRows.map((r) => ({
      category: r.category as string,
      group_name: (r.group_name as string) ?? null,
      is_discretionary: r.is_discretionary as boolean,
      total: num(r.total),
      count: num(r.count),
    }));

    const accRows = await sql`
      select coalesce(a.name, '(unspecified)') as account,
             sum(e.amount)::float as total, count(*)::int as count
      from expenses e
      left join accounts a on a.id = e.account_id
      where e.user_id = ${user}
        and e.deleted_at is null
        and e.type = 'expense'
        and (e.occurred_at at time zone 'Asia/Kolkata') >= ${start}::timestamp
        and (e.occurred_at at time zone 'Asia/Kolkata') <  ${end}::timestamp
      group by a.name
      order by total desc
    `;
    const byAccount = accRows.map((r) => ({
      account: r.account as string,
      total: num(r.total),
      count: num(r.count),
    }));

    const trendRows = await sql`
      select to_char(date_trunc('month', e.occurred_at at time zone 'Asia/Kolkata'), 'YYYY-MM') as month,
             sum(e.amount)::float as total
      from expenses e
      where e.user_id = ${user}
        and e.deleted_at is null
        and e.type = 'expense'
        and (e.occurred_at at time zone 'Asia/Kolkata') >= ${trendStart}::timestamp
      group by 1
      order by 1
    `;
    const monthlyTrend = trendRows.map((r) => ({ month: r.month as string, total: num(r.total) }));

    const recentRows = await sql`
      select e.id::string as id, e.amount::float as amount, c.name as category,
             a.name as account, e.note, e.is_discretionary, e.type, e.occurred_at
      from expenses e
      join categories c on c.id = e.category_id
      left join accounts a on a.id = e.account_id
      where e.user_id = ${user} and e.deleted_at is null
      order by e.occurred_at desc
      limit 25
    `;
    const recent = recentRows.map((r) => ({
      id: r.id as string,
      amount: num(r.amount),
      category: r.category as string,
      account: (r.account as string) ?? null,
      note: (r.note as string) ?? null,
      is_discretionary: r.is_discretionary as boolean,
      type: r.type as string,
      occurred_at: r.occurred_at as string,
    }));

    const total = byCategory.reduce((s, r) => s + r.total, 0);
    const count = byCategory.reduce((s, r) => s + r.count, 0);
    const discretionary = byCategory
      .filter((r) => r.is_discretionary)
      .reduce((s, r) => s + r.total, 0);
    const essential = total - discretionary;

    const groupTotals = new Map<string, number>();
    for (const r of byCategory) {
      const g = r.group_name ?? 'Other';
      groupTotals.set(g, (groupTotals.get(g) ?? 0) + r.total);
    }
    const byGroup = [...groupTotals.entries()]
      .map(([group, t]) => ({ group, total: t }))
      .sort((a, b) => b.total - a.total);

    return res.status(200).json({
      month,
      total,
      count,
      essential,
      discretionary,
      byCategory,
      byGroup,
      byAccount,
      monthlyTrend,
      recent,
    });
  } catch (err) {
    console.error('Dashboard query failed', err);
    return res.status(500).json({
      error: 'Dashboard query failed',
      detail: err instanceof Error ? err.message : String(err),
    });
  }
}
