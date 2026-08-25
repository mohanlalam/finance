import { useMemo, useCallback } from 'react';
import { usePortfolioQuery } from './usePortfolioQuery';
import { usePortfolioMutation } from './usePortfolioMutation';
import { usePortfolioRefresh } from './usePortfolioRefresh';
import { usePortfolioSync } from './usePortfolioSync';

interface UsePortfolioStateOptions {
  onAuthExpired?: () => void;
}

export function usePortfolioState({ onAuthExpired }: UsePortfolioStateOptions = {}) {
  const query = usePortfolioQuery(onAuthExpired);
  const mutations = usePortfolioMutation({
    onReload: query.load,
    onAuthExpired,
  });
  const refresh = usePortfolioRefresh({
    portfolios: query.portfolios,
    setPortfolios: query.setPortfolios,
    onReload: query.load,
  });
  const sync = usePortfolioSync();

  const refreshSnapshot = useCallback(async () => {
    await query.load();
  }, [query]);

  return useMemo(
    () => ({
      portfolios: query.portfolios,
      netWorthHistory: query.netWorthHistory,
      loadStatus: query.loadStatus,
      loadError: query.loadError,
      priceStatus: refresh.priceStatus,
      lastUpdated: query.lastUpdated,
      failedSymbols: refresh.failedSymbols,
      isUsingCachedData: query.isUsingCachedData,
      cacheUpdatedAt: query.cacheUpdatedAt,
      isAuthRequired: false,
      isMutating: sync.isMutating,
      isMutatingRef: sync.isMutatingRef,
      lastPriceFetch: refresh.lastPriceFetch,
      isPriceStale: refresh.isPriceStale,
      load: query.load,
      refreshSnapshot,
      refreshPrices: refresh.refreshPrices,
      addPortfolio: mutations.addPortfolio,
      renamePortfolio: mutations.renamePortfolio,
      deletePortfolio: mutations.deletePortfolio,
      addAsset: mutations.addAsset,
      updateAsset: mutations.updateAsset,
      deleteAsset: mutations.deleteAsset,
    }),
    [query, mutations, refresh, sync, refreshSnapshot]
  );
}
