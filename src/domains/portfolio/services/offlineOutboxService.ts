import { getFromIDBCache, setInIDBCache, removeFromIDBCache } from '../../../infrastructure/cache/indexedDbCache';
import { portfolioService } from './portfolioService';
import { portfolioSyncService } from './portfolioSyncService';
import { logger } from '../../../infrastructure/logging/logger';
import { AssetPayload } from '../../../types/portfolio';

export type MutationType =
  | 'ADD_PORTFOLIO'
  | 'RENAME_PORTFOLIO'
  | 'DELETE_PORTFOLIO'
  | 'ADD_ASSET'
  | 'UPDATE_ASSET'
  | 'DELETE_ASSET';

export interface QueuedMutation {
  id: string;
  type: MutationType;
  params: Record<string, unknown>;
  timestamp: number;
  retryCount: number;
}

const OUTBOX_STORAGE_KEY = 'portfolio_offline_outbox_v1';

export class OfflineOutboxService {
  private isDraining = false;
  private syncListeners = new Set<(pendingCount: number) => void>();

  subscribe(listener: (pendingCount: number) => void): () => void {
    this.syncListeners.add(listener);
    return () => this.syncListeners.delete(listener);
  }

  private notifyListeners(count: number) {
    this.syncListeners.forEach((fn) => {
      try {
        fn(count);
      } catch {
        // Ignore listener exceptions
      }
    });
  }

  async getQueue(): Promise<QueuedMutation[]> {
    try {
      const items = await getFromIDBCache<QueuedMutation[]>(OUTBOX_STORAGE_KEY);
      return Array.isArray(items) ? items : [];
    } catch {
      return [];
    }
  }

  async enqueue(type: MutationType, params: Record<string, unknown>): Promise<QueuedMutation> {
    const queue = await this.getQueue();
    const item: QueuedMutation = {
      id: `outbox_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      type,
      params,
      timestamp: Date.now(),
      retryCount: 0,
    };

    queue.push(item);
    await setInIDBCache(OUTBOX_STORAGE_KEY, queue);
    this.notifyListeners(queue.length);
    logger.info(`[Outbox] Queued mutation: ${type} (${item.id})`);
    return item;
  }

  async remove(id: string): Promise<void> {
    const queue = await this.getQueue();
    const filtered = queue.filter((m) => m.id !== id);
    if (filtered.length === 0) {
      await removeFromIDBCache(OUTBOX_STORAGE_KEY);
    } else {
      await setInIDBCache(OUTBOX_STORAGE_KEY, filtered);
    }
    this.notifyListeners(filtered.length);
  }

  async getPendingCount(): Promise<number> {
    const queue = await this.getQueue();
    return queue.length;
  }

  async drain(onSuccess?: () => Promise<void>): Promise<{ synced: number; failed: number }> {
    if (this.isDraining) return { synced: 0, failed: 0 };
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      return { synced: 0, failed: 0 };
    }

    this.isDraining = true;
    let synced = 0;
    let failed = 0;

    try {
      const queue = await this.getQueue();
      if (queue.length === 0) {
        return { synced: 0, failed: 0 };
      }

      logger.info(`[Outbox] Draining ${queue.length} pending mutations...`);

      for (const item of queue) {
        try {
          await portfolioSyncService.runMutation(async () => {
            switch (item.type) {
              case 'ADD_PORTFOLIO':
                await portfolioService.addPortfolio(
                  item.params.name as string,
                  item.params.label as string
                );
                break;
              case 'RENAME_PORTFOLIO':
                await portfolioService.renamePortfolio(
                  item.params.id as string,
                  item.params.newLabel as string
                );
                break;
              case 'DELETE_PORTFOLIO':
                await portfolioService.deletePortfolio(item.params.id as string);
                break;
              case 'ADD_ASSET':
                await portfolioService.addAsset(
                  item.params.assetType as string,
                  item.params.portfolioName as string,
                  item.params.payload as AssetPayload
                );
                break;
              case 'UPDATE_ASSET':
                await portfolioService.updateAsset(
                  item.params.assetType as string,
                  item.params.id as string,
                  item.params.payload as Partial<AssetPayload>
                );
                break;
              case 'DELETE_ASSET':
                await portfolioService.deleteAsset(
                  item.params.assetType as string,
                  item.params.id as string
                );
                break;
            }
          });

          await this.remove(item.id);
          synced++;
        } catch (err) {
          logger.error(`[Outbox] Failed to sync mutation ${item.id}:`, err);
          failed++;
          item.retryCount = (item.retryCount || 0) + 1;
          const currentQueue = await this.getQueue();
          const idx = currentQueue.findIndex((m) => m.id === item.id);
          if (idx !== -1) {
            currentQueue[idx] = item;
            await setInIDBCache(OUTBOX_STORAGE_KEY, currentQueue);
          }
          break;
        }
      }

      if (synced > 0 && onSuccess) {
        await onSuccess();
      }
    } finally {
      this.isDraining = false;
      const remaining = await this.getPendingCount();
      this.notifyListeners(remaining);
    }

    return { synced, failed };
  }

  initAutoSync(onSyncSuccess?: () => Promise<void>): () => void {
    if (typeof window === 'undefined') return () => {};

    const handleOnline = () => {
      logger.info('[Outbox] Network restored, draining outbox queue...');
      this.drain(onSyncSuccess);
    };

    window.addEventListener('online', handleOnline);

    if (navigator.onLine) {
      setTimeout(() => this.drain(onSyncSuccess), 1500);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
    };
  }
}

export const offlineOutboxService = new OfflineOutboxService();

