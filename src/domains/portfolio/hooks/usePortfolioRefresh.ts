import { useState, useCallback, useEffect, useRef } from 'react';
import { Portfolio } from '../../../types/portfolio';
import { marketDataService } from '../../../infrastructure/market-data/marketDataService';
import { portfolioCalculationService } from '../services/portfolioCalculationService';
import { STOCK_PRICE_CACHE_TTL, VISIBILITY_REFRESH_COOLDOWN } from '../../../utils/constants';

interface UsePortfolioRefreshOptions {
  portfolios: Portfolio[];
  setPortfolios: React.Dispatch<React.SetStateAction<Portfolio[]>>;
  onReload: () => Promise<void>;
}

export function usePortfolioRefresh({
  portfolios,
  setPortfolios,
  onReload,
}: UsePortfolioRefreshOptions) {
  const [priceStatus, setPriceStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [failedSymbols, setFailedSymbols] = useState<string[]>([]);
  const [lastPriceFetch, setLastPriceFetchState] = useState<Date | null>(() => {
    try {
      const saved = localStorage.getItem('finance_last_price_fetch');
      return saved ? new Date(saved) : null;
    } catch {
      return null;
    }
  });

  const setLastPriceFetch = useCallback((date: Date) => {
    setLastPriceFetchState(date);
    try {
      localStorage.setItem('finance_last_price_fetch', date.toISOString());
    } catch {
      // ignore
    }
  }, []);

  const isPriceStale = lastPriceFetch
    ? Date.now() - lastPriceFetch.getTime() > STOCK_PRICE_CACHE_TTL
    : true;

  const refreshPrices = useCallback(
    async (targetPortfolios?: Portfolio[]) => {
      const currentList = targetPortfolios || portfolios;
      const allHoldings = currentList.flatMap((p) => p.holdings || []);
      if (allHoldings.length === 0) return;

      setPriceStatus('loading');
      try {
        const { priceMap, failedSymbols: fails } =
          await marketDataService.fetchLiveStockPrices(allHoldings);
        setFailedSymbols(fails);

        setPortfolios((prev) => {
          return portfolioCalculationService.applyLivePrices(prev, priceMap);
        });

        const now = new Date();
        setLastPriceFetch(now);
        setPriceStatus('success');
      } catch {
        setPriceStatus('error');
      }
    },
    [portfolios, setPortfolios, setLastPriceFetch]
  );

  // Background refresh on visibility resume
  const lastRefreshRef = useRef<number>(Date.now());
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        const now = Date.now();
        if (now - lastRefreshRef.current >= VISIBILITY_REFRESH_COOLDOWN) {
          lastRefreshRef.current = now;
          onReload().catch(() => {});
          if (isPriceStale) {
            refreshPrices().catch(() => {});
          }
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [onReload, isPriceStale, refreshPrices]);

  return {
    priceStatus,
    failedSymbols,
    lastPriceFetch,
    isPriceStale,
    refreshPrices,
  };
}
