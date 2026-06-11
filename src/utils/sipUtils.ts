import { SIPAccount } from '../types/portfolio';
import { fetchAMFIScheme } from './amfiClient';
import * as idb from 'idb-keyval';

// Global live USD to INR exchange rate, updated during SWR ticks
export let usdInrRate = 83.5;

export function setUsdInrRate(rate: number) {
  if (rate > 0) {
    usdInrRate = rate;
  }
}

export function getUsdInrRate(): number {
  return usdInrRate;
}

// Global NAV cache, exported for use in usePortfolioData.ts SWR price mapping
export const navCache = new Map<string, { value: number; name: string; fetchedAt: number }>();

// Actual historical returns for HDFC Life International strategies (1Y, 2Y, 5Y, 10Y CAGR)
export const HDFC_RETURNS_MAP: Record<string, Record<string, number>> = {
  'Global Balanced Funds Strategy': { '5Y': 3.35, '10Y': 6.49 },
  'Global Diversified Equity Funds Strategy': { '5Y': 9.34, '10Y': 10.09 },
  'Global Equity Index Funds Strategy': { '5Y': 12.65, '10Y': 16.07 },
  'Global Fixed Income Funds Strategy': { '5Y': -0.68, '10Y': 1.42 },
  'Global Gold Funds Strategy': { '5Y': 21.31, '10Y': 13.5 },
  'India Focused Funds Strategy': { '2Y': -1.96, '5Y': 9.81 },
  'Liquid Funds Strategy': { '5Y': 4.0 },
  'Global Islamic Investment Strategy': { '1Y': 38.53, '2Y': 18.46, '5Y': 11.66 },
  'Global Artificial Intelligence Strategy': { '1Y': 107.67, '2Y': 49.02, '5Y': 25.25 },
  'Global Blue Chip Anchor Strategy': { '1Y': 35.58, '2Y': 24.55, '5Y': 13.84, '10Y': 16.32 },
  'Global Multi Cap Strategy': { '1Y': 32.82, '2Y': 22.65, '5Y': 8.86 }
};

/**
 * Checks if a fund name corresponds to the special HDFC Life International policy.
 */
export function isHdfcLifePolicy(fundName: string): boolean {
  const name = fundName.toLowerCase();
  return name.includes('global wealth') || name.includes('nova ace') || name.includes('hdfc life international');
}

/**
 * Matches a fund/scheme name to an HDFC strategy and extracts the CAGR for the elapsed duration.
 */
export function getHdfcStrategyCAGR(fundName: string, yearsElapsed: number): number {
  const nameLower = fundName.toLowerCase();
  let matchedKey = '';
  for (const key of Object.keys(HDFC_RETURNS_MAP)) {
    if (nameLower.includes(key.toLowerCase()) || key.toLowerCase().includes(nameLower)) {
      matchedKey = key;
      break;
    }
  }

  let rate = 8; // fallback 8%
  if (matchedKey && HDFC_RETURNS_MAP[matchedKey]) {
    const perf = HDFC_RETURNS_MAP[matchedKey];
    if (yearsElapsed <= 1 && perf['1Y'] !== undefined) rate = perf['1Y'];
    else if (yearsElapsed <= 2 && perf['2Y'] !== undefined) rate = perf['2Y'];
    else if (yearsElapsed <= 5 && perf['5Y'] !== undefined) rate = perf['5Y'];
    else if (perf['10Y'] !== undefined) rate = perf['10Y'];
    else if (perf['5Y'] !== undefined) rate = perf['5Y'];
    else if (perf['2Y'] !== undefined) rate = perf['2Y'];
    else if (perf['1Y'] !== undefined) rate = perf['1Y'];
  }
  return rate / 100;
}

/**
 * Returns the estimated total amount invested in the SIP.
 * Calculated as: monthly_sip * months elapsed since start_date.
 * Capped at 36 months (3 years) for special HDFC Life plans.
 */
