import { useCallback, useMemo } from 'react';
import { usePortfolio } from '../contexts/PortfolioContext';
import { RDPayload } from '../types/portfolio';

export function useRDData() {
  const { portfolios, addAsset, updateAsset, deleteAsset, load, loadStatus, loadError } = usePortfolio();

  const rdAccounts = useMemo(() => {
    return portfolios.flatMap((p) => p.rdAccounts || []);
  }, [portfolios]);

  const addRDAccount = useCallback(
    async (portfolioName: string, payload: RDPayload) => {
      await addAsset('rd_account', portfolioName, payload);
    },
    [addAsset]
  );

  const updateRDAccount = useCallback(
    async (id: string, payload: Partial<RDPayload>) => {
      await updateAsset('rd_account', id, payload);
    },
    [updateAsset]
  );

  const deleteRDAccount = useCallback(
    async (id: string) => {
      await deleteAsset('rd_account', id);
    },
    [deleteAsset]
  );

  return {
    rdAccounts,
    loading: loadStatus === 'loading',
    error: loadError || null,
    loadRD: load,
    addRDAccount,
    updateRDAccount,
    deleteRDAccount,
  };
}
