import { describe, it, expect } from 'vitest';
import { auditPortfolioDataQuality } from '../data-quality/healthScore';
import { Portfolio } from '../../types/portfolio';

describe('Data Quality Audit', () => {
  it('returns 100 score when all portfolio items are complete', () => {
    const cleanPortfolio: Portfolio = {
      id: 'p1',
      name: 'padmavathi',
      label: 'Padmavathi',
      holdings: [
        {
          id: 'h1',
          sno: 1,
          stockName: 'TCS',
          ticker: 'TCS',
          yahooSymbol: 'TCS.NS',
          qty: 10,
          avgPrice: 3500,
          ltp: 3800,
          amountInvested: 35000,
          unrealizedPnL: 3000,
          pnlPercent: 8.57,
          todayPnLPercent: 0.5,
          currentValue: 38000,
        },
      ],
      fixedDeposits: [
        {
          id: 'fd1',
          portfolio_id: 'p1',
          bank_name: 'HDFC',
          principal_amount: 50000,
          interest_rate: 7.2,
          start_date: '2024-01-01',
          maturity_date: '2025-01-01',
          maturity_amount: 53600,
          status: 'active',
        },
      ],
      rdAccounts: [],
      sipAccounts: [],
      goldHoldings: [],
      realEstate: [],
      insurances: [],
      documents: [],
      totalInvested: 85000,
      totalCurrentValue: 91600,
      totalPnL: 6600,
      totalPnLPercent: 7.76,
      stocksValue: 38000,
      fdValue: 53600,
      rdValue: 0,
      sipValue: 0,
      goldValue: 0,
      realEstateValue: 0,
    };

    const report = auditPortfolioDataQuality([cleanPortfolio]);
    expect(report.score).toBe(100);
    expect(report.issues.length).toBe(0);
  });

  it('detects missing maturity dates and flags warnings', () => {
    const incompletePortfolio: Portfolio = {
      id: 'p1',
      name: 'padmavathi',
      label: 'Padmavathi',
      holdings: [],
      fixedDeposits: [
        {
          id: 'fd1',
          portfolio_id: 'p1',
          bank_name: 'SBI',
          principal_amount: 100000,
          interest_rate: 6.8,
          start_date: '2024-01-01',
          maturity_date: null,
          maturity_amount: 0,
          status: 'active',
        },
      ],
      rdAccounts: [],
      sipAccounts: [],
      goldHoldings: [],
      realEstate: [],
      insurances: [],
      documents: [],
      totalInvested: 100000,
      totalCurrentValue: 100000,
      totalPnL: 0,
      totalPnLPercent: 0,
      stocksValue: 0,
      fdValue: 100000,
      rdValue: 0,
      sipValue: 0,
      goldValue: 0,
      realEstateValue: 0,
    };

    const report = auditPortfolioDataQuality([incompletePortfolio]);
    expect(report.score).toBeLessThan(100);
    expect(report.warningCount).toBe(1);
    expect(report.issues[0].code).toBe('FD_MISSING_MATURITY');
  });
});
