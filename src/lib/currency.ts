/**
 * Canonical INR currency formatting for the ERP.
 *
 * All money in the system is INR. Display formatting must go through
 * these helpers so grouping (Indian lakh/crore digit grouping) and the
 * ₹ symbol stay consistent across owner/trainer/member surfaces.
 *
 * These are display helpers only — they never mutate or round stored
 * financial values beyond presentation.
 */

/**
 * Format a monetary amount as INR with Indian digit grouping.
 *
 * - Integers render without decimals: ₹1,50,000
 * - Non-integer amounts keep two decimals: ₹1,499.50
 * - null / undefined / NaN / non-numeric strings render as ₹0
 *   (display fallback only; validation happens elsewhere).
 */
export function formatINR(amount: number | string | null | undefined): string {
  const n = typeof amount === "string" ? Number(amount) : amount;
  if (n === null || n === undefined || Number.isNaN(n)) return "₹0";

  const abs = Math.abs(n);
  const hasFraction = !Number.isInteger(abs);
  const formatted = abs.toLocaleString("en-IN", {
    minimumFractionDigits: hasFraction ? 2 : 0,
    maximumFractionDigits: 2,
  });
  return `${n < 0 ? "-" : ""}₹${formatted}`;
}
