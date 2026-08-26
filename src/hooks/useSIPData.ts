import { useMemo } from 'react';
import { usePortfolioEntities, usePortfolioActions, usePortfolioStatus } from '../contexts/PortfolioContext';

export function useSIPData() {
  const { portfolios } = usePortfolioEntities();
  const { loadStatus, loadError, isMutating } = usePortfolioStatus();
  const { load, addSIPAccount, updateSIPAccount, deleteSIPAccount } = usePortfolioActions();

  const sipAccounts = useMemo(() => {
    return portfolios.flatMap((p) => p.sipAccounts || []);
  }, [portfolios]);

  return {
    sipAccounts,
    loading: loadStatus === 'loading' || isMutating,
    error: loadError || null,
    loadSIP: load,
    addSIPAccount,
    updateSIPAccount,
    deleteSIPAccount,
  };
}
