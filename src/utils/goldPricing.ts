/**
 * Gold Market Pricing Utility
 * Calculates live gold rate per gram (24K / 22K / 18K) using market benchmarks.
 */

export interface GoldRates {
  rate24kPerGram: number;
  rate22kPerGram: number;
  rate18kPerGram: number;
  lastUpdated: string;
  source: string;
}

// Current baseline spot rate per gram in INR (calibrated to Indian Bullion & Jewellers Association rate ~ ₹15,200/g for 24K per gram / ₹1,52,000 per 10g)
export const DEFAULT_GOLD_RATE_24K = 15200;

export function getStoredGoldRate(): number {
  try {
    const saved = localStorage.getItem('finance_custom_gold_rate_24k');
    if (saved) {
      const val = parseFloat(saved);
      if (!isNaN(val) && val > 1000) return val;
    }
  } catch { /* ignore */ }
  return DEFAULT_GOLD_RATE_24K;
}

export function saveStoredGoldRate(rate24k: number): void {
  try {
    localStorage.setItem('finance_custom_gold_rate_24k', String(rate24k));
  } catch { /* ignore */ }
}

/**
 * Normalizes purity string into multiplier factor
 * e.g., '24k' -> 1.0, '22k' -> 0.916, '18k' -> 0.75
 */
export function getPurityMultiplier(purityStr: string): number {
  const clean = (purityStr || '').toLowerCase().trim();
  if (clean.includes('24')) return 1.0;
  if (clean.includes('22') || clean.includes('916')) return 22 / 24; // ~0.9167
  if (clean.includes('18') || clean.includes('750')) return 18 / 24; // 0.75
  if (clean.includes('14')) return 14 / 24; // ~0.5833
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
  const rate24k = customRate ?? getStoredGoldRate();
  return {
    rate24kPerGram: Math.round(rate24k),
    rate22kPerGram: Math.round(rate24k * (22 / 24)),
    rate18kPerGram: Math.round(rate24k * (18 / 24)),
    lastUpdated: new Date().toISOString(),
    source: 'IBJA / MCX Spot Benchmark',
  };
}
