export interface MarketQuote {
  symbol: string;
  ltp: number;
  todayPct: number;
  dayChange?: number;
  lastUpdated?: string;
  source: string;
}

export interface QuoteResult {
  ticker: string;
  ltp: number | null;
  todayPct: number | null;
}
