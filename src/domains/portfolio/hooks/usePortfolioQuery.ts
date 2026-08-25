import { useState, useEffect, useRef, useCallback } from 'react';
import useSWR from 'swr';
import { Portfolio } from '../../../types/portfolio';
import { NetWorthSnapshot } from '../calculations/netWorth';
import { sortPortfolios } from '../calculations/portfolioOrdering';
import { portfolioService } from '../services/portfolioService';
import { swrDefaultConfig } from '../../../infrastructure/cache/swrConfig';
import { AppApiError } from '../../../utils/apiClient';

export type LoadStatus = 'idle' | 'loading' | 'success' | 'error';

interface UsePortfolioQueryResult {
  portfolios: Portfolio[];
  setPortfolios: React.Dispatch<React.SetStateAction<Portfolio[]>>;
  netWorthHistory: NetWorthSnapshot[];
  setNetWorthHistory: React.Dispatch<React.SetStateAction<NetWorthSnapshot[]>>;
  loadStatus: LoadStatus;
  loadError: string;
  isUsingCachedData: boolean;
  cacheUpdatedAt: Date | null;
  lastUpdated: Date | null;
  load: () => Promise<void>;
  mutate: () => Promise<void>;
}

export function usePortfolioQuery(onAuthExpired?: () => void): UsePortfolioQueryResult {
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [netWorthHistory, setNetWorthHistory] = useState<NetWorthSnapshot[]>([]);
  const [loadStatus, setLoadStatus] = useState<LoadStatus>('idle');
  const [loadError, setLoadError] = useState<string>('');
  const [isUsingCachedData, setIsUsingCachedData] = useState(false);
  const [cacheUpdatedAt, setCacheUpdatedAt] = useState<Date | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const hasHydratedRef = useRef(false);

  // 1. Hydrate from IndexedDB cache immediately on mount
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const cached = await portfolioService.getOfflineCachedPortfolios();
        if (active && cached && !hasHydratedRef.current) {
          setPortfolios(sortPortfolios(cached.portfolios));
          setNetWorthHistory(cached.netWorthHistory);
          setIsUsingCachedData(true);
          setCacheUpdatedAt(new Date(cached.cachedAt));
          setLoadStatus('success');
        }
      } catch {
        // Cache error, proceed to network fetch
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  // 2. Fetch fresh data via SWR
  const fetcher = useCallback(async () => {
    return portfolioService.loadPortfolios();
  }, []);

  const { error, isLoading, mutate: swrMutate } = useSWR('portfolio_data_swr', fetcher, {
    ...swrDefaultConfig,
    onSuccess: (freshData) => {
      hasHydratedRef.current = true;
      setPortfolios(sortPortfolios(freshData.portfolios));
      setNetWorthHistory(freshData.netWorthHistory);
      setIsUsingCachedData(false);
      setLoadStatus('success');
      setLoadError('');
      setLastUpdated(new Date());
    },
    onError: (err) => {
      if (err instanceof AppApiError && err.code === 'auth') {
        onAuthExpired?.();
      }
      setLoadError(err instanceof Error ? err.message : 'Failed to load portfolio');
      // If we don't already have cached data in memory, set status to error
      if (!hasHydratedRef.current && portfolios.length === 0) {
        setLoadStatus('error');
      }
    },
  });

  const load = useCallback(async () => {
    setLoadStatus('loading');
    try {
      const fresh = await swrMutate();
      if (fresh) {
        setPortfolios(sortPortfolios(fresh.portfolios));
        setNetWorthHistory(fresh.netWorthHistory);
        setIsUsingCachedData(false);
        setLoadStatus('success');
        setLastUpdated(new Date());
      }
    } catch (err) {
      if (err instanceof AppApiError && err.code === 'auth') {
        onAuthExpired?.();
      }
      setLoadError(err instanceof Error ? err.message : 'Failed to reload');
      if (portfolios.length === 0) {
        setLoadStatus('error');
      }
    }
  }, [swrMutate, onAuthExpired, portfolios.length]);

  return {
    portfolios,
    setPortfolios,
    netWorthHistory,
    setNetWorthHistory,
    loadStatus: isLoading && portfolios.length === 0 ? 'loading' : loadStatus,
    loadError: error ? (error instanceof Error ? error.message : String(error)) : loadError,
    isUsingCachedData,
    cacheUpdatedAt,
    lastUpdated,
    load,
    mutate: load,
  };
}
