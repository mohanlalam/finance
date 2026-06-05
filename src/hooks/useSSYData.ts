import { useMemo } from 'react';
import { usePortfolioState, usePortfolioActions } from '../contexts/PortfolioContext';

export function useSSYData() {
  const { portfolios, loadStatus, loadError, isMutating } = usePortfolioState();
  const { load, addSSYAccount, updateSSYAccount, deleteSSYAccount } = usePortfolioActions();

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
