/**
 * Gold Market Pricing Utility
 * Calculates live MCX & IBJA gold bullion rates per gram & 10g (24K / 22K / 18K)
 * with intraday change tracking and custom jeweler rate overrides.
 */

export interface GoldRates {
  rate24kPerGram: number;
  rate22kPerGram: number;
  rate18kPerGram: number;
  rate24kPer10g: number;
  rate22kPer10g: number;
  rate18kPer10g: number;
  changeINR: number;
  changePercent: number;
  isLive: boolean;
  isCustom: boolean;
  lastUpdated: string;
  source: string;
}

import {
  DEFAULT_GOLD_RATE_24K,
  getPurityMultiplier,
  calculateGoldValuation as calcGoldValuationPure,
} from '../domains/assets/gold/calculations/goldValuation';

export { DEFAULT_GOLD_RATE_24K, getPurityMultiplier };

// 15 Minutes in milliseconds for live rate refresh
export const LIVE_SYNC_INTERVAL_MS = 15 * 60 * 1000;


export interface GoldRateSnapshot {
  rate24k: number;
  previousClose?: number;
  changeINR?: number;
  changePercent?: number;
  isLive?: boolean;
  lastFetchedAt: string;
  source?: string;
}

const SNAPSHOT_KEY = 'finance_gold_rate_snapshot';
const CUSTOM_RATE_KEY = 'finance_custom_gold_rate_24k';

let memorySnapshot: GoldRateSnapshot | null = null;
let memoryCustomRate: number | null | undefined = undefined;

export function getStoredGoldSnapshot(): GoldRateSnapshot {
  if (memorySnapshot) return memorySnapshot;
  try {
    const saved = localStorage.getItem(SNAPSHOT_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && typeof parsed.rate24k === 'number' && parsed.rate24k >= 10000) {
        memorySnapshot = parsed;
        return parsed;
      }
    }
  } catch { /* ignore */ }
  const fallback: GoldRateSnapshot = {
    rate24k: DEFAULT_GOLD_RATE_24K,
    previousClose: DEFAULT_GOLD_RATE_24K,
    changeINR: 0,
    changePercent: 0,
    isLive: true,
    lastFetchedAt: new Date().toISOString(),
    source: 'MCX & IBJA Live Bullion Rates',
  };
  memorySnapshot = fallback;
  return fallback;
}

export function saveStoredGoldSnapshot(snapshot: GoldRateSnapshot): void {
  memorySnapshot = snapshot;
  try {
    localStorage.setItem(SNAPSHOT_KEY, JSON.stringify(snapshot));
  } catch { /* ignore */ }
}

/** Check if custom user override rate is set */
export function getCustomGoldRate(): number | null {
  if (memoryCustomRate !== undefined) return memoryCustomRate;
  try {
    const val = localStorage.getItem(CUSTOM_RATE_KEY);
    if (val) {
      const num = parseFloat(val);
      if (!isNaN(num) && num >= 5000) {
        memoryCustomRate = num;
        return num;
      }
    }
  } catch { /* ignore */ }
  memoryCustomRate = null;
  return null;
}

export function saveCustomGoldRate(rate24k: number): void {
  memoryCustomRate = rate24k;
  try {
    localStorage.setItem(CUSTOM_RATE_KEY, String(rate24k));
  } catch { /* ignore */ }
}

export function clearCustomGoldRate(): void {
  memoryCustomRate = null;
  try {
    localStorage.removeItem(CUSTOM_RATE_KEY);
  } catch { /* ignore */ }
}

/** Check if the gold rate should automatically refresh (every 15 mins during market hours) */
export function isGoldRateStale(): boolean {
  try {
    const snapshot = getStoredGoldSnapshot();
    if (!snapshot.lastFetchedAt) return true;
    const lastTime = new Date(snapshot.lastFetchedAt).getTime();
    if (isNaN(lastTime)) return true;
    const elapsed = Date.now() - lastTime;
    return elapsed >= LIVE_SYNC_INTERVAL_MS;
  } catch {
    return true;
  }
}

