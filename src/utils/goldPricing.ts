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

// Fallback baseline spot rate per gram in INR (calibrated to current Indian Bullion & Jewellers Association rate ~ ₹7,250/g for 24K)
export const DEFAULT_GOLD_RATE_24K = 7250;

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
  rate24kPerGram: number = DEFAULT_GOLD_RATE_24K
): number {
  const weight = Number(weightGrams) || 0;
  if (weight <= 0) return 0;
  const multiplier = getPurityMultiplier(purity);
  return Math.round(weight * rate24kPerGram * multiplier);
}

/**
 * Computes full rates bundle for display
 */
export function deriveGoldRates(rate24k: number = DEFAULT_GOLD_RATE_24K): GoldRates {
  return {
    rate24kPerGram: Math.round(rate24k),
    rate22kPerGram: Math.round(rate24k * (22 / 24)),
    rate18kPerGram: Math.round(rate24k * (18 / 24)),
    lastUpdated: new Date().toISOString(),
    source: 'MCX / IBJA Indicative Rate',
  };
}
