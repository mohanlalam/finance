import { get, set } from 'idb-keyval';

export type ActivityAction = 'add' | 'update' | 'delete';
export type ActivityAssetType = 'stocks' | 'fd' | 'rd' | 'sip' | 'gold' | 'real_estate' | 'insurance' | 'documents' | 'family';

export interface ActivityEntry {
  id: string;
  action: ActivityAction;
  assetType: ActivityAssetType;
  title: string;
  portfolioName?: string;
  timestamp: string;
  details?: string;
}

const STORAGE_KEY = 'finance_activity_log';
const MAX_LOG_ENTRIES = 100;
let memoryFallback: ActivityEntry[] = [];

/**
 * Record an activity entry to persistent storage
 */
export async function logActivity(
  action: ActivityAction,
  assetType: ActivityAssetType,
  title: string,
  portfolioName?: string,
  details?: string
): Promise<void> {
  const entry: ActivityEntry = {
    id: `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    action,
    assetType,
    title,
    portfolioName,
    timestamp: new Date().toISOString(),
    details,
  };

  if (typeof indexedDB === 'undefined') {
    memoryFallback = [entry, ...memoryFallback].slice(0, MAX_LOG_ENTRIES);
    return;
  }

  try {
    const existing = (await get<ActivityEntry[]>(STORAGE_KEY)) || [];
    const updated = [entry, ...existing].slice(0, MAX_LOG_ENTRIES);
    await set(STORAGE_KEY, updated);
  } catch (err) {
    console.warn('[activityLogger] Failed to record activity:', err);
    memoryFallback = [entry, ...memoryFallback].slice(0, MAX_LOG_ENTRIES);
  }
}

/**
 * Fetch all recorded activity entries
 */
export async function getActivities(): Promise<ActivityEntry[]> {
  if (typeof indexedDB === 'undefined') {
    return memoryFallback;
  }
  try {
    return (await get<ActivityEntry[]>(STORAGE_KEY)) || memoryFallback;
  } catch {
    return memoryFallback;
  }
}

/**
 * Clear the activity log
 */
export async function clearActivities(): Promise<void> {
  memoryFallback = [];
  if (typeof indexedDB === 'undefined') return;
  try {
    await set(STORAGE_KEY, []);
  } catch (err) {
    console.warn('[activityLogger] Failed to clear activities:', err);
  }
}
