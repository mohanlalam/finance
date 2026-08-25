import { MarketQuote } from './MarketQuote';

export interface IMarketDataProvider {
  name: string;
  getQuotes(symbols: string[]): Promise<Map<string, MarketQuote>>;
}
