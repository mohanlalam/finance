/**
 * Benchmark returns reference data for comparative performance analytics.
 */
export function getBenchmarkReturns(years: number = 1): { nifty50: number; nifty500: number; sp500: number } {
  if (years <= 1) return { nifty50: 14.5, nifty500: 15.2, sp500: 12.1 };
  if (years <= 3) return { nifty50: 13.8, nifty500: 14.5, sp500: 10.5 };
  return { nifty50: 14.2, nifty500: 14.9, sp500: 11.8 };
}
