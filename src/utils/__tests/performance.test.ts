import { describe, it, expect } from 'vitest';
import { calculateCAGR, calculateXIRR, calculateWeightedAge, getBenchmarkReturns, CashFlow } from '../performance';
import { Portfolio } from '../../types/portfolio';

describe('calculateCAGR', () => {
  it('correctly calculates CAGR', () => {
    // 100 to 121 in 2 years is exactly 10% CAGR
    expect(calculateCAGR(100, 121, 2)).toBeCloseTo(0.10, 4);
  });

  it('returns 0 for invalid values', () => {
    expect(calculateCAGR(-100, 121, 2)).toBe(0);
    expect(calculateCAGR(100, -121, 2)).toBe(0);
    expect(calculateCAGR(100, 121, -2)).toBe(0);
    expect(calculateCAGR(0, 121, 2)).toBe(0);
  });
});

describe('calculateXIRR', () => {
  it('correctly calculates XIRR for a simple 10% annual gain', () => {
    const cashflows: CashFlow[] = [
      { date: '2025-01-01', amount: -10000 },
      { date: '2026-01-01', amount: 11000 },
    ];
    // exactly 10% gain over 1 year
    const xirr = calculateXIRR(cashflows);
    expect(xirr).toBeCloseTo(0.10, 4);
  });

  it('returns 0 for empty cashflows', () => {
    expect(calculateXIRR([])).toBe(0);
    expect(calculateXIRR([{ date: '2025-01-01', amount: -10000 }])).toBe(0);
  });
});

describe('calculateWeightedAge', () => {
  it('calculates weighted average age of investments', () => {
    const now = new Date();
    const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate()).toISOString().split('T')[0];
    const twoYearsAgo = new Date(now.getFullYear() - 2, now.getMonth(), now.getDate()).toISOString().split('T')[0];

    const portfolio: Portfolio = {
      id: 'p-age',
      name: 'personal',
      label: 'Personal',
      holdings: [
        {
          id: 'h1',
          sno: 1,
          stockName: 'Reliance',
          ticker: 'RELIANCE',
          yahooSymbol: 'RELIANCE.NS',
          qty: 10,
          avgPrice: 2000,
          weekLow52: 1800,
          weekHigh52: 2600,
          ltp: 2200,
          amountInvested: 10000, // weight = 10000, age default = 1.0 year
          unrealizedPnL: 2000,
          pnlPercent: 20,
          todayPnLPercent: 0,
          currentValue: 12000,
        }
      ],
      fixedDeposits: [
        {
          id: 'fd-1',
          portfolio_id: 'p-age',
          bank_name: 'HDFC',
          principal_amount: 10000, // weight = 10000, age = 2.0 years
          interest_rate: 7,
          start_date: twoYearsAgo,
          maturity_date: oneYearAgo,
          maturity_amount: 11400,
          status: 'active',
        }
      ],
      goldHoldings: [],
      realEstate: [],
      insurances: [],
      documents: [],
      totalInvested: 20000,
      totalCurrentValue: 22000,
      totalPnL: 2000,
      totalPnLPercent: 10,
    };

    // Expected weighted age = (10000 * 1.0 [stocks default] + 10000 * 2.0 [FD start_date]) / 20000 = 1.5 years
    const weightedAge = calculateWeightedAge(portfolio);
    expect(weightedAge).toBeCloseTo(1.5, 1);
  });
});

describe('getBenchmarkReturns', () => {
  it('returns appropriate benchmark rates', () => {
    const shortTerm = getBenchmarkReturns(1);
    expect(shortTerm.nifty50).toBe(14.5);
    expect(shortTerm.sp500).toBe(12.1);

    const longTerm = getBenchmarkReturns(5);
    expect(longTerm.nifty50).toBe(14.2);
    expect(longTerm.sp500).toBe(11.8);
  });
});
