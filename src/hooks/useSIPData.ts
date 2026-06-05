import { useMemo } from 'react';
import { usePortfolioState, usePortfolioActions } from '../contexts/PortfolioContext';

export function useSIPData() {
  const { portfolios, loadStatus, loadError, isMutating } = usePortfolioState();
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
