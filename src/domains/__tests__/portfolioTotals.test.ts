import { describe, it, expect } from 'vitest';
import {
  calcTotalInvested,
  calcTotalCurrentValue,
  calcTotalPnL,
  calcPnLPercent,
  calcHoldingTodayPnL,
  estimateTodayPnL,
  calculateAggregatedPortfolioTotals,
} from '../portfolio/calculations/portfolioTotals';
import { classBreakdown, calculateAssetAllocations } from '../portfolio/calculations/allocation';
import { Holding, Portfolio } from '../../types/portfolio';

describe('Portfolio Calculations', () => {
  const mockHoldings: Holding[] = [
    {
      id: 'h1',
      sno: 1,
      stockName: 'Reliance',
      ticker: 'RELIANCE',
      yahooSymbol: 'RELIANCE.NS',
      qty: 10,
      avgPrice: 2000,
      ltp: 2500,
      amountInvested: 20000,
      unrealizedPnL: 5000,
      pnlPercent: 25,
      todayPnLPercent: 2.0,
      currentValue: 25000,
    },
    {
      id: 'h2',
      sno: 2,
      stockName: 'TCS',
      ticker: 'TCS',
      yahooSymbol: 'TCS.NS',
      qty: 5,
      avgPrice: 3000,
      ltp: 3000,
      amountInvested: 15000,
      unrealizedPnL: 0,
      pnlPercent: 0,
      todayPnLPercent: -1.0,
      currentValue: 15000,
    },
  ];

  it('calculates total invested and current value correctly', () => {
    expect(calcTotalInvested(mockHoldings)).toBe(35000);
    expect(calcTotalCurrentValue(mockHoldings)).toBe(40000);
    expect(calcTotalPnL(mockHoldings)).toBe(5000);
    expect(calcPnLPercent(mockHoldings)).toBeCloseTo((5000 / 35000) * 100, 2);
  });

  it('handles empty holdings gracefully', () => {
    expect(calcTotalInvested([])).toBe(0);
    expect(calcTotalCurrentValue([])).toBe(0);
    expect(calcTotalPnL([])).toBe(0);
    expect(calcPnLPercent([])).toBe(0);
  });

  it('calculates intraday holding PnL with Method B', () => {
    // 25000 at +2% -> yesterday value = 25000 / 1.02 = 24509.8039 -> delta = ~490.196
    const delta = calcHoldingTodayPnL(mockHoldings[0]);
    expect(delta).toBeGreaterThan(490);
    expect(delta).toBeLessThan(491);
  });

  it('computes class breakdown and allocations', () => {
    const portfolio: Portfolio = {
      id: 'p1',
      name: 'Padmavathi',
      label: 'Padmavathi',
      holdings: mockHoldings,
      fixedDeposits: [],
      rdAccounts: [],
      sipAccounts: [],
      goldHoldings: [],
      realEstate: [],
      insurances: [],
      documents: [],
      totalInvested: 35000,
      totalCurrentValue: 40000,
      totalPnL: 5000,
      totalPnLPercent: 14.28,
      todayPnL: 340,
      stocksValue: 40000,
      fdValue: 10000,
      rdValue: 5000,
      sipValue: 15000,
      goldValue: 20000,
      realEstateValue: 50000,
    };

    const breakdown = classBreakdown([portfolio], null);
    expect(breakdown.stocks).toBe(40000);
    expect(breakdown.fd).toBe(10000);
    expect(breakdown.gold).toBe(20000);

    const allocations = calculateAssetAllocations(breakdown);
    expect(allocations.length).toBe(6);
    const sumPct = allocations.reduce((acc, a) => acc + a.percentage, 0);
    expect(sumPct).toBeCloseTo(100, 0);

    const estToday = estimateTodayPnL(portfolio, [portfolio]);
    expect(estToday).toBeGreaterThan(0);

    const aggTotals = calculateAggregatedPortfolioTotals([portfolio]);
    expect(aggTotals.totalInvested).toBe(35000);
    expect(aggTotals.totalCurrentValue).toBe(40000);
  });
});
