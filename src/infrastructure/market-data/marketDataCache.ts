import { STOCK_PRICE_CACHE_TTL } from '../../utils/constants';

interface CachedPriceItem {
  ltp: number;
  todayPct: number;
  timestamp: number;
}

const memoryPriceCache = new Map<string, CachedPriceItem>();

export function getCachedQuote(symbol: string): { ltp: number; todayPct: number } | null {
  const item = memoryPriceCache.get(symbol.toUpperCase());
  if (!item) return null;
  if (Date.now() - item.timestamp > STOCK_PRICE_CACHE_TTL) {
    memoryPriceCache.delete(symbol.toUpperCase());
    return null;
  }
  return { ltp: item.ltp, todayPct: item.todayPct };
}

export function setCachedQuote(symbol: string, ltp: number, todayPct: number): void {
  memoryPriceCache.set(symbol.toUpperCase(), {
    ltp,
    todayPct,
    timestamp: Date.now(),
  });
}

export function clearPriceCache(): void {
  memoryPriceCache.clear();
}
