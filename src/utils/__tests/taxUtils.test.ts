import { describe, it, expect } from 'vitest';
import { calculateTaxHarvesting } from '../taxUtils';
import { Holding } from '../../types/portfolio';

describe('calculateTaxHarvesting', () => {
  it('separates equity STCG/LTCG and Debt/Gold slab rates', () => {
    const holdings: Holding[] = [
      {
        ticker: 'RELIANCE',
        stockName: 'Reliance Industries',
        qty: 10,
        avgPrice: 2000,
        currentPrice: 2500,
        currentValue: 25000,
        investedAmount: 20000,
        unrealizedPnL: 5000,
        unrealizedPnLPercent: 25,
        todayPnL: 100,
        todayPnLPercent: 0.5,
        created_at: new Date(Date.now() - 400 * 24 * 60 * 60 * 1000).toISOString(), // > 1 yr (LTCG)
      },
      {
        ticker: 'TCS',
        stockName: 'Tata Consultancy Services',
        qty: 5,
        avgPrice: 3500,
        currentPrice: 3000,
        currentValue: 15000,
        investedAmount: 17500,
        unrealizedPnL: -2500,
        unrealizedPnLPercent: -14.28,
        todayPnL: -50,
        todayPnLPercent: -0.3,
        created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // < 1 yr (STCG loss)
      },
      {
        ticker: 'GOLDBEES',
        stockName: 'Nippon India ETF Gold BeES',
        qty: 100,
        avgPrice: 50,
        currentPrice: 60,
        currentValue: 6000,
        investedAmount: 5000,
        unrealizedPnL: 1000,
        unrealizedPnLPercent: 20,
        todayPnL: 10,
        todayPnLPercent: 0.2,
        created_at: new Date(Date.now() - 400 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        ticker: 'LIQUIDBEES',
        stockName: 'Nippon India ETF Liquid BeES',
        qty: 10,
        avgPrice: 1000,
        currentPrice: 950,
        currentValue: 9500,
        investedAmount: 10000,
        unrealizedPnL: -500,
        unrealizedPnLPercent: -5,
        todayPnL: 0,
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
