import { yahooMarketDataProvider } from './providers/yahooProvider';
import { amfiMarketDataProvider } from './providers/amfiProvider';
import { mcxGoldDataProvider } from './providers/mcxProvider';
import { getCachedQuote, getStaleQuote, setCachedQuote } from './marketDataCache';
import { SYMBOL_ALIASES } from '../../utils/constants';
import { Holding } from '../../types/portfolio';

export class MarketDataService {
  private inFlightStockPromise: Promise<{
    priceMap: Record<string, { ltp: number; todayPct: number }>;
    failedSymbols: string[];
  }> | null = null;

  async fetchLiveStockPrices(
    holdings: Holding[]
  ): Promise<{ priceMap: Record<string, { ltp: number; todayPct: number }>; failedSymbols: string[] }> {
    if (holdings.length === 0) return { priceMap: {}, failedSymbols: [] };

    // Deduplicate concurrent in-flight calls
    if (this.inFlightStockPromise) {
      return this.inFlightStockPromise;
    }

    this.inFlightStockPromise = (async () => {
      try {
        const queryItems: { ticker: string; yahooSymbol: string; candidates: string[] }[] = [];

        holdings.forEach((h) => {
          const cleanTicker = (h.ticker || '').toUpperCase().trim();
          const cleanYahoo = (h.yahooSymbol || '').toUpperCase().trim();
          const aliasCandidates = SYMBOL_ALIASES[cleanTicker] || [];
          const candidates = Array.from(
            new Set([cleanYahoo, `${cleanTicker}.NS`, ...aliasCandidates])
          ).filter(Boolean);

          queryItems.push({
            ticker: h.ticker,
            yahooSymbol: h.yahooSymbol,
            candidates,
          });
        });

        const allCandidates = Array.from(
          new Set(queryItems.flatMap((item) => item.candidates))
        );

        const quotesMap = new Map<string, { ltp: number; todayPct: number }>();
        try {
          // Tier 1: Live Primary Provider
          const liveQuotes = await yahooMarketDataProvider.getQuotes(allCandidates);
          liveQuotes.forEach((v, k) => {
            if (v.ltp !== null && v.todayPct !== null) {
              quotesMap.set(k, { ltp: v.ltp, todayPct: v.todayPct });
            }
          });
        } catch {
          // Network failed; fallback to cache tiers below
        }

        const priceMap: Record<string, { ltp: number; todayPct: number }> = {};
        const failedSymbols: string[] = [];

        queryItems.forEach((item) => {
          let resolvedQuote: { ltp: number; todayPct: number } | undefined;

          for (const cand of item.candidates) {
            // Tier 1 Check
            const q = quotesMap.get(cand.toUpperCase());
            if (q && q.ltp !== null && q.todayPct !== null) {
              resolvedQuote = { ltp: q.ltp, todayPct: q.todayPct };
              setCachedQuote(cand, q.ltp, q.todayPct);
              break;
            }
            // Tier 2: Fresh In-Memory TTL Cache
            const cached = getCachedQuote(cand);
            if (cached) {
              resolvedQuote = cached;
              break;
            }
            // Tier 3: Last-Known Stale Quote
            const stale = getStaleQuote(cand);
            if (stale) {
              resolvedQuote = stale;
              break;
            }
          }

          if (resolvedQuote) {
            priceMap[item.yahooSymbol] = resolvedQuote;
          } else {
            failedSymbols.push(item.ticker);
          }
        });

        return { priceMap, failedSymbols };
      } finally {
        this.inFlightStockPromise = null;
      }
    })();

    return this.inFlightStockPromise;
  }

  async fetchMutualFundNAV(schemeCode: string) {
    return amfiMarketDataProvider.getNAV(schemeCode);
  }

  async fetchGoldBullionRate() {
    return mcxGoldDataProvider.getGoldSpotRate();
  }
}

export const marketDataService = new MarketDataService();
