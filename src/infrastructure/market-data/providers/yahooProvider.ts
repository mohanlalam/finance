import { IMarketDataProvider } from '../types/MarketProvider';
import { MarketQuote, QuoteResult } from '../types/MarketQuote';
import { invokeFunction } from '../../../utils/apiClient';

export class YahooMarketDataProvider implements IMarketDataProvider {
  name = 'Yahoo Finance';

  async getQuotes(symbols: string[]): Promise<Map<string, MarketQuote>> {
    if (symbols.length === 0) return new Map();

    const symbolsToFetch = symbols.map((s) => ({
      ticker: s,
      yahooSymbol: s,
    }));

    const resultMap = new Map<string, MarketQuote>();
    try {
      const json = await invokeFunction<{ data: QuoteResult[] }>('market-data', {
        method: 'POST',
        body: { symbols: symbolsToFetch },
      });

      if (json && Array.isArray(json.data)) {
        json.data.forEach((r) => {
          if (r.ltp !== null && r.todayPct !== null) {
            resultMap.set(r.ticker.toUpperCase(), {
              symbol: r.ticker,
              ltp: r.ltp,
              todayPct: r.todayPct,
              lastUpdated: new Date().toISOString(),
              source: 'Yahoo Finance',
            });
          }
        });
      }
    } catch {
      // Return empty map on network/provider failure to allow fallback tiers
    }

    return resultMap;
  }
}

export const yahooMarketDataProvider = new YahooMarketDataProvider();
