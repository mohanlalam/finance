import { Portfolio } from '../../types/portfolio';
import { NetWorthSnapshot } from '../../domains/portfolio/calculations/netWorth';
import { getFromIDBCache, setInIDBCache, removeFromIDBCache } from './indexedDbCache';

export const PORTFOLIO_CACHE_KEY = 'family_portfolios_offline_cache';
export const PORTFOLIO_CACHE_VERSION = 3;

export interface CachedPortfolioPayload {
  version?: number;
  portfolios: Portfolio[];
  netWorthHistory: NetWorthSnapshot[];
  cachedAt: string;
}

export function isValidCachedData(data: unknown): data is CachedPortfolioPayload {
  if (data == null || typeof data !== 'object') return false;
  const obj = data as Record<string, unknown>;
  if (obj.version !== undefined && obj.version !== PORTFOLIO_CACHE_VERSION) return false;
  return Array.isArray(obj.portfolios);
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
