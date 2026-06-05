import { SIPAccount } from '../types/portfolio';
import { fetchAMFIScheme } from './amfiClient';

/**
 * Returns the estimated total amount invested in the SIP.
 * Calculated as: monthly_sip * months elapsed since start_date.
 */
export function getSIPInvestedAmount(account: SIPAccount): number {
  const start = new Date(account.start_date);
  if (isNaN(start.getTime())) return Number(account.monthly_sip);
  
  const end = new Date();
  const months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth()) + 1;
  const elapsed = Math.max(1, months);
  return Number(account.monthly_sip) * elapsed;
}

/**
 * Returns the current valuation of a SIP Mutual Fund.
 */
export function getSIPEffectiveValue(account: SIPAccount): number {
  return Number(account.fallback_valuation);
}

const navCache = new Map<string, { value: number; name: string; fetchedAt: number }>();
const NAV_TTL_MS = 15 * 60 * 1000; // 15 minutes

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
    navCache.set(schemeCode, { value: details.latestNav, name: details.schemeName, fetchedAt: Date.now() });
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
