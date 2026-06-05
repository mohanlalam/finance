import { describe, it, expect } from 'vitest';
import { calculateHealthScore } from '../healthScore';
import { Portfolio } from '../../types/portfolio';

describe('calculateHealthScore', () => {
  it('assigns correct score for an empty portfolio dataset', () => {
    const portfolios: Portfolio[] = [];
    const report = calculateHealthScore(portfolios, null);
    // DivScore: 0, SIPs: 0, Emergency: 5, Equity Concentration: 15 (since equity = 0), Insurances: 0
    // Total should be around 20 (clamps between 0 and 100)
    expect(report.score).toBe(20);
    expect(report.risks).toContain('⚠ Empty portfolio: no assets registered yet');
    expect(report.risks).toContain('⚠ No active Mutual Fund SIPs running');
    expect(report.risks).toContain('⚠ Critical risk: no health or term insurance policy registered');
  });

  it('evaluates healthy diversified portfolio correctly', () => {
    const portfolio: Portfolio = {
      id: 'p-healthy',
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
          todayPnLPercent: 0,
          currentValue: 22000,
        }
      ],
      fixedDeposits: [
        {
          id: 'fd-1',
          portfolio_id: 'p-healthy',
          bank_name: 'HDFC',
          principal_amount: 350000, // Covers emergency fund (>6 months of 50000)
          interest_rate: 7,
          start_date: '2025-01-01',
          maturity_date: '2026-01-01',
          maturity_amount: 374500,
          status: 'active',
        }
      ],
      goldHoldings: [
        {
          id: 'g-1',
          portfolio_id: 'p-healthy',
          item_name: 'Gold coins',
          purity: '24K',
          weight_grams: 10,
          purchase_price: 60000,
          current_valuation: 65000,
        }
      ],
      realEstate: [],
      sipAccounts: [
        {
          id: 'sip-1',
          portfolio_id: 'p-healthy',
          fund_name: 'Parag Parikh Flexi Cap',
          monthly_sip: 10000,
          expected_cagr: 12,
          units: 100,
          start_date: '2025-01-01',
          fallback_valuation: 150000,
        }
      ],
      insurances: [
        {
          id: 'ins-1',
          portfolio_id: 'p-healthy',
          policy_name: 'HDFC Ergo Health',
          insurance_type: 'health',
          provider: 'HDFC Ergo',
          premium_amount: 15000,
          sum_assured: 1000000,
          renewal_date: '2027-01-01',
        },
        {
          id: 'ins-2',
          portfolio_id: 'p-healthy',
          policy_name: 'LIC Term',
          insurance_type: 'term',
          provider: 'LIC',
          premium_amount: 12000,
          sum_assured: 10000000,
          renewal_date: '2027-01-01',
        }
      ],
      documents: [],
      totalInvested: 440000,
      totalCurrentValue: 437000,
      totalPnL: -3000,
      totalPnLPercent: -0.68,
    };

    const report = calculateHealthScore([portfolio], null);
    // Base score calculation:
    // - active asset classes: stocks, fd, gold => 3 classes => DivScore: 30
    // - active SIP Mutual Fund => 20
    // - emergency fund: fd = 350000 > 300000 (6 months of 50000) => 25
    // - single stock RELIANCE (100% of equity) => ConcentrationRisk -10 => Equity Concentration score: 5
    // - health + term insurances active => 10
    // - High debt concentration penalty (FD is >70% of total assets) => -5
    // Total expected score: 30 + 20 + 25 + 5 + 10 - 5 = 85
    expect(report.score).toBe(85);
    expect(report.strengths).toContain('✓ Well diversified across multiple asset classes');
    expect(report.strengths).toContain('✓ Active Mutual Fund SIP discipline');
    expect(report.strengths).toContain('✓ Solid emergency fund buffer (>6 months expenses)');
    expect(report.strengths).toContain('✓ Fully insured: health and term/life cover active');
    expect(report.risks).toContain('⚠ Concentration risk: RELIANCE exceeds 100% of stock holdings');
  });
});
