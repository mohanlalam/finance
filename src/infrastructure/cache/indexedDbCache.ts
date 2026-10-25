import * as idb from 'idb-keyval';
import { logger } from '../logging/logger';

export interface CacheEntryMeta {
  key: string;
  sizeBytes: number;
  lastAccessed: number;
  updatedAt: number;
}

export interface CacheStorageMetrics {
  entryCount: number;
  estimatedSizeBytes: number;
  oldestTimestamp?: number;
  newestTimestamp?: number;
}

export const LRU_META_KEY = '_agy_cache_lru_meta_v1';
export const DEFAULT_MAX_STORAGE_BYTES = 50 * 1024 * 1024; // 50 MB
export const DEFAULT_MAX_CACHE_ENTRIES = 100;

export const PROTECTED_CACHE_KEYS = new Set([
  'portfolio_offline_outbox_v1',
  'finance_portfolio_cache_v1',
  LRU_META_KEY,
]);

const memoryStore = new Map<string, string>();
let inMemoryLruMeta: Record<string, CacheEntryMeta> = {};

function isIndexedDBAvailable(): boolean {
  return typeof indexedDB !== 'undefined';
}

/**
 * Loads the LRU metadata map from IDB or memory cache.
 */
async function loadLruMeta(): Promise<Record<string, CacheEntryMeta>> {
  if (!isIndexedDBAvailable()) {
    return { ...inMemoryLruMeta };
  }

  try {
    const raw = await idb.get(LRU_META_KEY);
    if (!raw) return {};
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
    return typeof parsed === 'object' && parsed !== null ? (parsed as Record<string, CacheEntryMeta>) : {};
  } catch (err) {
    logger.warn('Failed to load cache LRU metadata:', { error: String(err) });
    return {};
  }
}

/**
 * Persists the LRU metadata map to IDB or memory cache.
 */
async function saveLruMeta(meta: Record<string, CacheEntryMeta>): Promise<void> {
  inMemoryLruMeta = { ...meta };
  if (!isIndexedDBAvailable()) {
    return;
  }

  try {
    await idb.set(LRU_META_KEY, JSON.stringify(meta));
  } catch (err) {
    logger.warn('Failed to save cache LRU metadata:', { error: String(err) });
  }
}

/**
 * Enforces the storage budget by evicting the oldest un-accessed non-protected entries.
 */
export async function enforceCacheStorageBudget(
  maxBytes: number = DEFAULT_MAX_STORAGE_BYTES,
  maxEntries: number = DEFAULT_MAX_CACHE_ENTRIES
): Promise<{ evictedCount: number; freedBytes: number }> {
  const meta = await loadLruMeta();
  const entries = Object.values(meta);

  let totalBytes = entries.reduce((sum, e) => sum + (e.sizeBytes || 0), 0);
  let totalCount = entries.length;

  if (totalBytes <= maxBytes && totalCount <= maxEntries) {
    return { evictedCount: 0, freedBytes: 0 };
  }

  // Target 80% watermark for larger budgets, or exact cap for small limits
  const targetBytes = maxBytes <= 1024 ? maxBytes : Math.floor(maxBytes * 0.8);
  const targetCount = maxEntries <= 2 ? maxEntries : Math.floor(maxEntries * 0.8);

  // Filter out protected keys and sort ascending by lastAccessed (oldest first)
  const evictable = entries
    .filter((e) => !PROTECTED_CACHE_KEYS.has(e.key))
    .sort((a, b) => a.lastAccessed - b.lastAccessed);

  let evictedCount = 0;
  let freedBytes = 0;

  for (const entry of evictable) {
    if (totalBytes <= targetBytes && totalCount <= targetCount) {
      break;
    }

    try {
      if (isIndexedDBAvailable()) {
        await idb.del(entry.key);
      } else {
        memoryStore.delete(entry.key);
      }

      delete meta[entry.key];
      totalBytes -= entry.sizeBytes || 0;
      totalCount -= 1;
      freedBytes += entry.sizeBytes || 0;
      evictedCount += 1;
    } catch (err) {
      logger.warn(`Failed to evict cache key '${entry.key}':`, { error: String(err) });
    }
  }

  if (evictedCount > 0) {
    await saveLruMeta(meta);
    logger.info(`[Cache LRU] Evicted ${evictedCount} items, freed ${(freedBytes / 1024).toFixed(1)} KB`);
  }

  return { evictedCount, freedBytes };
}

