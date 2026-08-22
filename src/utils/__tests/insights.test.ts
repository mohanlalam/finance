// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { usePortfolioInsights } from '../../hooks/usePortfolioInsights';
import { renderHook } from '@testing-library/react';
import { Portfolio } from '../../types/portfolio';

describe('usePortfolioInsights', () => {
  it('correctly handles portfolios where all holdings have negative returns', () => {
    const mockPortfolios: Portfolio[] = [
      {
        id: 'p-sai-laxmi',
        name: 'sailaxmi',
        label: 'Sai Laxmi',
        holdings: [
          {
            id: 'h1',
            sno: 1,
            stockName: 'Infosys',
            ticker: 'INFY',
            yahooSymbol: 'INFY.NS',
            qty: 10,
            avgPrice: 1500,
            ltp: 1455,
            currentValue: 14550,
            amountInvested: 15000,
            unrealizedPnL: -450,
            pnlPercent: -3.0,
            todayPnLPercent: -0.5,
          },
          {
            id: 'h2',
            sno: 2,
            stockName: 'Tata Gold ETF',
            ticker: 'TATAGOLD',
            yahooSymbol: 'TATAGOLD.NS',
            qty: 100,
            avgPrice: 50,
            ltp: 47.9,
            currentValue: 4790,
            amountInvested: 5000,
            unrealizedPnL: -210,
            pnlPercent: -4.2,
            todayPnLPercent: -0.2,
          },
        ],
        fixedDeposits: [],
        rdAccounts: [],
        sipAccounts: [],
        goldHoldings: [],
        realEstate: [],
        insurances: [],
        documents: [],
        totalInvested: 20000,
        totalCurrentValue: 19340,
        totalPnL: -660,
        totalPnLPercent: -3.3,
        stocksValue: 19340,
        fdValue: 0,
        rdValue: 0,
        sipValue: 0,
        goldValue: 0,
        realEstateValue: 0,
      },
    ];

    const { result } = renderHook(() => usePortfolioInsights(mockPortfolios));

    // When all holdings are in loss, best must be null (no positive gainer), and worst must be TATAGOLD (-4.2%)
    const bestWorst = result.current.portfolioBestWorst[0];
    expect(bestWorst.portfolioLabel).toBe('Sai Laxmi');
    expect(bestWorst.best).toBeNull();
    expect(bestWorst.worst?.ticker).toBe('TATAGOLD');
    expect(bestWorst.worst?.pnlPercent).toBe(-4.2);
  });
});
