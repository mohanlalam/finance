import { describe, it, expect } from 'vitest';
import { calculateRebalancing } from '../rebalancing';
import { Portfolio } from '../../types/portfolio';

describe('calculateRebalancing', () => {
  const targetPcts = { equity: 60, debt: 20, gold: 10, realEstate: 10 };

  it('handles empty portfolio correctly (zero total value)', () => {
    const advice = calculateRebalancing([], null, targetPcts);
    expect(advice.length).toBe(0);
  });

  it('handles 100% equity portfolio correctly', () => {
    const portfolios: Portfolio[] = [
      {
        id: 'p-1',
        name: 'personal',
        label: 'Personal',
        holdings: [
          {
            id: 'h-1',
            sno: 1,
            stockName: 'RIL',
            ticker: 'RELIANCE',
            yahooSymbol: 'RELIANCE.NS',
            qty: 100,
            avgPrice: 1000,
            weekLow52: 900,
            weekHigh52: 1100,
            ltp: 1000,
            amountInvested: 100000,
            unrealizedPnL: 0,
            pnlPercent: 0,
            todayPnLPercent: 0,
            currentValue: 100000, // 100% Equity
          }
        ],
        fixedDeposits: [],
        goldHoldings: [],
        realEstate: [],
        insurances: [],
        documents: [],
        totalInvested: 100000,
        totalCurrentValue: 100000,
        totalPnL: 0,
        totalPnLPercent: 0,
        stocksValue: 100000,
        fdValue: 0,
        rdValue: 0,
        sipValue: 0,
        goldValue: 0,
        realEstateValue: 0,
      }
    ];

    const advice = calculateRebalancing(portfolios, null, targetPcts);
    const equity = advice.find(a => a.assetClass === 'Equity')!;
    const debt = advice.find(a => a.assetClass === 'Debt')!;

    expect(equity.currentPct).toBe(100);
    expect(equity.action).toBe('SELL'); // Overweight (100% actual vs 60% target)
    expect(debt.currentPct).toBe(0);
    expect(debt.action).toBe('BUY'); // Underweight (0% actual vs 20% target)
  });

  it('evaluates asset drift correctly', () => {
    const portfolios: Portfolio[] = [
      {
        id: 'p-1',
        name: 'personal',
        label: 'Personal',
        holdings: [
          {
            id: 'h-1',
            sno: 1,
            stockName: 'RIL',
            ticker: 'RELIANCE',
            yahooSymbol: 'RELIANCE.NS',
            qty: 598,
            avgPrice: 1000,
            weekLow52: 900,
            weekHigh52: 1100,
            ltp: 1000,
            amountInvested: 598000,
            unrealizedPnL: 0,
            pnlPercent: 0,
            todayPnLPercent: 0,
            currentValue: 598000,
          }
        ],
        fixedDeposits: [
          {
            id: 'fd-1',
            portfolio_id: 'p-1',
            bank_name: 'SBI',
            principal_amount: 202000,
            interest_rate: 6,
            start_date: new Date().toISOString().split('T')[0],
            maturity_date: null,
            maturity_amount: 202000,
            status: 'active',
          }
        ],
        goldHoldings: [
          {
            id: 'g-1',
            portfolio_id: 'p-1',
            item_name: 'Gold',
            purity: '24K',
            weight_grams: 10,
            purchase_price: 100000,
            current_valuation: 100000,
          }
        ],
        realEstate: [
          {
            id: 're-1',
            portfolio_id: 'p-1',
            property_name: 'Plot',
            property_type: 'plot',
            purchase_price: 100000,
            current_valuation: 100000,
            monthly_rent: 0,
          }
        ],
        insurances: [],
        documents: [],
        totalInvested: 1000000,
        totalCurrentValue: 1000000,
        totalPnL: 0,
        totalPnLPercent: 0,
        stocksValue: 598000,
        fdValue: 202000,
        rdValue: 0,
        sipValue: 0,
        goldValue: 100000,
        realEstateValue: 100000,
      }
    ];

    const advice = calculateRebalancing(portfolios, null, targetPcts);
    const equity = advice.find(a => a.assetClass === 'Equity')!;
    expect(equity.action).toBe('HOLD'); // Drift < 2% is HOLD
  });
});
