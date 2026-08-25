import { describe, it, expect } from 'vitest';
import { calculateGoldValuation, getPurityMultiplier } from '../assets/gold/calculations/goldValuation';

describe('Gold Calculations', () => {
  it('correctly calculates multipliers for different purities', () => {
    expect(getPurityMultiplier('24k')).toBe(1.0);
    expect(getPurityMultiplier('22k (916)')).toBeCloseTo(22 / 24, 4);
    expect(getPurityMultiplier('18k')).toBe(18 / 24);
    expect(getPurityMultiplier('14k')).toBe(14 / 24);
  });

  it('calculates gold valuation accurately for 24K and 22K', () => {
    const rate24k = 15000;
    // 10 grams 24K @ 15000 = 150000
    expect(calculateGoldValuation(10, '24K', rate24k)).toBe(150000);
    // 10 grams 22K @ 15000 = 10 * 15000 * (22/24) = 137500
    expect(calculateGoldValuation(10, '22K', rate24k)).toBe(137500);
  });

  it('handles zero or negative weights cleanly', () => {
    expect(calculateGoldValuation(0, '24K', 15000)).toBe(0);
    expect(calculateGoldValuation(-5, '22K', 15000)).toBe(0);
    expect(calculateGoldValuation(10, '24K', 0)).toBe(0);
  });
});
