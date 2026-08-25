import { Portfolio } from '../../types/portfolio';
import { NetWorthSnapshot } from '../../domains/portfolio/calculations/netWorth';
import { getFromIDBCache, setInIDBCache, removeFromIDBCache } from './indexedDbCache';

export const PORTFOLIO_CACHE_KEY = 'family_portfolios_offline_cache';

export interface CachedPortfolioPayload {
  portfolios: Portfolio[];
  netWorthHistory: NetWorthSnapshot[];
  cachedAt: string;
}

export function isValidCachedData(data: unknown): data is CachedPortfolioPayload {
  return (
    data != null &&
    typeof data === 'object' &&
    Array.isArray((data as Record<string, unknown>).portfolios)
  );
}

export async function getCachedPortfolioData(): Promise<CachedPortfolioPayload | null> {
  const data = await getFromIDBCache<CachedPortfolioPayload>(PORTFOLIO_CACHE_KEY);
  if (isValidCachedData(data)) {
    return data;
  }
  return null;
}

export async function setCachedPortfolioData(
  portfolios: Portfolio[],
  netWorthHistory: NetWorthSnapshot[]
): Promise<void> {
  const payload: CachedPortfolioPayload = {
    portfolios,
    netWorthHistory,
    cachedAt: new Date().toISOString(),
  };
  await setInIDBCache(PORTFOLIO_CACHE_KEY, payload);
}

export async function invalidatePortfolioCache(): Promise<void> {
  await removeFromIDBCache(PORTFOLIO_CACHE_KEY);
}
