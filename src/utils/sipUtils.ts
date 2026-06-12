import { SIPAccount } from '../types/portfolio';
import { fetchAMFIScheme } from './amfiClient';
import * as idb from 'idb-keyval';

/**
 * Returns the estimated total amount invested in the SIP.
 * Calculated as: monthly_sip * months elapsed since start_date.
 */
export function getSIPInvestedAmount(account: SIPAccount): number {
  const start = new Date(account.start_date);
  if (isNaN(start.getTime())) return Number(account.monthly_sip);
  
  const end = new Date();
  const rawMonths = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
  const dayOfMonth = start.getDate();
  const currentDayOfMonth = end.getDate();
  const elapsed = rawMonths + (currentDayOfMonth >= dayOfMonth ? 1 : 0);
  return Number(account.monthly_sip) * Math.max(1, elapsed);
}

const navCache = new Map<string, { value: number; name: string; fetchedAt: number }>();

export async function initNAVCache(): Promise<void> {
  try {
    const saved = await Promise.race([
      idb.get('nav_cache'),
      new Promise<string | null>((resolve) => setTimeout(() => resolve(null), 1000))
    ]);
    if (saved) {
      const entries: [string, { value: number; name: string; fetchedAt: number }][] = JSON.parse(saved);
      for (const [k, v] of entries) {
        navCache.set(k, v);
      }
    }
  } catch (err) {
    console.warn('[sipUtils] Failed to load NAV cache:', err);
  }
}

/**
 * Returns the current valuation of a SIP Mutual Fund.
 * Uses live NAV * units (or units_held) if available, falling back to fallback_valuation.
 */
export function getSIPEffectiveValue(account: SIPAccount, liveNav?: number): number {
  const units = Number(account.units || (account as { units_held?: number }).units_held || 0);
  
  const nav = liveNav !== undefined ? liveNav : account.liveNav;
  if (nav && nav > 0) {
    return nav * units;
  }
  
  if (account.mf_scheme_code) {
    const cached = navCache.get(account.mf_scheme_code);
    if (cached && cached.value > 0) {
      return cached.value * units;
    }
  }
  
  return Number(account.fallback_valuation) || 0;
}

export async function saveNAVCacheToIDB(): Promise<void> {
  try {
    await idb.set('nav_cache', JSON.stringify([...navCache.entries()]));
  } catch (err) {
    console.warn('[sipUtils] Failed to save NAV cache to IDB:', err);
  }
}

const NAV_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours

export interface NAVResult {
  value: number;
  schemeName: string;
  isStale: boolean;
  error?: string;
}

/**
 * Fetches the latest NAV details for a scheme code with in-memory caching.
 */
export async function fetchNAV(schemeCode: string): Promise<NAVResult> {
  const cached = navCache.get(schemeCode);
  if (cached && Date.now() - cached.fetchedAt < NAV_TTL_MS) {
    return { value: cached.value, schemeName: cached.name, isStale: false };
  }
  try {
    const details = await fetchAMFIScheme(schemeCode);
    if (details.latestNav === null) {
      throw new Error('No NAV found');
    }
    const entry = { value: details.latestNav, name: details.schemeName, fetchedAt: Date.now() };
    navCache.set(schemeCode, entry);
    return { value: details.latestNav, schemeName: details.schemeName, isStale: false };
  } catch (err) {
    return {
      value: cached?.value ?? 0,
      schemeName: cached?.name ?? '',
      isStale: true,
      error: err instanceof Error ? err.message : 'AMFI unavailable'
    };
  }
}
