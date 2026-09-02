import { describe, it, expect } from 'vitest';
import { estimateTodayPnL } from '../../domains/portfolio/calculations/portfolioTotals';
import { Portfolio } from '../../types/portfolio';

describe('estimateTodayPnL', () => {
  it('correctly calculates P&L based on yesterday close logic', () => {
    const portfolio: Portfolio = {
      id: 'p1',
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
          amountInvested: 20000,
          unrealizedPnL: 2000,
          pnlPercent: 10,
          todayPnLPercent: 10, // up 10% today
          currentValue: 22000,
        }
      ],
      fixedDeposits: [],
      goldHoldings: [],
      realEstate: [],
      insurances: [],
      documents: [],
      rdAccounts: [],
      sipAccounts: [],
      totalInvested: 20000,
      totalCurrentValue: 22000,
      totalPnL: 2000,
      totalPnLPercent: 10,
      stocksValue: 22000,
      fdValue: 0,
      rdValue: 0,
      sipValue: 0,
      goldValue: 0,
      realEstateValue: 0,
    };

    // yesterday closing value = currentValue / (1 + todayPnLPercent / 100) = 22000 / 1.10 = 20000
    // today's P&L = currentValue - yesterday closing value = 22000 - 20000 = 2000
    const todayPnL = estimateTodayPnL(portfolio, [portfolio]);
    expect(todayPnL).toBe(2000);
  });

  it('correctly calculates negative today return', () => {
    const portfolio: Portfolio = {
      id: 'p1',
      name: 'personal',
      label: 'Personal',
      holdings: [
        {
          id: 'h1',
          sno: 1,
          stockName: 'TCS',
          ticker: 'TCS',
          yahooSymbol: 'TCS.NS',
          qty: 10,
          avgPrice: 3500,
          ltp: 3150,
          amountInvested: 35000,
          unrealizedPnL: -3500,
          pnlPercent: -10,
          todayPnLPercent: -10, // down 10% today
          currentValue: 31500,
        }
      ],
      fixedDeposits: [],
      goldHoldings: [],
      realEstate: [],
      insurances: [],
      documents: [],
      rdAccounts: [],
      sipAccounts: [],
      totalInvested: 35000,
      totalCurrentValue: 31500,
      totalPnL: -3500,
      totalPnLPercent: -10,
      stocksValue: 31500,
      fdValue: 0,
      rdValue: 0,
      sipValue: 0,
      goldValue: 0,
      realEstateValue: 0,
    };

    // yesterday closing value = 31500 / 0.9 = 35000
    // today's P&L = 31500 - 35000 = -3500
    const todayPnL = estimateTodayPnL(portfolio, [portfolio]);
    expect(todayPnL).toBe(-3500);
  });
});
