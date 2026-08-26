import { useMemo } from 'react';
import { usePortfolioEntities, usePortfolioActions, usePortfolioStatus } from '../contexts/PortfolioContext';

export function useRDData() {
  const { portfolios } = usePortfolioEntities();
  const { loadStatus, loadError, isMutating } = usePortfolioStatus();
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
