import { describe, it, expect } from 'vitest';
import { validateBackupJSON } from '../backupValidation';
import { Portfolio } from '../../types/portfolio';

describe('Backup Validation Engine', () => {
  const samplePortfolio: Portfolio = {
    id: 'port-1',
    name: 'rammohan',
    label: 'Ram Mohan',
    holdings: [
      {
        sno: 1,
        id: 'h-1',
        ticker: 'RELIANCE',
        stockName: 'Reliance Industries',
        yahooSymbol: 'RELIANCE.NS',
        qty: 10,
        avgPrice: 2500,
        amountInvested: 25000,
        ltp: 2800,
        currentValue: 28000,
        unrealizedPnL: 3000,
        pnlPercent: 12,
        todayPnLPercent: 0,
        weekLow52: 2200,
        weekHigh52: 3000,
      },
    ],
    fixedDeposits: [
      {
        id: 'fd-1',
        portfolio_id: 'port-1',
        bank_name: 'HDFC Bank',
        principal_amount: 100000,
        interest_rate: 7.2,
        start_date: '2023-01-01',
        maturity_date: '2025-01-01',
        maturity_amount: 115000,
        status: 'active',
      },
    ],
    rdAccounts: [],
    sipAccounts: [],
    goldHoldings: [],
    realEstate: [],
    insurances: [],
    documents: [],
    totalInvested: 200000,
    totalCurrentValue: 228000,
    totalPnL: 28000,
    totalPnLPercent: 14,
    stocksValue: 28000,
    fdValue: 200000,
    rdValue: 0,
    sipValue: 0,
    goldValue: 0,
    realEstateValue: 0,
  };

  it('validates a correct JSON backup envelope and calculates counts accurately', () => {
    const backup = {
      exportedAt: '2026-08-16T12:00:00Z',
      portfolios: [samplePortfolio],
    };

    const report = validateBackupJSON(JSON.stringify(backup), []);
    expect(report.isValid).toBe(true);
    expect(report.portfolioCount).toBe(1);
    expect(report.portfolioNames).toContain('rammohan');
    expect(report.counts.stocks).toBe(1);
    expect(report.counts.fixedDeposits).toBe(1);
    expect(report.counts.totalAssets).toBe(2);
    expect(report.schemaErrors.length).toBe(0);
  });

  it('detects duplicate holdings against existing portfolio state', () => {
    const backup = {
      exportedAt: '2026-08-16T12:00:00Z',
      portfolios: [samplePortfolio],
    };

    const report = validateBackupJSON(JSON.stringify(backup), [samplePortfolio]);
    expect(report.isValid).toBe(true);
    expect(report.duplicates.stocks).toContain('RELIANCE (rammohan)');
    expect(report.duplicates.fixedDeposits).toHaveLength(1);
    expect(report.warnings.length).toBeGreaterThan(0);
  });

  it('rejects invalid JSON syntax and malformed schemas cleanly', () => {
    const report = validateBackupJSON('NOT VALID JSON');
    expect(report.isValid).toBe(false);
    expect(report.schemaErrors.length).toBeGreaterThan(0);
  });
});
