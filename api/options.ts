import type { VercelRequest, VercelResponse } from '@vercel/node';
import { CATEGORIES, ACCOUNTS } from '../lib/options.js';

// Lets the Shortcut (or future dashboard) fetch the live category/account lists
// instead of hard-coding them. Also handy to confirm a deploy is live.
export default function handler(_req: VercelRequest, res: VercelResponse) {
  return res.status(200).json({
    categories: CATEGORIES.map((c) => c.name),
    accounts: ACCOUNTS.map((a) => a.name),
  });
}
