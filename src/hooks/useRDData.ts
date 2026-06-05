import { useMemo } from 'react';
import { usePortfolio } from '../contexts/PortfolioContext';

export function useRDData() {
  const {
    portfolios,
    load,
    loadStatus,
    loadError,
    isMutating,
    addRDAccount,
    updateRDAccount,
    deleteRDAccount,
  } = usePortfolio();

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
