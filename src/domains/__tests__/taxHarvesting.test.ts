import { describe, it, expect } from 'vitest';
import { calculateTaxHarvesting } from '../taxation/calculations/taxHarvesting';
import { calculateEquityCapitalGainsTax } from '../taxation/calculations/capitalGains';
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
});
