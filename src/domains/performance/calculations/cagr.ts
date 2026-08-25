/**
 * Calculates CAGR (Compound Annual Growth Rate) safely with period bounds.
 */
export function calculateCAGR(invested: number, current: number, years: number): number {
  const inv = Number(invested);
  const curr = Number(current);
  const y = Number(years);

  if (isNaN(inv) || isNaN(curr) || isNaN(y) || inv <= 0 || y <= 0 || curr < 0) return 0;
  if (curr === 0) return -1.0; // 100% loss

  // For ultra-short holding periods (< 7 days), use simple percentage return to prevent 1/y exponent blowup
  if (y < 7 / 365.25) {
    return (curr - inv) / inv;
  }

  const result = Math.pow(curr / inv, 1 / y) - 1;
  return isFinite(result) ? result : 0;
}
