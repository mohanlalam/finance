/**
 * Gold Market Pricing Utility
 * Calculates live MCX & NSE gold bullion rates per gram & 10g (24K / 22K / 18K)
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

// 15 Minutes in milliseconds for live rate refresh
export const LIVE_SYNC_INTERVAL_MS = 15 * 60 * 1000;

// Current baseline spot rate in INR (~ ₹8,850/g for 24K per gram / ₹88,500 per 10g)
export const DEFAULT_GOLD_RATE_24K = 8850;

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

export function getStoredGoldSnapshot(): GoldRateSnapshot {
  try {
    const saved = localStorage.getItem(SNAPSHOT_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && typeof parsed.rate24k === 'number' && parsed.rate24k > 1000) {
        return parsed;
      }
    }
  } catch { /* ignore */ }
  return {
    rate24k: DEFAULT_GOLD_RATE_24K,
    previousClose: DEFAULT_GOLD_RATE_24K,
    changeINR: 0,
    changePercent: 0,
    isLive: false,
    lastFetchedAt: new Date().toISOString(),
    source: 'IBJA Baseline Benchmark',
  };
}

export function saveStoredGoldSnapshot(snapshot: GoldRateSnapshot): void {
  try {
    localStorage.setItem(SNAPSHOT_KEY, JSON.stringify(snapshot));
  } catch { /* ignore */ }
}

/** Check if custom user override rate is set */
export function getCustomGoldRate(): number | null {
  try {
    const val = localStorage.getItem(CUSTOM_RATE_KEY);
    if (val) {
      const num = parseFloat(val);
      if (!isNaN(num) && num > 1000) return num;
    }
  } catch { /* ignore */ }
  return null;
}

export function saveCustomGoldRate(rate24k: number): void {
  try {
    localStorage.setItem(CUSTOM_RATE_KEY, String(rate24k));
  } catch { /* ignore */ }
}

export function clearCustomGoldRate(): void {
  try {
    localStorage.removeItem(CUSTOM_RATE_KEY);
  } catch { /* ignore */ }
}

/** Check if the gold rate should automatically refresh (every 15 mins during market hours) */
export function isGoldRateStale(): boolean {
  try {
    const snapshot = getStoredGoldSnapshot();
    if (!snapshot.lastFetchedAt) return true;
    const elapsed = Date.now() - new Date(snapshot.lastFetchedAt).getTime();
    return elapsed >= LIVE_SYNC_INTERVAL_MS;
  } catch {
    return true;
  }
}

/**
 * Fetches real-time MCX / NSE Gold Bullion spot rate.
 * Uses GOLDBEES.NS / HDFCMFGETF.NS on NSE where 1 unit tracks ~0.01g pure 24K physical gold.
 */
export async function fetchLiveGoldRates(forceRefresh = false): Promise<GoldRates> {
  const customRate = getCustomGoldRate();
  const snapshot = getStoredGoldSnapshot();

  if (!forceRefresh && !isGoldRateStale() && snapshot.rate24k > 1000) {
    return deriveGoldRates(customRate ?? snapshot.rate24k);
  }

  try {
    // Primary benchmark: GOLDBEES.NS (tracks 1/100th gram of 24K pure gold on NSE/MCX)
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/GOLDBEES.NS?range=1d&interval=5m`;
    const res = await fetch(url, { headers: { Accept: 'application/json' } });
    if (res.ok) {
      const data = await res.json();
      const meta = data?.chart?.result?.[0]?.meta;
      const price = meta?.regularMarketPrice;
      const prevClose = meta?.chartPreviousClose || meta?.previousClose || price;

      if (typeof price === 'number' && price > 0) {
        // GOLDBEES tracks ~0.01g pure gold -> 1g 24K = price * 100
        const rate24k = Math.round(price * 100);
        const prevCloseRate = Math.round((prevClose || price) * 100);
        const changeINR = rate24k - prevCloseRate;
        const changePercent = prevCloseRate > 0 ? ((rate24k - prevCloseRate) / prevCloseRate) * 100 : 0;

        if (rate24k >= 5000 && rate24k <= 20000) {
          const newSnapshot: GoldRateSnapshot = {
            rate24k,
            previousClose: prevCloseRate,
            changeINR,
            changePercent,
            isLive: true,
            lastFetchedAt: new Date().toISOString(),
            source: 'MCX / NSE Gold Spot Benchmark',
          };
          saveStoredGoldSnapshot(newSnapshot);
          return deriveGoldRates(customRate ?? rate24k);
        }
      }
    }
  } catch (err) {
    console.warn('[goldPricing] Live gold fetch warning:', err);
  }

  // Fallback to existing snapshot
  return deriveGoldRates(customRate ?? snapshot.rate24k);
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
 * Normalizes purity string into multiplier factor
 * e.g., '24k' -> 1.0, '22k' -> 0.9167, '18k' -> 0.75, '14k' -> 0.5833
 */
export function getPurityMultiplier(purityStr: string): number {
  const clean = (purityStr || '').toLowerCase().trim();
  if (clean.includes('24')) return 1.0;
  if (clean.includes('22') || clean.includes('916')) return 22 / 24; // ~0.9167
  if (clean.includes('18') || clean.includes('750')) return 18 / 24; // 0.75
  if (clean.includes('14') || clean.includes('585')) return 14 / 24; // ~0.5833
  return 0.9167; // Default to 22K standard hallmark jewelry
}

/**
 * Calculates current market valuation for a gold holding
 */
export function calculateGoldValuation(
  weightGrams: number,
  purity: string,
  rate24kPerGram?: number
): number {
  const weight = Number(weightGrams) || 0;
  if (weight <= 0) return 0;
  const rate = rate24kPerGram ?? getStoredGoldRate();
  const multiplier = getPurityMultiplier(purity);
  return Math.round(weight * rate * multiplier);
}

/**
 * Computes full rates bundle for display
 */
export function deriveGoldRates(customRate?: number): GoldRates {
  const snapshot = getStoredGoldSnapshot();
  const custom = getCustomGoldRate();
  const effective24k = customRate ?? custom ?? snapshot.rate24k;
  const isCustom = !!(customRate || custom);

  return {
    rate24kPerGram: Math.round(effective24k),
    rate22kPerGram: Math.round(effective24k * (22 / 24)),
    rate18kPerGram: Math.round(effective24k * (18 / 24)),
    rate24kPer10g: Math.round(effective24k * 10),
    rate22kPer10g: Math.round(effective24k * (22 / 24) * 10),
    rate18kPer10g: Math.round(effective24k * (18 / 24) * 10),
    changeINR: snapshot.changeINR ?? 0,
    changePercent: snapshot.changePercent ?? 0,
    isLive: isCustom ? false : (snapshot.isLive ?? true),
    isCustom,
    lastUpdated: snapshot.lastFetchedAt,
    source: isCustom ? 'Custom Jeweler Rate' : (snapshot.source || 'MCX / NSE Gold Spot Benchmark'),
  };
}

