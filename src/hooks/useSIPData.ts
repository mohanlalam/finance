import { useCallback, useMemo } from 'react';
import { usePortfolio } from '../contexts/PortfolioContext';
import { SIPPayload } from '../types/portfolio';

export function useSIPData() {
  const { portfolios, addAsset, updateAsset, deleteAsset, load, loadStatus, loadError } = usePortfolio();

  const sipAccounts = useMemo(() => {
    return portfolios.flatMap((p) => p.sipAccounts || []);
  }, [portfolios]);

  const addSIPAccount = useCallback(
    async (portfolioName: string, payload: SIPPayload) => {
      await addAsset('sip_account', portfolioName, payload);
    },
    [addAsset]
  );

  const updateSIPAccount = useCallback(
    async (id: string, payload: Partial<SIPPayload>) => {
      await updateAsset('sip_account', id, payload);
    },
    [updateAsset]
  );

  const deleteSIPAccount = useCallback(
    async (id: string) => {
      await deleteAsset('sip_account', id);
    },
    [deleteAsset]
  );

  return {
    sipAccounts,
    loading: loadStatus === 'loading',
    error: loadError || null,
    loadSIP: load,
    addSIPAccount,
    updateSIPAccount,
    deleteSIPAccount,
  };
}
