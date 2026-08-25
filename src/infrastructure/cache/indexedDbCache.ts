import * as idb from 'idb-keyval';
import { logger } from '../logging/logger';

const memoryStore = new Map<string, string>();

function isIndexedDBAvailable(): boolean {
  return typeof indexedDB !== 'undefined';
}

export async function getFromIDBCache<T>(key: string, timeoutMs = 1500): Promise<T | null> {
  if (!isIndexedDBAvailable()) {
    const mem = memoryStore.get(key);
    if (!mem) return null;
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
    return typeof raw === 'string' ? (JSON.parse(raw) as T) : (raw as T);
  } catch (err) {
    logger.warn(`Failed to read key '${key}' from IndexedDB:`, { error: String(err) });
    return null;
  }
}

export async function setInIDBCache<T>(key: string, value: T): Promise<void> {
  if (!isIndexedDBAvailable()) {
    memoryStore.set(key, JSON.stringify(value));
    return;
  }

  try {
    const serialized = typeof value === 'string' ? value : JSON.stringify(value);
    await idb.set(key, serialized);
  } catch (err) {
    logger.warn(`Failed to write key '${key}' to IndexedDB:`, { error: String(err) });
  }
}

export async function removeFromIDBCache(key: string): Promise<void> {
  if (!isIndexedDBAvailable()) {
    memoryStore.delete(key);
    return;
  }

  try {
    await idb.del(key);
  } catch (err) {
    logger.warn(`Failed to delete key '${key}' from IndexedDB:`, { error: String(err) });
  }
}
