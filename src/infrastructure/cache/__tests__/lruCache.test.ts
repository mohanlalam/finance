// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  setInIDBCache,
  getFromIDBCache,
  removeFromIDBCache,
  enforceCacheStorageBudget,
  getCacheStorageMetrics,
  PROTECTED_CACHE_KEYS,
  LRU_META_KEY,
} from '../indexedDbCache';

describe('IndexedDB Cache LRU Eviction & Storage Quota', () => {
  beforeEach(async () => {
    // Clear storage keys
    await removeFromIDBCache('test_key_1');
    await removeFromIDBCache('test_key_2');
    await removeFromIDBCache('test_key_3');
    await removeFromIDBCache(LRU_META_KEY);
  });

  afterEach(async () => {
    await removeFromIDBCache('test_key_1');
    await removeFromIDBCache('test_key_2');
    await removeFromIDBCache('test_key_3');
    await removeFromIDBCache(LRU_META_KEY);
  });

  it('stores and retrieves items while recording storage metrics', async () => {
    await setInIDBCache('test_key_1', { data: 'hello' });
    const result = await getFromIDBCache<{ data: string }>('test_key_1');
    expect(result).toEqual({ data: 'hello' });

    const metrics = await getCacheStorageMetrics();
    expect(metrics.entryCount).toBeGreaterThanOrEqual(1);
    expect(metrics.estimatedSizeBytes).toBeGreaterThan(0);
    expect(metrics.oldestTimestamp).toBeDefined();
    expect(metrics.newestTimestamp).toBeDefined();
  });

  it('evicts oldest entries when storage budget is exceeded', async () => {
    await setInIDBCache('test_key_1', { value: 'first' });
    // Small delay to ensure timestamp difference
    await new Promise((r) => setTimeout(r, 10));
    await setInIDBCache('test_key_2', { value: 'second' });

    // Enforce budget with maxEntries = 1
    const { evictedCount, freedBytes } = await enforceCacheStorageBudget(1000000, 1);
    expect(evictedCount).toBe(1);
    expect(freedBytes).toBeGreaterThan(0);

    // Oldest key should be evicted, newest retained
    const key1 = await getFromIDBCache('test_key_1');
    const key2 = await getFromIDBCache('test_key_2');
    expect(key1).toBeNull();
    expect(key2).toEqual({ value: 'second' });
  });

  it('never evicts protected cache keys', async () => {
    const protectedKey = 'portfolio_offline_outbox_v1';
    expect(PROTECTED_CACHE_KEYS.has(protectedKey)).toBe(true);

    await setInIDBCache(protectedKey, [{ id: 'outbox_1' }]);
    await setInIDBCache('test_key_evictable', { payload: 'temporary' });

    // Enforce budget with maxEntries = 0 to trigger eviction of all evictable keys
    const { evictedCount } = await enforceCacheStorageBudget(1, 0);
    expect(evictedCount).toBe(1);

    // Protected key must remain untouched
    const protectedVal = await getFromIDBCache(protectedKey);
    expect(protectedVal).toEqual([{ id: 'outbox_1' }]);

    // Evictable key must be deleted
    const evictableVal = await getFromIDBCache('test_key_evictable');
    expect(evictableVal).toBeNull();
  });
});
