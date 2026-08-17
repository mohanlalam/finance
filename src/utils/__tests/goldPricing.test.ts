import { describe, it, expect } from 'vitest';
import {
  getPurityMultiplier,
  calculateGoldValuation,
  deriveGoldRates,
  DEFAULT_GOLD_RATE_24K,
} from '../goldPricing';

describe('goldPricing utilities', () => {
  it('correctly maps purity strings to multipliers', () => {
    expect(getPurityMultiplier('24K')).toBe(1.0);
    expect(getPurityMultiplier('22k')).toBeCloseTo(0.9167, 3);
    expect(getPurityMultiplier('916 Hallmark')).toBeCloseTo(0.9167, 3);
    expect(getPurityMultiplier('18K')).toBe(0.75);
    expect(getPurityMultiplier('14K')).toBeCloseTo(0.5833, 3);
    expect(getPurityMultiplier('')).toBeCloseTo(0.9167, 3);
  });

  it('calculates gold valuation accurately for 24K and 22K', () => {
    const rate24k = 7200;
    // 10 grams of 24K @ 7200/g = 72,000
    expect(calculateGoldValuation(10, '24K', rate24k)).toBe(72000);

    // 10 grams of 22K @ 7200/g = 10 * 7200 * (22/24) = 66,000
    expect(calculateGoldValuation(10, '22K', rate24k)).toBe(66000);

    // 0 weight returns 0
    expect(calculateGoldValuation(0, '22K', rate24k)).toBe(0);
  });

  it('derives rates bundle with correct 24K, 22K and 18K values', () => {
    const rates = deriveGoldRates(DEFAULT_GOLD_RATE_24K);
    expect(rates.rate24kPerGram).toBe(DEFAULT_GOLD_RATE_24K);
    expect(rates.rate22kPerGram).toBe(Math.round(DEFAULT_GOLD_RATE_24K * (22 / 24)));
    expect(rates.rate18kPerGram).toBe(Math.round(DEFAULT_GOLD_RATE_24K * (18 / 24)));
    expect(rates.source).toBeDefined();
  });
});
