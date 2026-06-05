import { useMemo } from 'react';
import { usePortfolio } from '../contexts/PortfolioContext';

export function useSIPData() {
  const {
    portfolios,
    load,
    loadStatus,
    loadError,
    isMutating,
    addSIPAccount,
    updateSIPAccount,
    deleteSIPAccount,
  } = usePortfolio();

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
