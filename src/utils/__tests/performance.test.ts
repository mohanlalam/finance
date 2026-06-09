import { describe, it, expect } from 'vitest';
import { calculateCAGR, calculateXIRR, calculateWeightedAge, getBenchmarkReturns, CashFlow, getPortfolioAnnualizedReturn } from '../performance';
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

  it('returns 0 for negative-only or positive-only cashflows', () => {
    const negativeOnly = [
      { date: '2025-01-01', amount: -10000 },
      { date: '2025-06-01', amount: -5000 },
    ];
    const positiveOnly = [
      { date: '2025-01-01', amount: 10000 },
      { date: '2025-06-01', amount: 5000 },
    ];
    expect(calculateXIRR(negativeOnly)).toBe(0);
    expect(calculateXIRR(positiveOnly)).toBe(0);
  });

  it('correctly calculates XIRR for a 20-year cashflow', () => {
    const cashflows: CashFlow[] = [
      { date: '2005-01-01', amount: -10000 },
      { date: '2025-01-01', amount: 67275 }, // ~10% CAGR over 20 years (1.1^20 * 10000 = 67275)
    ];
    const xirr = calculateXIRR(cashflows);
    expect(xirr).toBeCloseTo(0.10, 2);
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
      stocksValue: 12000,
      fdValue: 10000,
      rdValue: 0,
      sipValue: 0,
      goldValue: 0,
      realEstateValue: 0,
    };

    // Expected weighted age = (10000 * 1.0 [stocks default] + 10000 * 2.0 [FD start_date]) / 20000 = 1.5 years
    const weightedAge = calculateWeightedAge(portfolio);
    expect(weightedAge).toBeCloseTo(1.5, 1);
  });

  it('weights RDs and SIPs by their actual invested amounts', () => {
    const now = new Date();
    const twoYearsAgo = new Date(now.getFullYear() - 2, now.getMonth(), now.getDate()).toISOString().split('T')[0];

    const portfolio: Portfolio = {
      id: 'p-age-2',
      name: 'personal',
      label: 'Personal',
      holdings: [],
      fixedDeposits: [],
      goldHoldings: [],
      realEstate: [],
      insurances: [],
      documents: [],
      sipAccounts: [
        {
          id: 'sip-1',
          portfolio_id: 'p-age-2',
          fund_name: 'Nippon Large Cap',
          monthly_sip: 5000,
          expected_cagr: 12,
          units: 100,
          start_date: twoYearsAgo,
          fallback_valuation: 130000,
        }
      ],
      totalInvested: 120000,
      totalCurrentValue: 130000,
      totalPnL: 10000,
      totalPnLPercent: 8.33,
      stocksValue: 0,
      fdValue: 0,
      rdValue: 0,
      sipValue: 130000,
      goldValue: 0,
      realEstateValue: 0,
    };

    // The SIP is 2 years old.
    // getSIPInvestedAmount(sip) will return 5000 * 24 = 120000.
    // The weighted age should be exactly 2.0.
    const weightedAge = calculateWeightedAge(portfolio);
    expect(weightedAge).toBeCloseTo(2.0, 1);
  });
});

describe('getPortfolioAnnualizedReturn (XIRR)', () => {
  it('correctly calculates XIRR for a portfolio with standard SIP cashflows', () => {
    const now = new Date();
    const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate()).toISOString().split('T')[0];

    const portfolio: Portfolio = {
      id: 'p-xirr-test',
      name: 'personal',
      label: 'Personal',
      holdings: [],
      fixedDeposits: [],
      goldHoldings: [],
      realEstate: [],
      insurances: [],
      documents: [],
      sipAccounts: [
        {
          id: 'sip-xirr',
          portfolio_id: 'p-xirr-test',
          fund_name: 'Nifty 50 Index Fund',
          monthly_sip: 10000,
          expected_cagr: 12,
          units: 100,
          start_date: oneYearAgo,
          fallback_valuation: 140000, // total invested is 130000 (13 months), valued at 140000
        }
      ],
      totalInvested: 130000,
      totalCurrentValue: 140000,
      totalPnL: 5000,
      totalPnLPercent: 4.17,
      stocksValue: 0,
      fdValue: 0,
      rdValue: 0,
      sipValue: 140000,
      goldValue: 0,
      realEstateValue: 0,
    };

    const rate = getPortfolioAnnualizedReturn(portfolio);
    // 12 monthly deposits of 10000, final value 125000 in 1 year.
    // XIRR should solve to positive double-digit return rate (around 7-8% depending on exact days).
    expect(rate).toBeGreaterThan(0.05);
    expect(rate).toBeLessThan(0.20);
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