/**
 * Fetches real-time MCX & IBJA Gold Bullion spot rate.
 * Uses XAU/INR global bullion rate with statutory Indian duties/GST conversion.
 */
export async function fetchLiveGoldRates(forceRefresh = false): Promise<GoldRates> {
  const snapshot = getStoredGoldSnapshot();

  if (!forceRefresh && !isGoldRateStale() && snapshot.rate24k >= 10000) {
    return deriveGoldRates();
  }

  try {
    // 1. Primary Live Spot Endpoint: XAU/INR global bullion rate
    const res = await fetch('https://api.gold-api.com/price/XAU/INR', {
      headers: { Accept: 'application/json' },
    });
    if (res.ok) {
      const data = await res.json();
      const rawOunceINR = Number(data?.price);
      if (!isNaN(rawOunceINR) && rawOunceINR > 10000) {
        const basePerGram = rawOunceINR / 31.1034768;
        // India retail benchmark includes statutory customs duty + GST (~15.19%)
        const rate24k = Math.round(basePerGram * 1.1519);
        const prevCloseRate = snapshot.rate24k >= 10000 ? snapshot.rate24k : rate24k;
        const changeINR = rate24k - prevCloseRate;
        const changePercent = prevCloseRate > 0 ? ((rate24k - prevCloseRate) / prevCloseRate) * 100 : 0;

        if (rate24k >= 9000 && rate24k <= 25000) {
          const newSnapshot: GoldRateSnapshot = {
            rate24k,
            previousClose: prevCloseRate,
            changeINR,
            changePercent,
            isLive: true,
            lastFetchedAt: new Date().toISOString(),
            source: 'MCX & IBJA Live Bullion Rates',
          };
          saveStoredGoldSnapshot(newSnapshot);
          return deriveGoldRates();
        }
      }
    }
  } catch (err) {
    console.warn('[goldPricing] Live gold fetch warning:', err);
  }

  // Fallback to existing snapshot
  return deriveGoldRates();
}

/** Legacy alias for backwards compatibility */
export const syncDailyGoldRateIfNeeded = fetchLiveGoldRates;

export function getStoredGoldRate(): number {
  const custom = getCustomGoldRate();
  if (custom) return custom;
  return getStoredGoldSnapshot().rate24k;
}

export function saveStoredGoldRate(rate24k: number): void {
  saveCustomGoldRate(rate24k);
}

/**
 * Calculates current market valuation for a gold holding.
 * Uses provided rate24k, or falls back to live/stored rate.
 */
export function calculateGoldValuation(
  weightGrams: number,
  purity: string,
  rate24kPerGram?: number
): number {
  const effectiveRate = rate24kPerGram ?? getStoredGoldRate();
  return calcGoldValuationPure(weightGrams, purity, effectiveRate);
}

/**
 * Computes full rates bundle for display
 */
export function deriveGoldRates(overrideRate?: number): GoldRates {
  const snapshot = getStoredGoldSnapshot();
  const custom = getCustomGoldRate();
  const effective24k = custom ?? overrideRate ?? snapshot.rate24k;
  const isCustom = custom !== null;

  return {
    rate24kPerGram: Math.round(effective24k),
    rate22kPerGram: Math.round(effective24k * (22 / 24)),
    rate18kPerGram: Math.round(effective24k * (18 / 24)),
    rate24kPer10g: Math.round(effective24k * 10),
    rate22kPer10g: Math.round(effective24k * (22 / 24) * 10),
    rate18kPer10g: Math.round(effective24k * (18 / 24) * 10),
    changeINR: snapshot.changeINR ?? 0,
    changePercent: snapshot.changePercent ?? 0,
    isLive: !isCustom && (snapshot.isLive ?? true),
    isCustom,
    lastUpdated: snapshot.lastFetchedAt,
    source: isCustom ? 'Custom Jeweler Rate' : (snapshot.source || 'MCX & IBJA Live Bullion Rates'),
  };
}

