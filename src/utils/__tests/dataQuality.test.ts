import { describe, it, expect } from 'vitest';
import { analyzePortfolioHealth } from '../dataQuality';
import { Portfolio } from '../../types/portfolio';

const mockBasePortfolio: Portfolio = {
  id: 'p-1',
  name: 'rammohan',
  label: 'Ram Mohan',
  holdings: [],
  fixedDeposits: [],
  rdAccounts: [],
  sipAccounts: [],
  goldHoldings: [],
  realEstate: [],
  insurances: [],
  documents: [],
  totalInvested: 100000,
  totalCurrentValue: 120000,
  totalPnL: 20000,
  totalPnLPercent: 20,
  stocksValue: 50000,
  fdValue: 50000,
  rdValue: 0,
  sipValue: 0,
  goldValue: 0,
  realEstateValue: 0,
};

describe('dataQuality analyzer', () => {
  it('returns perfect 100 score for pristine portfolio', () => {
    const portfolio: Portfolio = {
      ...mockBasePortfolio,
      fixedDeposits: [
        {
          id: 'fd-1',
          portfolio_id: 'p-1',
          bank_name: 'HDFC Bank',
          principal_amount: 100000,
          interest_rate: 7.5,
          start_date: '2026-01-01',
          maturity_date: '2027-01-01',
          maturity_amount: 107500,
          status: 'active',
        },
      ],
      documents: [
        {
          id: 'doc-1',
          portfolio_id: 'p-1',
          name: 'HDFC FD Advice',
          file_path: 'p-1/fd/advice.pdf',
          asset_type: 'fd',
          asset_id: 'fd-1',
        },
      ],
    };

    const health = analyzePortfolioHealth([portfolio]);
    expect(health.score).toBe(100);
    expect(health.criticalCount).toBe(0);
    expect(health.warningCount).toBe(0);
    expect(health.issues.length).toBe(0);
  });

  it('detects missing maturity dates, zero valuations, and expired policies', () => {
    const portfolio: Portfolio = {
      ...mockBasePortfolio,
      fixedDeposits: [
        {
          id: 'fd-missing-mat',
          portfolio_id: 'p-1',
          bank_name: 'SBI',
          principal_amount: 50000,
          interest_rate: 6.8,
          start_date: '2025-01-01',
          maturity_date: null,
          maturity_amount: 0,
          status: 'active',
        },
      ],
      insurances: [
        {
          id: 'ins-expired',
          portfolio_id: 'p-1',
          policy_name: 'HDFC Life Sanchay',
          insurance_type: 'term',
          provider: 'HDFC Life',
          sum_assured: 10000000,
          premium_amount: 15000,
          renewal_date: '2024-01-01', // past date
        },
      ],
      realEstate: [
        {
          id: 're-zero',
          portfolio_id: 'p-1',
          property_name: 'City Plot',
          property_type: 'plot',
          purchase_price: 2000000,
          current_valuation: 0, // zero valuation
          monthly_rent: 0,
        },
      ],
      goldHoldings: [
        {
          id: 'gold-zero',
          portfolio_id: 'p-1',
          item_name: 'Gold Ring',
          purity: '22K',
          weight_grams: 0, // zero weight
          purchase_price: 0,
          current_valuation: 0,
        },
      ],
    };

    const health = analyzePortfolioHealth([portfolio]);
    expect(health.score).toBeLessThan(80);
    expect(health.criticalCount).toBeGreaterThan(0);
    expect(health.issues.some(i => i.id === 'fd-no-mat-fd-missing-mat')).toBe(true);
    expect(health.issues.some(i => i.id === 'ins-expired-ins-expired')).toBe(true);
    expect(health.issues.some(i => i.id === 're-zero-val-re-zero')).toBe(true);
    expect(health.issues.some(i => i.id === 'gold-zero-wt-gold-zero')).toBe(true);
  });

  it('detects unlinked documents for major assets', () => {
    const portfolio: Portfolio = {
      ...mockBasePortfolio,
      fixedDeposits: [
        {
          id: 'fd-no-doc',
          portfolio_id: 'p-1',
          bank_name: 'ICICI Bank',
          principal_amount: 200000,
          interest_rate: 7.2,
          start_date: '2026-01-01',
          maturity_date: '2027-01-01',
          maturity_amount: 215000,
          status: 'active',
        },
      ],
      documents: [],
    };

    const health = analyzePortfolioHealth([portfolio]);
    expect(health.issues.some(i => i.id === 'fd-no-doc-fd-no-doc')).toBe(true);
  });
});
