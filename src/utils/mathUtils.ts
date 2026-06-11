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
  if (years <= 0 || isNaN(ratePercent) || isNaN(years) || isNaN(principal) || principal <= 0) {
    return principal;
  }
  if (compoundingFrequency <= 0) return principal;
  return principal * Math.pow(1 + ratePercent / (compoundingFrequency * 100), compoundingFrequency * years);
}
