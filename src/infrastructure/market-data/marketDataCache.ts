import { STOCK_PRICE_CACHE_TTL } from '../../utils/constants';

interface CachedPriceItem {
  ltp: number;
  todayPct: number;
  timestamp: number;
}

const memoryPriceCache = new Map<string, CachedPriceItem>();
const stalePriceCache = new Map<string, { ltp: number; todayPct: number }>();

export function getCachedQuote(symbol: string): { ltp: number; todayPct: number } | null {
  const item = memoryPriceCache.get(symbol.toUpperCase());
  if (!item) return null;
  if (Date.now() - item.timestamp > STOCK_PRICE_CACHE_TTL) {
    return null;
  }
  return { ltp: item.ltp, todayPct: item.todayPct };
}

export function getStaleQuote(symbol: string): { ltp: number; todayPct: number } | null {
  const fresh = getCachedQuote(symbol);
  if (fresh) return fresh;
  return stalePriceCache.get(symbol.toUpperCase()) || null;
}

export function setCachedQuote(symbol: string, ltp: number, todayPct: number): void {
  const sym = symbol.toUpperCase();
  memoryPriceCache.set(sym, {
    ltp,
    todayPct,
    timestamp: Date.now(),
  });
  stalePriceCache.set(sym, { ltp, todayPct });
}

export function clearPriceCache(): void {
  memoryPriceCache.clear();
}

