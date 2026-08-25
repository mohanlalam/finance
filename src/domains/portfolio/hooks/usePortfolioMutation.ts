import { useCallback } from 'react';
import { portfolioService } from '../services/portfolioService';
import { AssetPayload } from '../../../types/portfolio';
import { AppApiError } from '../../../utils/apiClient';

interface UsePortfolioMutationOptions {
  onReload: () => Promise<void>;
  onAuthExpired?: () => void;
}

export function usePortfolioMutation({ onReload, onAuthExpired }: UsePortfolioMutationOptions) {
  const addPortfolio = useCallback(
    async (name: string, label: string) => {
      try {
        await portfolioService.addPortfolio(name, label);
        await onReload();
      } catch (err) {
        if (err instanceof AppApiError && err.code === 'auth') {
          onAuthExpired?.();
        }
        throw err;
      }
    },
    [onReload, onAuthExpired]
  );

  const renamePortfolio = useCallback(
    async (id: string, newLabel: string) => {
      try {
        await portfolioService.renamePortfolio(id, newLabel);
        await onReload();
      } catch (err) {
        if (err instanceof AppApiError && err.code === 'auth') {
          onAuthExpired?.();
        }
        throw err;
      }
    },
    [onReload, onAuthExpired]
  );

  const deletePortfolio = useCallback(
    async (id: string) => {
      try {
        await portfolioService.deletePortfolio(id);
        await onReload();
      } catch (err) {
        if (err instanceof AppApiError && err.code === 'auth') {
          onAuthExpired?.();
        }
        throw err;
      }
    },
    [onReload, onAuthExpired]
  );

  const addAsset = useCallback(
    async (
      assetType: string,
      portfolioName: string,
      payload: AssetPayload,
      options: { reload?: boolean } = {}
    ) => {
      try {
        const res = await portfolioService.addAsset(assetType, portfolioName, payload);
        if (options.reload !== false) {
          await onReload();
        }
        return res;
      } catch (err) {
        if (err instanceof AppApiError && err.code === 'auth') {
          onAuthExpired?.();
        }
        throw err;
      }
    },
    [onReload, onAuthExpired]
  );

  const updateAsset = useCallback(
    async (assetType: string, id: string, payload: Partial<AssetPayload>) => {
      try {
        await portfolioService.updateAsset(assetType, id, payload);
        await onReload();
      } catch (err) {
        if (err instanceof AppApiError && err.code === 'auth') {
          onAuthExpired?.();
        }
        throw err;
      }
    },
    [onReload, onAuthExpired]
  );

  const deleteAsset = useCallback(
    async (assetType: string, id: string) => {
      try {
        await portfolioService.deleteAsset(assetType, id);
        await onReload();
      } catch (err) {
        if (err instanceof AppApiError && err.code === 'auth') {
          onAuthExpired?.();
        }
        throw err;
      }
    },
    [onReload, onAuthExpired]
  );

  return {
    addPortfolio,
    renamePortfolio,
    deletePortfolio,
    addAsset,
    updateAsset,
    deleteAsset,
  };
}
