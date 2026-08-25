import { yahooMarketDataProvider } from './providers/yahooProvider';
import { amfiMarketDataProvider } from './providers/amfiProvider';
import { mcxGoldDataProvider } from './providers/mcxProvider';
import { getCachedQuote, setCachedQuote } from './marketDataCache';
import { SYMBOL_ALIASES } from '../../utils/constants';
import { Holding } from '../../types/portfolio';

export class MarketDataService {
  async fetchLiveStockPrices(
    holdings: Holding[]
  ): Promise<{ priceMap: Record<string, { ltp: number; todayPct: number }>; failedSymbols: string[] }> {
    if (holdings.length === 0) return { priceMap: {}, failedSymbols: [] };

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

    const quotesMap = await yahooMarketDataProvider.getQuotes(allCandidates);

    const priceMap: Record<string, { ltp: number; todayPct: number }> = {};
    const failedSymbols: string[] = [];

    queryItems.forEach((item) => {
      let resolvedQuote: { ltp: number; todayPct: number } | undefined;

      for (const cand of item.candidates) {
        const q = quotesMap.get(cand.toUpperCase());
        if (q && q.ltp !== null && q.todayPct !== null) {
          resolvedQuote = { ltp: q.ltp, todayPct: q.todayPct };
          setCachedQuote(cand, q.ltp, q.todayPct);
          break;
        }
        const cached = getCachedQuote(cand);
        if (cached) {
          resolvedQuote = cached;
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
  }

  async fetchMutualFundNAV(schemeCode: string) {
    return amfiMarketDataProvider.getNAV(schemeCode);
  }

  async fetchGoldBullionRate() {
    return mcxGoldDataProvider.getGoldSpotRate();
  }
}

export const marketDataService = new MarketDataService();
