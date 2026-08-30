// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { roundToDecimals } from '../../utils/mathUtils';
import { calculateAggregatedPortfolioTotals, holdingsTotals } from '../portfolio/calculations/portfolioTotals';
import { calculateGoldValuation } from '../assets/gold/calculations/goldValuation';
import { calculateFDMaturityValue } from '../assets/fd/calculations/fdCompounding';
import { calculateEquityCapitalGainsTax } from '../taxation/calculations/capitalGains';
import { Portfolio, Holding } from '../../types/portfolio';

describe('Pillar 1: Financial Math Invariants & Floating-Point Precision', () => {
  it('Invariant 1: Holding Value strictly equals Invested + Unrealized PnL', () => {
    const testCases: Holding[] = [
      {
        id: '1',
        sno: 1,
        stockName: 'Reliance',
        ticker: 'RELIANCE',
        yahooSymbol: 'RELIANCE.NS',
        qty: 15,
        avgPrice: 2450.75,
        ltp: 2890.50,
        amountInvested: 15 * 2450.75,
        currentValue: 15 * 2890.50,
        unrealizedPnL: (15 * 2890.50) - (15 * 2450.75),
        pnlPercent: (((15 * 2890.50) - (15 * 2450.75)) / (15 * 2450.75)) * 100,
        todayPnLPercent: 1.25,
      },
      {
        id: '2',
        sno: 2,
        stockName: 'Infosys',
        ticker: 'INFY',
        yahooSymbol: 'INFY.NS',
        qty: 100,
        avgPrice: 1600.00,
        ltp: 1450.00,
        amountInvested: 160000,
        currentValue: 145000,
        unrealizedPnL: -15000,
        pnlPercent: -9.375,
        todayPnLPercent: -0.5,
      },
    ];

    for (const h of testCases) {
      const computedPnL = roundToDecimals(h.currentValue - h.amountInvested, 2);
      expect(computedPnL).toBe(roundToDecimals(h.unrealizedPnL, 2));
    }

    const totals = holdingsTotals(testCases);
    expect(roundToDecimals(totals.totalCurrentValue - totals.totalInvested, 2)).toBe(roundToDecimals(totals.totalPnL, 2));
  });

  it('Invariant 2: Net Worth strictly equals the sum of all individual asset classes', () => {
    const portfolio: Portfolio = {
      id: 'p-1',
      name: 'family-1',
      label: 'Main Family',
      holdings: [],
      fixedDeposits: [],
      rdAccounts: [],
      sipAccounts: [],
      goldHoldings: [],
      realEstate: [],
      insurances: [],
      documents: [],
      stocksValue: 450000,
      fdValue: 200000,
      rdValue: 75000,
      sipValue: 180000,
      goldValue: 150000,
      realEstateValue: 2500000,
      totalInvested: 2800000,
      totalCurrentValue: 450000 + 200000 + 75000 + 180000 + 150000 + 2500000,
      totalPnL: (450000 + 200000 + 75000 + 180000 + 150000 + 2500000) - 2800000,
      totalPnLPercent: 0,
    };

    const totals = calculateAggregatedPortfolioTotals([portfolio]);
    const manualSum = totals.stocksValue + totals.fdValue + totals.rdValue + totals.sipValue + totals.goldValue + totals.realEstateValue;

    expect(totals.totalCurrentValue).toBe(manualSum);
    expect(totals.totalPnL).toBe(totals.totalCurrentValue - totals.totalInvested);
  });

  it('Invariant 3: Gold Bullion valuation strictly scales with hallmark purity multipliers', () => {
    const spot24K = 7500; // ₹7,500 / gram for 24K
    const weight = 10; // 10 grams

    // 24K: 100%
    const val24K = calculateGoldValuation(weight, '24K', spot24K);
    expect(val24K).toBe(75000);

    // 22K (916): 91.6% (22/24)
    const val22K = calculateGoldValuation(weight, '22K', spot24K);
    expect(val22K).toBe(Math.round(75000 * (22 / 24)));

    // 18K (750): 75.0% (18/24)
    const val18K = calculateGoldValuation(weight, '18K', spot24K);
    expect(val18K).toBe(Math.round(75000 * (18 / 24)));

    // 14K (585): 58.5% (14/24)
    const val14K = calculateGoldValuation(weight, '14K', spot24K);
    expect(val14K).toBe(Math.round(75000 * (14 / 24)));
  });

  it('Invariant 4: Compounding FD interest produces accurate growth over tenure', () => {
    const maturityVal = calculateFDMaturityValue(100000, 7.5, '2024-01-01', '2025-01-01');
    expect(maturityVal).toBeGreaterThan(107500); // Half-yearly compounding yields more than simple 7.5%
  });

  it('Invariant 5: FY24-25 Indian Capital Gains tax enforces 20% STCG and 12.5% LTCG with ₹1.25L exemption', () => {
    // STCG: 20% flat
    const stcgOnly = calculateEquityCapitalGainsTax(50000, 0);
    expect(stcgOnly.stcgTax).toBe(10000); // 20% of 50k
    expect(stcgOnly.totalTax).toBe(10000);

    // LTCG <= 1.25L: 0 tax
    const ltcgExempt = calculateEquityCapitalGainsTax(0, 100000);
    expect(ltcgExempt.ltcgTax).toBe(0);
    expect(ltcgExempt.totalTax).toBe(0);

    // LTCG > 1.25L: 12.5% on excess (₹2.25L -> ₹1L taxable)
    const ltcgTaxable = calculateEquityCapitalGainsTax(0, 225000);
    expect(ltcgTaxable.taxableLtcg).toBe(100000);
    expect(ltcgTaxable.ltcgTax).toBe(12500); // 12.5% of 100,000
    expect(ltcgTaxable.totalTax).toBe(12500);
  });
});