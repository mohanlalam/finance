/**
 * Shared types formerly in useMarketData.ts.
 * The useMarketData hook was dead code (unused) and has been removed.
 * These types are still referenced by Header.tsx and usePortfolioData.ts.
 */
export type FetchStatus = 'idle' | 'loading' | 'success' | 'error';

export interface LivePrices {
  [yahooSymbol: string]: { ltp: number; todayPct: number };
}
