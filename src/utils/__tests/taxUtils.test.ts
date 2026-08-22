import { describe, it, expect } from 'vitest';
import { calculateTaxHarvesting } from '../taxUtils';
import { Holding } from '../../types/portfolio';

describe('calculateTaxHarvesting', () => {
  it('separates equity STCG/LTCG and Debt/Gold slab rates', () => {
    const holdings: Holding[] = [
      {
        id: '1',
        sno: 1,
        ticker: 'RELIANCE',
        yahooSymbol: 'RELIANCE.NS',
        stockName: 'Reliance Industries',
        qty: 10,
        avgPrice: 2000,
        ltp: 2500,
        currentValue: 25000,
        amountInvested: 20000,
        unrealizedPnL: 5000,
        pnlPercent: 25,
        todayPnLPercent: 0.5,
        created_at: new Date(Date.now() - 400 * 24 * 60 * 60 * 1000).toISOString(), // > 1 yr (LTCG)
      },
      {
        id: '2',
        sno: 2,
        ticker: 'TCS',
        yahooSymbol: 'TCS.NS',
        stockName: 'Tata Consultancy Services',
        qty: 5,
        avgPrice: 3500,
        ltp: 3000,
        currentValue: 15000,
        amountInvested: 17500,
        unrealizedPnL: -2500,
        pnlPercent: -14.28,
        todayPnLPercent: -0.3,
        created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // < 1 yr (STCG loss)
      },
      {
        id: '3',
        sno: 3,
        ticker: 'GOLDBEES',
        yahooSymbol: 'GOLDBEES.NS',
        stockName: 'Nippon India ETF Gold BeES',
        qty: 100,
        avgPrice: 50,
        ltp: 60,
        currentValue: 6000,
        amountInvested: 5000,
        unrealizedPnL: 1000,
        pnlPercent: 20,
        todayPnLPercent: 0.2,
        created_at: new Date(Date.now() - 400 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: '4',
        sno: 4,
        ticker: 'LIQUIDBEES',
        yahooSymbol: 'LIQUIDBEES.NS',
        stockName: 'Nippon India ETF Liquid BeES',
        qty: 10,
        avgPrice: 1000,
        ltp: 950,
        currentValue: 9500,
        amountInvested: 10000,
        unrealizedPnL: -500,
        pnlPercent: -5,
        todayPnLPercent: 0,
        created_at: new Date(Date.now() - 200 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ];

    const result = calculateTaxHarvesting(holdings);

    expect(result.unrealizedLTCG).toBe(5000);
    expect(result.unrealizedSTCG).toBe(-2500);
    expect(result.unrealizedDebtOrGold).toBe(500); // 1000 (Gold) + (-500) (Liquid)
    expect(result.harvestableLosses).toBe(3000); // 2500 (TCS) + 500 (LIQUIDBEES)
    expect(result.opportunities.length).toBe(2);
    expect(result.opportunities.find(o => o.holding.ticker === 'LIQUIDBEES')?.isDebtOrGold).toBe(true);
    expect(result.opportunities.find(o => o.holding.ticker === 'TCS')?.isDebtOrGold).toBe(false);
  });
});
