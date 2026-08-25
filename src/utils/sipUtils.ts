import { fetchAMFIScheme } from './amfiClient';
import * as idb from 'idb-keyval';

export {
  getSIPInvestedAmount,
  getSIPEffectiveValue,
} from '../domains/assets/sip/calculations/sipValuation';

const navCache = new Map<string, { value: number; name: string; fetchedAt: number }>();


let saveTimeout: ReturnType<typeof setTimeout> | null = null;

export function scheduleSaveNAVCacheToIDB(): void {
  if (saveTimeout) clearTimeout(saveTimeout);
  saveTimeout = setTimeout(() => {
    saveNAVCacheToIDB().catch(() => {});
  }, 500);
}

export async function saveNAVCacheToIDB(): Promise<void> {
  try {
    await idb.set('nav_cache', JSON.stringify(Array.from(navCache.entries())));
  } catch (err) {
    console.warn('[sipUtils] Failed to save NAV cache to IDB:', err);
  }
}

const NAV_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours
const inflightNavRequests = new Map<string, Promise<NAVResult>>();

export interface NAVResult {
  value: number;
  schemeName: string;
  isStale: boolean;
  error?: string;
}

/**
 * Fetches the latest NAV details for a scheme code with in-memory caching,
 * in-flight request deduplication, and debounced IDB persistence.
 */
export async function fetchNAV(schemeCode: string): Promise<NAVResult> {
  const cached = navCache.get(schemeCode);
  if (cached && Date.now() - cached.fetchedAt < NAV_TTL_MS) {
    return { value: cached.value, schemeName: cached.name, isStale: false };
  }

  const existingInflight = inflightNavRequests.get(schemeCode);
  if (existingInflight) {
    return existingInflight;
  }

  const requestPromise = (async () => {
    try {
      const details = await fetchAMFIScheme(schemeCode);
      if (details.latestNav === null) {
        throw new Error('No NAV found');
      }
      const entry = { value: details.latestNav, name: details.schemeName, fetchedAt: Date.now() };
      navCache.set(schemeCode, entry);
      scheduleSaveNAVCacheToIDB();
      return { value: details.latestNav, schemeName: details.schemeName, isStale: false };
    } catch (err) {
      return {
        value: cached?.value ?? 0,
        schemeName: cached?.name ?? '',
        isStale: true,
        error: err instanceof Error ? err.message : 'AMFI unavailable'
      };
    } finally {
      inflightNavRequests.delete(schemeCode);
    }
  })();

  inflightNavRequests.set(schemeCode, requestPromise);
  return requestPromise;
}
