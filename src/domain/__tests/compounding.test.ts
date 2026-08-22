import { describe, it, expect } from 'vitest';
import {
  calculateCompoundInterest,
  calculateRDMaturityValue,
  aggregateHoldingsValuation,
} from '../finance/compounding';

describe('domain compounding & valuation', () => {
  describe('calculateCompoundInterest', () => {
    it('calculates quarterly compound interest accurately', () => {
      // Principal: 100,000, 7% annual rate, 1 year, Quarterly compounding
      // A = 100000 * (1 + 0.07/4)^4 = 100000 * 1.071859 = 107,185.90
      const result = calculateCompoundInterest(100000, 7.0, 1, 'QUARTERLY');
      expect(result).toBe(107185.9);
    });

    it('calculates monthly and annual compound interest accurately', () => {
      const monthly = calculateCompoundInterest(50000, 8.0, 2, 'MONTHLY');
      expect(monthly).toBe(58644.4);

      const annual = calculateCompoundInterest(10000, 10.0, 3, 'ANNUALLY');
      expect(annual).toBe(13310);
    });

    it('safely handles zero or negative inputs', () => {
      expect(calculateCompoundInterest(0, 7.0, 1)).toBe(0);
      expect(calculateCompoundInterest(10000, 0, 1)).toBe(10000);
      expect(calculateCompoundInterest(10000, 7.0, 0)).toBe(10000);
    });
  });

  describe('calculateRDMaturityValue', () => {
    it('calculates Indian Banking standard RD maturity value', () => {
      // 5,000 monthly, 7.5% per annum, 12 months (1 year)
      const maturity = calculateRDMaturityValue(5000, 7.5, 12);
      expect(maturity).toBeGreaterThan(60000);
      expect(maturity).toBe(62478.46);
    });

    it('safely handles non-positive inputs', () => {
      expect(calculateRDMaturityValue(0, 7.0, 12)).toBe(0);
      expect(calculateRDMaturityValue(5000, 0, 12)).toBe(60000);
    });
  });

  describe('aggregateHoldingsValuation', () => {
    it('accurately sums and computes portfolio valuation summaries', () => {
      const holdings = [
        { investedAmount: 100000, currentValue: 120000, dayChange: 1500 },
        { investedAmount: 50000, currentValue: 45000, dayChange: -500 },
      ];

      const summary = aggregateHoldingsValuation(holdings);
      expect(summary.totalInvested).toBe(150000);
      expect(summary.totalCurrentValue).toBe(165000);
      expect(summary.totalGainLoss).toBe(15000);
      expect(summary.totalGainLossPercentage).toBe(10);
      expect(summary.dayChange).toBe(1000);
    });
  });
});
