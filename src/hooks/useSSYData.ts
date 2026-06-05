import { useMemo } from 'react';
import { usePortfolio } from '../contexts/PortfolioContext';

export function useSSYData() {
  const {
    portfolios,
    load,
    loadStatus,
    loadError,
    isMutating,
    addSSYAccount,
    updateSSYAccount,
    deleteSSYAccount,
  } = usePortfolio();

  const ssyAccounts = useMemo(() => {
    return portfolios.flatMap((p) => p.ssyAccounts || []);
  }, [portfolios]);

  return {
    ssyAccounts,
    loading: loadStatus === 'loading' || isMutating,
    error: loadError || null,
    loadSSY: load,
    addSSYAccount,
    updateSSYAccount,
    deleteSSYAccount,
  };
}
