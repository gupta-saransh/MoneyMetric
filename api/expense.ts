import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';
import { getSql } from '../lib/db.js';
import { findCategory, findAccount, DEFAULT_USER_ID } from '../lib/options.js';

// What the iOS Shortcut sends. `account` is optional; if present it derives
// payment_method. Category + account names are validated against lib/options.js.
const ExpenseInput = z.object({
  amount: z.coerce.number().positive('amount must be greater than 0'),
  category: z.string().min(1, 'category is required'),
  account: z.string().min(1).optional(),
  note: z.string().optional(),
  type: z.enum(['expense', 'income', 'refund']).optional(),
  // Any date string the Shortcut sends (ISO 8601 preferred); parsed below.
  occurred_at: z.string().optional(),
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Vercel auto-parses JSON, but if the Content-Type header is missing the body
  // can arrive as a raw string — recover from that too.
  let body: unknown = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch {
      // leave as-is; validation below will report it
    }
  }

  // Detailed log of exactly what arrived (visible in Vercel Runtime Logs).
  console.log('POST /api/expense received:', {
    contentType: req.headers['content-type'] ?? null,
    rawBodyType: typeof req.body,
    body,
  });

  const parsed = ExpenseInput.safeParse(body);
  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors;
    console.warn('Validation failed:', { body, fieldErrors });
    return res.status(400).json({
      error: 'Validation failed',
      fieldErrors, // which fields failed and why
      received: body, // echo of what the server actually got
    });
  }
  const input = parsed.data;

  const category = findCategory(input.category);
  if (!category) {
    return res.status(400).json({ error: `Unknown category: ${input.category}` });
  }

  let accountId: number | null = null;
  let paymentMethod = 'upi';
  if (input.account) {
    const account = findAccount(input.account);
    if (!account) {
      return res.status(400).json({ error: `Unknown account: ${input.account}` });
    }
    accountId = account.id;
    paymentMethod = account.type;
  }

  // Backdating: if a date was sent (e.g. from "Log Past Expense"), use it;
  // otherwise the DB defaults occurred_at to now().
  let occurredAt: Date | null = null;
  if (input.occurred_at) {
    const d = new Date(input.occurred_at);
    if (Number.isNaN(d.getTime())) {
      return res.status(400).json({ error: `Invalid date for occurred_at: ${input.occurred_at}` });
    }
    occurredAt = d;
  }

  try {
    const sql = getSql();
    const [row] = await sql`
      insert into expenses (
        user_id, amount, category_id, is_discretionary,
        account_id, payment_method, note, type, occurred_at
      ) values (
        ${DEFAULT_USER_ID}, ${input.amount}, ${category.id}, ${category.isDiscretionary},
        ${accountId}, ${paymentMethod}, ${input.note ?? null},
        ${input.type ?? 'expense'}, ${occurredAt ?? sql`now()`}
      )
      returning id
    `;

    return res.status(201).json({
      ok: true,
      id: String(row.id),
      message: `Saved ✅ ₹${input.amount} ${category.name}`,
    });
  } catch (err) {
    console.error('Insert failed', err);
    // `detail` is temporary, to diagnose the live deploy; safe to remove later.
    return res.status(500).json({
      error: 'Database error',
      detail: err instanceof Error ? err.message : String(err),
    });
  }
}
