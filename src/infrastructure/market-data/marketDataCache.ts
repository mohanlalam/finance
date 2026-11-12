import { STOCK_PRICE_CACHE_TTL } from '../../utils/constants';

interface CachedPriceItem {
  ltp: number;
  todayPct: number;
  dayHigh?: number | null;
  dayLow?: number | null;
  prevClose?: number | null;
  timestamp: number;
}

export interface QuoteCachePayload {
  ltp: number;
  todayPct: number;
  dayHigh?: number | null;
  dayLow?: number | null;
  prevClose?: number | null;
}

const memoryPriceCache = new Map<string, CachedPriceItem>();
const stalePriceCache = new Map<string, QuoteCachePayload>();

export function getCachedQuote(symbol: string): QuoteCachePayload | null {
  const item = memoryPriceCache.get(symbol.toUpperCase());
  if (!item) return null;
  if (Date.now() - item.timestamp > STOCK_PRICE_CACHE_TTL) {
    return null;
  }
  return {
    ltp: item.ltp,
    todayPct: item.todayPct,
    dayHigh: item.dayHigh,
    dayLow: item.dayLow,
    prevClose: item.prevClose,
  };
}

export function getStaleQuote(symbol: string): QuoteCachePayload | null {
  const fresh = getCachedQuote(symbol);
  if (fresh) return fresh;
  return stalePriceCache.get(symbol.toUpperCase()) || null;
}

const MAX_CACHE_ENTRIES = 500;

export function setCachedQuote(
  symbol: string,
  ltp: number,
  todayPct: number,
  dayHigh?: number | null,
  dayLow?: number | null,
  prevClose?: number | null
): void {
  const sym = symbol.toUpperCase();
  // Prevent unbounded memory growth over long-lived sessions
  if (stalePriceCache.size >= MAX_CACHE_ENTRIES && !stalePriceCache.has(sym)) {
    const oldestKey = stalePriceCache.keys().next().value;
    if (oldestKey) stalePriceCache.delete(oldestKey);
  }
  if (memoryPriceCache.size >= MAX_CACHE_ENTRIES && !memoryPriceCache.has(sym)) {
    const oldestKey = memoryPriceCache.keys().next().value;
    if (oldestKey) memoryPriceCache.delete(oldestKey);
  }

  const payload: QuoteCachePayload = {
    ltp,
    todayPct,
    dayHigh: dayHigh ?? null,
    dayLow: dayLow ?? null,
    prevClose: prevClose ?? null,
  };

  memoryPriceCache.set(sym, {
    ...payload,
    timestamp: Date.now(),
  });
  stalePriceCache.set(sym, payload);
}

export function clearPriceCache(): void {
  memoryPriceCache.clear();
  stalePriceCache.clear();
}

