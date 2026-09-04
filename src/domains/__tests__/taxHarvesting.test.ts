import { describe, it, expect } from 'vitest';
import { calculateTaxHarvesting } from '../taxation/calculations/taxHarvesting';
import {
  calculateEquityCapitalGainsTax,
  INDIAN_TAX_RATES_PRE_2024,
  INDIAN_TAX_RATES_2024,
  getTaxRatesForFY,
} from '../taxation/calculations/capitalGains';
import { getFinancialYear, isDateInFinancialYear } from '../taxation/calculations/financialYear';
import { Holding } from '../../types/portfolio';

describe('Tax Calculations', () => {
  it('calculates equity capital gains tax correctly with exemption', () => {
    // ₹2,00,000 LTCG -> ₹1,25,000 exempt -> ₹75,000 taxable at 12.5% = ₹9,375
    // ₹50,000 STCG at 20% = ₹10,000
    // Total = ₹19,375
    const tax = calculateEquityCapitalGainsTax(50000, 200000);
    expect(tax.stcgTax).toBe(10000);
    expect(tax.taxableLtcg).toBe(75000);
    expect(tax.ltcgTax).toBe(9375);
    expect(tax.totalTax).toBe(19375);
  });

  it('identifies tax loss harvesting opportunities and offsets', () => {
    const holdings: Holding[] = [
      {
        id: 'h1',
        sno: 1,
        stockName: 'Loss Stock A',
        ticker: 'LOSSA',
        yahooSymbol: 'LOSSA.NS',
        qty: 10,
        avgPrice: 1000,
        ltp: 800,
        amountInvested: 10000,
        unrealizedPnL: -2000,
        pnlPercent: -20,
        todayPnLPercent: 0,
        currentValue: 8000,
        created_at: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString(), // STCL
      },
      {
        id: 'h2',
        sno: 2,
        stockName: 'Gain Stock B',
        ticker: 'GAINB',
        yahooSymbol: 'GAINB.NS',
        qty: 10,
        avgPrice: 1000,
        ltp: 1500,
        amountInvested: 10000,
        unrealizedPnL: 5000,
        pnlPercent: 50,
        todayPnLPercent: 0,
        currentValue: 15000,
        created_at: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString(), // STCG
      },
    ];

    const result = calculateTaxHarvesting(holdings);
    expect(result.opportunities.length).toBe(1);
    expect(result.harvestableLosses).toBe(2000);
    // STCL of 2000 offsets STCG of 5000 at 20% -> potential savings = ₹400
    expect(result.potentialTaxSavings).toBe(400);
  });

  it('supports pre-budget 2024 historical tax rates and multi-year rates', () => {
    // FY 2023-24: 15% STCG, 10% LTCG with ₹1L exemption
    const preTax = calculateEquityCapitalGainsTax(50000, 200000, INDIAN_TAX_RATES_PRE_2024);
    expect(preTax.stcgTax).toBe(7500); // 50000 * 0.15
    expect(preTax.taxableLtcg).toBe(100000); // 200000 - 100000
    expect(preTax.ltcgTax).toBe(10000); // 100000 * 0.10
    expect(preTax.totalTax).toBe(17500);

    // Resolves FY correctly
    expect(getTaxRatesForFY('FY 2023-24')).toEqual(INDIAN_TAX_RATES_PRE_2024);
    expect(getTaxRatesForFY('FY 2024-25')).toEqual(INDIAN_TAX_RATES_2024);
    expect(getTaxRatesForFY('FY 2025-26')).toEqual(INDIAN_TAX_RATES_2024);
  });

  it('accurately resolves Indian financial year boundaries (Apr 1 to Mar 31)', () => {
    // April 2024 -> FY 2024-25
    const apr2024 = getFinancialYear(new Date(2024, 3, 15));
    expect(apr2024.financialYear).toBe('FY 2024-25');
    expect(apr2024.startYear).toBe(2024);
    expect(apr2024.endYear).toBe(2025);

    // January 2024 -> FY 2023-24
    const jan2024 = getFinancialYear(new Date(2024, 0, 15));
    expect(jan2024.financialYear).toBe('FY 2023-24');
    expect(jan2024.startYear).toBe(2023);
    expect(jan2024.endYear).toBe(2024);

    // March 31, 2025 is inside FY 2024-25
    expect(isDateInFinancialYear(new Date(2025, 2, 31, 12, 0, 0), apr2024)).toBe(true);
    // April 1, 2025 is outside FY 2024-25
    expect(isDateInFinancialYear(new Date(2025, 3, 1, 0, 0, 0), apr2024)).toBe(false);
  });
});
