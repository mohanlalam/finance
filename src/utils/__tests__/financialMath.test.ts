import { describe, it, expect } from 'vitest';
import { calculateXIRR } from '../../domains/performance/calculations/xirr';
import { calculateCAGR } from '../../domains/performance/calculations/cagr';
import { compoundValue } from '../mathUtils';

describe('Financial Math Unit Tests', () => {
  describe('Compound Interest Engine', () => {
    it('compounds principal correctly over time', () => {
      // ₹10,000 at 10% p.a. for 2 years with semi-annual compounding (2 frequency)
      const result = compoundValue(10000, 10, 2, 2);
      expect(Math.abs(result - 12155.06)).toBeLessThan(0.1);
    });

    it('handles 0 years gracefully', () => {
      const result = compoundValue(50000, 7.5, 0, 4);
      expect(result).toBe(50000);
    });
  });

  describe('CAGR Calculation Engine', () => {
    it('calculates correct CAGR for doubling investment over 5 years', () => {
      const cagr = calculateCAGR(100, 200, 5);
      expect(Math.abs(cagr - 0.1487)).toBeLessThan(0.005);
    });

    it('returns 0 when invested amount is zero', () => {
      expect(calculateCAGR(0, 100, 5)).toBe(0);
    });

    it('returns 0 when tenure is zero', () => {
      expect(calculateCAGR(100, 200, 0)).toBe(0);
    });
  });

  describe('XIRR Cashflow Solver', () => {
    it('calculates XIRR for standard cash outflows and inflow', () => {
      const cashflows = [
        { amount: -10000, date: '2023-01-01' },
        { amount: -10000, date: '2024-01-01' },
        { amount: 23000, date: '2025-01-01' },
      ];
      const xirr = calculateXIRR(cashflows);
      expect(xirr).toBeGreaterThan(0.05);
      expect(xirr).toBeLessThan(0.15);
    });

    it('returns 0 when all cashflows have same sign', () => {
      const cashflows = [
        { amount: -10000, date: '2023-01-01' },
        { amount: -10000, date: '2024-01-01' },
      ];
      expect(calculateXIRR(cashflows)).toBe(0);
    });
  });
});
