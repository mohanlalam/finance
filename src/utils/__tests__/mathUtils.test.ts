import { describe, it, expect } from 'vitest';
import { roundToDecimals, compoundValue } from '../mathUtils';

describe('mathUtils', () => {
  describe('roundToDecimals', () => {
    it('handles standard decimal rounding', () => {
      expect(roundToDecimals(10.555, 2)).toBe(10.56);
      expect(roundToDecimals(10.554, 2)).toBe(10.55);
      expect(roundToDecimals(10.5, 0)).toBe(11);
    });

    it('correctly rounds large numbers without floating point epsilon swallowed', () => {
      expect(roundToDecimals(100000.005, 2)).toBe(100000.01);
      expect(roundToDecimals(100000.004, 2)).toBe(100000.00);
    });

    it('handles negative numbers properly', () => {
      expect(roundToDecimals(-10.555, 2)).toBe(-10.56);
      expect(roundToDecimals(-100000.005, 2)).toBe(-100000.01);
    });

    it('handles NaN and 0 values safely', () => {
      expect(roundToDecimals(NaN)).toBe(0);
      expect(roundToDecimals(0)).toBe(0);
    });
  });

  describe('compoundValue', () => {
    it('calculates compound interest correctly', () => {
      expect(Math.round(compoundValue(100000, 10, 2, 1))).toBe(110250);
    });

    it('returns principal if rate or time is 0', () => {
      expect(compoundValue(100000, 0, 2, 1)).toBe(100000);
      expect(compoundValue(100000, 10, 2, 0)).toBe(100000);
    });

    it('returns 0 for non-positive principal', () => {
      expect(compoundValue(0, 10, 2, 1)).toBe(0);
      expect(compoundValue(-500, 10, 2, 1)).toBe(0);
    });
  });
});