export function getSIPInvestedAmount(account: SIPAccount): number {
  const start = new Date(account.start_date);
  if (isNaN(start.getTime())) return Number(account.monthly_sip);
  
  const end = new Date();
  const rawMonths = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
  const dayOfMonth = start.getDate();
  const currentDayOfMonth = end.getDate();
  const elapsed = rawMonths + (currentDayOfMonth >= dayOfMonth ? 1 : 0);
  
  if (isHdfcLifePolicy(account.fund_name)) {
    const effectiveMonths = Math.min(Math.max(1, elapsed), 36);
    const isUSD = account.monthly_sip < 5000;
    const monthlySip = Number(account.monthly_sip);
    return isUSD ? monthlySip * effectiveMonths * usdInrRate : monthlySip * effectiveMonths;
  }
  
  return Number(account.monthly_sip) * Math.max(1, elapsed);
}

export async function initNAVCache(): Promise<void> {
  try {
    const saved = await idb.get('nav_cache');
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
 * Uses live NAV * units if available, falling back to fallback_valuation.
 * Special HDFC Life plans leverage live exchange rates and returns-based CAGR compounding if units are missing.
 */
export function getSIPEffectiveValue(account: SIPAccount, liveNav?: number): number {
  if (isHdfcLifePolicy(account.fund_name)) {
    const units = Number(account.units || (account as { units_held?: number }).units_held || 0);
    
    // Attempt to resolve live NAV from parameters, scheme code, or name matching in navCache
    let nav = liveNav !== undefined ? liveNav : account.liveNav;
    if (!nav && account.mf_scheme_code) {
      const cached = navCache.get(account.mf_scheme_code);
      if (cached && cached.value > 0) {
        nav = cached.value;
      }
    }
    if (!nav) {
      const cached = navCache.get(account.fund_name);
      if (cached && cached.value > 0) {
        nav = cached.value;
      } else {
        for (const [key, value] of navCache.entries()) {
          if (account.fund_name.toLowerCase().includes(key.toLowerCase()) || key.toLowerCase().includes(account.fund_name.toLowerCase())) {
            nav = value.value;
            break;
          }
        }
      }
    }

    // 1. If units are provided, run unit-multiplication using the live exchange rate
    if (units > 0 && nav && nav > 0) {
      return units * nav * usdInrRate;
    }

    // 2. If units are not provided (or NAV is not resolved), run CAGR compounding using strategy returns
    const start = new Date(account.start_date);
    if (!isNaN(start.getTime())) {
      const end = new Date();
      const rawMonths = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
      const dayOfMonth = start.getDate();
      const currentDayOfMonth = end.getDate();
      const elapsedMonths = rawMonths + (currentDayOfMonth >= dayOfMonth ? 1 : 0);

      const yearsElapsed = elapsedMonths / 12;
      const strategyName = account.mf_scheme_code || account.fund_name;
      const R = getHdfcStrategyCAGR(strategyName, yearsElapsed);

      const isUSD = account.monthly_sip < 5000;
      const userSipUSD = isUSD ? Number(account.monthly_sip) : Number(account.monthly_sip) / usdInrRate;

      let fvUSD = 0;
      if (R === 0) {
        fvUSD = userSipUSD * Math.min(elapsedMonths, 36);
      } else {
        const r = Math.pow(1 + R, 1 / 12) - 1;
        const payMonths = Math.min(elapsedMonths, 36);
        fvUSD = userSipUSD * ((Math.pow(1 + r, payMonths) - 1) / r) * (1 + r);
        
        if (elapsedMonths > 36) {
          fvUSD = fvUSD * Math.pow(1 + R, (elapsedMonths - 36) / 12);
        }
      }
      return fvUSD * usdInrRate;
    }
  }

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
  
  return Number(account.fallback_valuation);
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
    try {
      await idb.set('nav_cache', JSON.stringify([...navCache.entries()]));
    } catch { /* ignore */ }
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
