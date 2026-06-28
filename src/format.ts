const inrFmt0 = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 });
const inrFmt2 = new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** ₹ with no decimals, rounded — for headline figures. */
export const inr = (n: number) => '₹' + inrFmt0.format(Math.round(n ?? 0));

/** ₹ with 2 decimals — for individual amounts. */
export const inr2 = (n: number) => '₹' + inrFmt2.format(n ?? 0);

/** e.g. "25 Jun" */
export const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });

/** "2026-06" -> "June 2026" */
export const monthLabel = (month: string) => {
  const [y, m] = month.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
};

/** "2026-06" -> "Jun" */
export const monthShort = (month: string) => {
  const [y, m] = month.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString('en-IN', { month: 'short' });
};

export const pct = (part: number, whole: number) =>
  whole > 0 ? Math.round((part / whole) * 100) : 0;
