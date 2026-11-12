import { IMarketDataProvider } from '../types/MarketProvider';
import { MarketQuote, QuoteResult } from '../types/MarketQuote';
import { invokeFunction } from '../../../utils/apiClient';

export class YahooMarketDataProvider implements IMarketDataProvider {
  name = 'Yahoo Finance';

  async getQuotes(symbols: string[]): Promise<Map<string, MarketQuote>> {
    if (symbols.length === 0) return new Map();

    const resultMap = new Map<string, MarketQuote>();

    // In dev mode (localhost), proxy directly to Yahoo Finance to get full official NSE/BSE dayHigh and dayLow
    if (import.meta.env.DEV) {
      try {
        const fetchPromises = symbols.map(async (sym) => {
          try {
            const res = await fetch(`/api/yahoo/v8/finance/chart/${encodeURIComponent(sym)}?range=1d&interval=1d`);
            if (!res.ok) return null;
            const data = await res.json();
            const meta = data?.chart?.result?.[0]?.meta;
            if (!meta) return null;
            const ltp: number = meta.regularMarketPrice ?? meta.previousClose;
            const prevClose: number = meta.chartPreviousClose ?? meta.previousClose;
            const dayHigh: number | null = typeof meta.regularMarketDayHigh === 'number' ? meta.regularMarketDayHigh : null;
            const dayLow: number | null = typeof meta.regularMarketDayLow === 'number' ? meta.regularMarketDayLow : null;
            const todayPct = prevClose && ltp ? ((ltp - prevClose) / prevClose) * 100 : 0;
            return {
              symbol: sym,
              ltp,
              todayPct,
              dayHigh,
              dayLow,
              prevClose,
              lastUpdated: new Date().toISOString(),
              source: 'Yahoo Finance (Direct Proxy)',
            };
          } catch {
            return null;
          }
        });

        const devResults = await Promise.all(fetchPromises);
        devResults.forEach((r) => {
          if (r && r.ltp !== null) {
            resultMap.set(r.symbol.toUpperCase(), r);
          }
        });

        if (resultMap.size > 0) {
          return resultMap;
        }
      } catch {
        // Fallback to cloud edge function below
      }
    }

    const symbolsToFetch = symbols.map((s) => ({
      ticker: s,
      yahooSymbol: s,
    }));
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
              dayHigh: r.dayHigh ?? null,
              dayLow: r.dayLow ?? null,
              prevClose: r.prevClose ?? null,
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