/**
 * Retrieves aggregate storage metrics for telemetry and diagnostics.
 */
export async function getCacheStorageMetrics(): Promise<CacheStorageMetrics> {
  const meta = await loadLruMeta();
  const entries = Object.values(meta);

  if (entries.length === 0) {
    return { entryCount: 0, estimatedSizeBytes: 0 };
  }

  let totalBytes = 0;
  let oldest = Infinity;
  let newest = -Infinity;

  for (const e of entries) {
    totalBytes += e.sizeBytes || 0;
    if (e.lastAccessed < oldest) oldest = e.lastAccessed;
    if (e.lastAccessed > newest) newest = e.lastAccessed;
  }

  return {
    entryCount: entries.length,
    estimatedSizeBytes: totalBytes,
    oldestTimestamp: oldest === Infinity ? undefined : oldest,
    newestTimestamp: newest === -Infinity ? undefined : newest,
  };
}

export async function getFromIDBCache<T>(key: string, timeoutMs = 1500): Promise<T | null> {
  if (!isIndexedDBAvailable()) {
    const mem = memoryStore.get(key);
    if (!mem) return null;

    // Asynchronously record access in LRU metadata
    if (inMemoryLruMeta[key]) {
      inMemoryLruMeta[key].lastAccessed = Date.now();
    }

    try {
      return JSON.parse(mem) as T;
    } catch {
      return null;
    }
  }

  try {
    const raw = await Promise.race([
      idb.get(key),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), timeoutMs)),
    ]);
    if (!raw) return null;

    // Asynchronously update lastAccessed without blocking caller
    void loadLruMeta().then((meta) => {
      if (meta[key]) {
        meta[key].lastAccessed = Date.now();
        void saveLruMeta(meta);
      }
    });

    return typeof raw === 'string' ? (JSON.parse(raw) as T) : (raw as T);
  } catch (err) {
    logger.warn(`Failed to read key '${key}' from IndexedDB:`, { error: String(err) });
    // Self-heal: purge corrupted record to prevent boot-loop JSON parse failures
    idb.del(key).catch(() => {});
    return null;
  }
}

export async function setInIDBCache<T>(key: string, value: T): Promise<void> {
  const serialized = typeof value === 'string' ? value : JSON.stringify(value);
  const sizeBytes = typeof Blob !== 'undefined' ? new Blob([serialized]).size : serialized.length;
  const now = Date.now();

  if (!isIndexedDBAvailable()) {
    memoryStore.set(key, serialized);
    inMemoryLruMeta[key] = {
      key,
      sizeBytes,
      lastAccessed: now,
      updatedAt: now,
    };
    await enforceCacheStorageBudget();
    return;
  }

  try {
    await idb.set(key, serialized);

    // Update LRU metadata and enforce budget
    const meta = await loadLruMeta();
    meta[key] = {
      key,
      sizeBytes,
      lastAccessed: now,
      updatedAt: now,
    };
    await saveLruMeta(meta);
    await enforceCacheStorageBudget();
  } catch (err) {
    logger.warn(`Failed to write key '${key}' to IndexedDB:`, { error: String(err) });
  }
}

export async function removeFromIDBCache(key: string): Promise<void> {
  if (!isIndexedDBAvailable()) {
    memoryStore.delete(key);
    delete inMemoryLruMeta[key];
    return;
  }

  try {
    await idb.del(key);
    const meta = await loadLruMeta();
    if (meta[key]) {
      delete meta[key];
      await saveLruMeta(meta);
    }
  } catch (err) {
    logger.warn(`Failed to delete key '${key}' from IndexedDB:`, { error: String(err) });
  }
}
