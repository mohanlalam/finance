export interface MarketQuote {
  symbol: string;
  ltp: number;
  todayPct: number;
  dayHigh?: number | null;
  dayLow?: number | null;
  prevClose?: number | null;
  dayChange?: number;
  lastUpdated?: string;
  source: string;
}

export interface QuoteResult {
  ticker: string;
  ltp: number | null;
  todayPct: number | null;
  dayHigh?: number | null;
  dayLow?: number | null;
  prevClose?: number | null;
}
