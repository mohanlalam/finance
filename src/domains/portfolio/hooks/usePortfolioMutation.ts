import { useCallback, useEffect } from 'react';
import { portfolioService } from '../services/portfolioService';
import { offlineOutboxService } from '../services/offlineOutboxService';
import { AssetPayload } from '../../../types/portfolio';
import { AppApiError } from '../../../utils/apiClient';

interface UsePortfolioMutationOptions {
  onReload: () => Promise<void>;
  onAuthExpired?: () => void;
}

function isNetworkError(err: unknown): boolean {
  if (typeof navigator !== 'undefined' && !navigator.onLine) return true;
  if (err instanceof AppApiError && (err.code === 'network' || err.code === 'timeout')) {
    return true;
  }
  if (err instanceof TypeError && err.message.toLowerCase().includes('failed to fetch')) {
    return true;
  }
  return false;
}

export function usePortfolioMutation({ onReload, onAuthExpired }: UsePortfolioMutationOptions) {
  // Initialize auto-sync listener
  useEffect(() => {
    const cleanup = offlineOutboxService.initAutoSync(onReload);
    return cleanup;
  }, [onReload]);

  const addPortfolio = useCallback(
    async (name: string, label: string) => {
      try {
        await portfolioService.addPortfolio(name, label);
        await onReload();
      } catch (err) {
        if (err instanceof AppApiError && err.code === 'auth') {
          onAuthExpired?.();
          throw err;
        }
        if (isNetworkError(err)) {
          await offlineOutboxService.enqueue('ADD_PORTFOLIO', { name, label });
          return;
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
          throw err;
        }
        if (isNetworkError(err)) {
          await offlineOutboxService.enqueue('RENAME_PORTFOLIO', { id, newLabel });
          return;
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
          throw err;
        }
        if (isNetworkError(err)) {
          await offlineOutboxService.enqueue('DELETE_PORTFOLIO', { id });
          return;
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
          throw err;
        }
        if (isNetworkError(err)) {
          await offlineOutboxService.enqueue('ADD_ASSET', { assetType, portfolioName, payload });
          return { id: `offline_${Date.now()}` };
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
          throw err;
        }
        if (isNetworkError(err)) {
          await offlineOutboxService.enqueue('UPDATE_ASSET', { assetType, id, payload });
          return;
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
          throw err;
        }
        if (isNetworkError(err)) {
          await offlineOutboxService.enqueue('DELETE_ASSET', { assetType, id });
          return;
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
    drainOutbox: offlineOutboxService.drain.bind(offlineOutboxService),
  };
}
