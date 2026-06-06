import { describe, it, expect } from 'vitest';
import { calculateRebalancing } from '../rebalancing';
import { Portfolio } from '../../types/portfolio';

describe('calculateRebalancing', () => {
  const targetPcts = { equity: 60, debt: 20, gold: 10, realEstate: 10 };

  it('handles empty portfolio correctly (zero total value)', () => {
    const advice = calculateRebalancing([], null, targetPcts);
    expect(advice.every(a => a.recommendation === 'No assets registered yet')).toBe(true);
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
      }
    ];

    const advice = calculateRebalancing(portfolios, null, targetPcts);
    const equity = advice.find(a => a.assetClass === 'Equity')!;
    const debt = advice.find(a => a.assetClass === 'Debt')!;

    expect(equity.actualPct).toBe(100);
    expect(equity.recommendation).toContain('Sell'); // Overweight (100% actual vs 60% target)
    expect(debt.actualPct).toBe(0);
    expect(debt.recommendation).toContain('Buy'); // Underweight (0% actual vs 20% target)
  });

  it('ignores tiny drifts under MIN_ACTION threshold', () => {
    // Total portfolio value = 1,000,000.
    // Target Equity = 60% (600,000).
    // Actual Equity = 59.8% (598,000). Drift is ₹2,000, which is below ₹5,000 threshold.
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
      }
    ];

    const advice = calculateRebalancing(portfolios, null, targetPcts);
    const equity = advice.find(a => a.assetClass === 'Equity')!;
    expect(equity.recommendation).toBe('Aligned'); // Drift ₹2000 is ignored
  });

  it('triggers rebalancing for small drift % with large absolute values above MIN_ACTION', () => {
    // Total portfolio value = 10,000,000.
    // Target Equity = 60% (6,000,000).
    // Actual Equity = 59.8% (5,980,000).
    // Drift is 0.2%, which is below 0.5% drift percentage, but absolute difference is ₹20,000 (above ₹5,000).
    // It should trigger rebalancing advice.
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
            qty: 5980,
            avgPrice: 1000,
            weekLow52: 900,
            weekHigh52: 1100,
            ltp: 1000,
            amountInvested: 5980000,
            unrealizedPnL: 0,
            pnlPercent: 0,
            todayPnLPercent: 0,
            currentValue: 5980000,
          }
        ],
        fixedDeposits: [
          {
            id: 'fd-1',
            portfolio_id: 'p-1',
            bank_name: 'SBI',
            principal_amount: 2020000,
            interest_rate: 6,
            start_date: new Date().toISOString().split('T')[0],
            maturity_date: null,
            maturity_amount: 2020000,
            status: 'active',
          }
        ],
        goldHoldings: [
          {
            id: 'g-1',
            portfolio_id: 'p-1',
            item_name: 'Gold',
            purity: '24K',
            weight_grams: 100,
            purchase_price: 1000000,
            current_valuation: 1000000,
          }
        ],
        realEstate: [
          {
            id: 're-1',
            portfolio_id: 'p-1',
            property_name: 'Plot',
            property_type: 'plot',
            purchase_price: 1000000,
            current_valuation: 1000000,
            monthly_rent: 0,
          }
        ],
        insurances: [],
        documents: [],
        totalInvested: 10000000,
        totalCurrentValue: 10000000,
        totalPnL: 0,
        totalPnLPercent: 0,
      }
    ];

    const advice = calculateRebalancing(portfolios, null, targetPcts);
    const equity = advice.find(a => a.assetClass === 'Equity')!;
    expect(equity.recommendation).toContain('Buy'); // Underweight by ₹20,000 (needs to buy)
  });
});
