import { useCallback, useMemo } from 'react';
import { usePortfolio } from '../contexts/PortfolioContext';
import { SSYPayload } from '../types/portfolio';

export function useSSYData() {
  const { portfolios, addAsset, updateAsset, deleteAsset, load, loadStatus, loadError } = usePortfolio();

  const ssyAccounts = useMemo(() => {
    return portfolios.flatMap((p) => p.ssyAccounts || []);
  }, [portfolios]);

  const addSSYAccount = useCallback(
    async (portfolioName: string, payload: SSYPayload) => {
      await addAsset('ssy_account', portfolioName, payload);
    },
    [addAsset]
  );

  const updateSSYAccount = useCallback(
    async (id: string, payload: Partial<SSYPayload>) => {
      await updateAsset('ssy_account', id, payload);
    },
    [updateAsset]
  );

  const deleteSSYAccount = useCallback(
    async (id: string) => {
      await deleteAsset('ssy_account', id);
    },
    [deleteAsset]
  );

  return {
    ssyAccounts,
    loading: loadStatus === 'loading',
    error: loadError || null,
    loadSSY: load,
    addSSYAccount,
    updateSSYAccount,
    deleteSSYAccount,
  };
}
