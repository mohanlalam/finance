import { useMemo } from 'react';
import { usePortfolioState, usePortfolioActions } from '../contexts/PortfolioContext';

export function useRDData() {
  const { portfolios, loadStatus, loadError, isMutating } = usePortfolioState();
  const { load, addRDAccount, updateRDAccount, deleteRDAccount } = usePortfolioActions();

  const rdAccounts = useMemo(() => {
    return portfolios.flatMap((p) => p.rdAccounts || []);
  }, [portfolios]);

  return {
    rdAccounts,
    loading: loadStatus === 'loading' || isMutating,
    error: loadError || null,
    loadRD: load,
    addRDAccount,
    updateRDAccount,
    deleteRDAccount,
  };
}
