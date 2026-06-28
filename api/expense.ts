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
  occurred_at: z.string().datetime().optional(),
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const parsed = ExpenseInput.safeParse(req.body);
  if (!parsed.success) {
    return res
      .status(400)
      .json({ error: 'Validation failed', details: parsed.error.flatten().fieldErrors });
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

  try {
    const sql = getSql();
    const [row] = await sql`
      insert into expenses (
        user_id, amount, category_id, is_discretionary,
        account_id, payment_method, note, type, occurred_at
      ) values (
        ${DEFAULT_USER_ID}, ${input.amount}, ${category.id}, ${category.isDiscretionary},
        ${accountId}, ${paymentMethod}, ${input.note ?? null},
        ${input.type ?? 'expense'}, ${input.occurred_at ?? sql`now()`}
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
