import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

// Test targets
import { calculateXIRR, calculateCAGR } from '../performance';
import { compoundValue } from '../mathUtils';
import { Portfolio } from '../../types/portfolio';

describe('Financial Math Unit Tests', () => {
  describe('Compound Interest Engine', () => {
    test('compounds principal correctly over time', () => {
      // ₹10,000 at 10% p.a. for 2 years with semi-annual compounding (2 frequency)
      const result = compoundValue(10000, 10, 2, 2);
      // (1 + 0.10/2)^4 = 1.05^4 = 1.21550625 -> 12155.06
      assert.ok(Math.abs(result - 12155.06) < 0.1);
    });

    test('handles 0 years gracefully', () => {
      const result = compoundValue(50000, 7.5, 0, 4);
      assert.equal(result, 50000);
    });
  });

  describe('CAGR Calculation Engine', () => {
    test('calculates correct CAGR for doubling investment over 5 years', () => {
      // 100 to 200 over 5 years -> CAGR = (200/100)^(1/5) - 1 = 14.87%
      const cagr = calculateCAGR(100, 200, 5);
      assert.ok(Math.abs(cagr - 0.1487) < 0.005);
    });

    test('returns 0 when invested amount is zero', () => {
      const cagr = calculateCAGR(0, 100, 5);
      assert.equal(cagr, 0);
    });

    test('returns 0 when tenure is zero', () => {
      const cagr = calculateCAGR(100, 200, 0);
      assert.equal(cagr, 0);
    });
  });

  describe('XIRR Cashflow Solver', () => {
    test('calculates XIRR for standard cash outflows and inflow', () => {
      const cashflows = [
        { amount: -10000, date: '2023-01-01' },
        { amount: -10000, date: '2024-01-01' },
        { amount: 23000, date: '2025-01-01' },
      ];
      const xirr = calculateXIRR(cashflows);
      // Annual return should be approx ~9.6%
      assert.ok(xirr > 0.05 && xirr < 0.15);
    });

    test('returns 0 when all cashflows have same sign', () => {
      const cashflows = [
        { amount: -10000, date: '2023-01-01' },
        { amount: -10000, date: '2024-01-01' },
      ];
      const xirr = calculateXIRR(cashflows);
      assert.equal(xirr, 0);
    });
  });
});
