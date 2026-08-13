/**
 * Calculate standard compound interest.
 * @param principal The starting amount (P)
 * @param ratePercent The annual interest rate in percent (r)
 * @param compoundingFrequency The number of times interest compounds per year (n)
 * @param years The time in years (t)
 */
export function compoundValue(
  principal: number,
  ratePercent: number,
  compoundingFrequency: number,
  years: number
): number {
  const p = Number(principal);
  const r = Number(ratePercent);
  const n = Number(compoundingFrequency);
  const t = Number(years);

  if (isNaN(p) || p <= 0) return 0;
  if (isNaN(r) || isNaN(t) || t <= 0 || isNaN(n) || n <= 0) return p;

  const base = 1 + r / (n * 100);
  if (base <= 0) return p; // Prevent NaN on extreme negative interest rates

  const result = p * Math.pow(base, n * t);
  return isNaN(result) ? p : result;
}
