import { Portfolio } from '../../types/portfolio';
import { NetWorthSnapshot } from '../../domains/portfolio/calculations/netWorth';
import { getFromIDBCache, setInIDBCache, removeFromIDBCache } from './indexedDbCache';

export const PORTFOLIO_CACHE_KEY = 'family_portfolios_offline_cache';
export const PORTFOLIO_CACHE_VERSION = 3;
export const MAX_CACHE_AGE_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
export const STALE_CACHE_THRESHOLD_MS = 14 * 24 * 60 * 60 * 1000; // 14 days warning threshold

export interface CachedPortfolioPayload {
  version?: number;
  portfolios: Portfolio[];
  netWorthHistory: NetWorthSnapshot[];
  cachedAt: string;
}

export function isValidCachedData(data: unknown, maxAgeMs: number = MAX_CACHE_AGE_MS): data is CachedPortfolioPayload {
  if (data == null || typeof data !== 'object') return false;
  const obj = data as Record<string, unknown>;
  if (obj.version !== undefined && obj.version !== PORTFOLIO_CACHE_VERSION) return false;
  if (!Array.isArray(obj.portfolios)) return false;

  // Enforce maximum stale cutoff (e.g. 30 days) to prevent indefinite offline hydration of ancient balances
  if (obj.cachedAt && typeof obj.cachedAt === 'string') {
    const cachedTs = new Date(obj.cachedAt).getTime();
    if (!isNaN(cachedTs)) {
      const ageMs = Date.now() - cachedTs;
      if (ageMs > maxAgeMs) {
        return false;
      }
    }
  }

  return true;
}

/**
 * Checks if a cached portfolio payload is considered stale (e.g. older than 14 days).
 */
export function isCacheStale(cachedAtStr?: string, staleThresholdMs: number = STALE_CACHE_THRESHOLD_MS): boolean {
  if (!cachedAtStr) return true;
  const cachedTs = new Date(cachedAtStr).getTime();
  if (isNaN(cachedTs)) return true;
  return Date.now() - cachedTs > staleThresholdMs;
}

export async function getCachedPortfolioData(maxAgeMs: number = MAX_CACHE_AGE_MS): Promise<CachedPortfolioPayload | null> {
  const data = await getFromIDBCache<CachedPortfolioPayload>(PORTFOLIO_CACHE_KEY);
  if (isValidCachedData(data, maxAgeMs)) {
    return data;
  }
  return null;
}

export async function setCachedPortfolioData(
  portfolios: Portfolio[],
  netWorthHistory: NetWorthSnapshot[]
): Promise<void> {
  const payload: CachedPortfolioPayload = {
    version: PORTFOLIO_CACHE_VERSION,
    portfolios,
    netWorthHistory,
    cachedAt: new Date().toISOString(),
  };
  await setInIDBCache(PORTFOLIO_CACHE_KEY, payload);
}

export async function invalidatePortfolioCache(): Promise<void> {
  await removeFromIDBCache(PORTFOLIO_CACHE_KEY);
}
