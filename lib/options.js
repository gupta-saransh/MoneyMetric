// Single source of truth for the app.
// Imported by: the API functions (validation), the DB setup script (seeding),
// and the frontend (dropdowns / labels). Edit here, then run `npm run db:setup`.

/** @typedef {'Fixed'|'Daily'|'Lifestyle'|'Health'|'Financial'} CategoryGroup */
/** @typedef {'card'|'upi'|'cash'|'bank'} AccountType */

export const DEFAULT_USER_ID = 1;
export const DEFAULT_USER = {
  id: 1,
  email: 'saransh287@gmail.com',
  name: 'Me',
};

/**
 * Categories. `isDiscretionary` drives the essential-vs-wants (50/30/20) view
 * and is resolved onto each expense at insert time.
 * @type {{ id: number, name: string, group: CategoryGroup | null, isDiscretionary: boolean }[]}
 */
export const CATEGORIES = [
  { id: 1, name: 'rent', group: 'Fixed', isDiscretionary: false },
  { id: 2, name: 'bills', group: 'Fixed', isDiscretionary: false },
  { id: 3, name: 'groceries', group: 'Daily', isDiscretionary: false },
  { id: 4, name: 'transport', group: 'Daily', isDiscretionary: false },
  { id: 5, name: 'health', group: 'Health', isDiscretionary: false },
  { id: 6, name: 'dining', group: 'Lifestyle', isDiscretionary: true },
  { id: 7, name: 'shopping', group: 'Lifestyle', isDiscretionary: true },
  { id: 8, name: 'entertainment', group: 'Lifestyle', isDiscretionary: true },
  { id: 9, name: 'subscriptions', group: 'Lifestyle', isDiscretionary: true },
  { id: 10, name: 'misc', group: null, isDiscretionary: false },
];

/**
 * Your real accounts. The `type` derives `payment_method` automatically,
 * so picking the account in the Shortcut sets card/upi/cash for you.
 * EDIT THESE PLACEHOLDERS to your actual cards / UPI handles.
 * @type {{ id: number, name: string, type: AccountType, last4?: string }[]}
 */
export const ACCOUNTS = [
  { id: 1, name: 'Credit Card', type: 'card' },
  { id: 2, name: 'UPI', type: 'upi' },
  { id: 3, name: 'Cash', type: 'cash' },
];

/** @param {string} name */
export function findCategory(name) {
  const key = String(name).trim().toLowerCase();
  return CATEGORIES.find((c) => c.name.toLowerCase() === key) ?? null;
}

/** @param {string} name */
export function findAccount(name) {
  const key = String(name).trim().toLowerCase();
  return ACCOUNTS.find((a) => a.name.toLowerCase() === key) ?? null;
}
