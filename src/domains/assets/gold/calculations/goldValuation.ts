/**
 * Pure Gold Bullion & Hallmark valuation calculations.
 */

export const DEFAULT_GOLD_RATE_24K = 15840;

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
  return 22 / 24; // Default to 22K standard hallmark jewelry
}

/**
 * Calculates current market valuation for a gold holding based on weight, purity, and 24K spot rate.
 */
export function calculateGoldValuation(
  weightGrams: number,
  purity: string,
  rate24kPerGram: number = DEFAULT_GOLD_RATE_24K
): number {
  const weight = Number(weightGrams) || 0;
  if (weight <= 0) return 0;
  const rate = Number(rate24kPerGram) || DEFAULT_GOLD_RATE_24K;
  const multiplier = getPurityMultiplier(purity);
  return Math.round(weight * rate * multiplier);
}
