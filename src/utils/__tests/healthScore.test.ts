import { describe, it, expect } from 'vitest';
import { calculateHealthScore } from '../healthScore';
import { Portfolio } from '../../types/portfolio';

describe('calculateHealthScore', () => {
  it('assigns correct score for an empty portfolio dataset', () => {
    const portfolios: Portfolio[] = [];
    const report = calculateHealthScore(portfolios, null);
    // DivScore: 0, SIPs: 0, Emergency: 4, Equity Concentration: 15 (since equity = 0), Insurances: 0
    // Total should be around 19 (clamps between 0 and 100)
    expect(report.score).toBe(19);
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
          start_date: new Date().toISOString().split('T')[0], // Use today's date so effective value = 350000
          maturity_date: null,
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
      stocksValue: 22000,
      fdValue: 350000,
      rdValue: 0,
      ssyValue: 0,
      sipValue: 150000,
      goldValue: 65000,
      realEstateValue: 0,
    };

    const report = calculateHealthScore([portfolio], null);
    // Base score calculation:
    // - active asset classes: stocks, fd, gold => 3 classes => DivScore: 30
    // - active SIP Mutual Fund => 20
    // - emergency fund: fd = 350000 => 350000 > 300000 (6 months of 50000) => 20
    // - single stock RELIANCE (100% of equity) => ConcentrationRisk => Equity Concentration score: 5
    // - health + term insurances active => 15
    // - High debt concentration penalty (FD 350,000 / total 437,000 = 80% > 70%) => -5
    // Total expected score: 30 + 20 + 20 + 5 + 15 - 5 = 85
    expect(report.score).toBe(85);
    expect(report.strengths).toContain('✓ Well diversified across multiple asset classes');
    expect(report.strengths).toContain('✓ Active Mutual Fund SIP discipline');
    expect(report.strengths).toContain('✓ Solid emergency fund buffer (>6 months expenses)');
    expect(report.strengths).toContain('✓ Fully insured: health and term/life cover active');
    expect(report.risks).toContain('⚠ Concentration risk: RELIANCE exceeds 100% of stock holdings');
  });

  it('calculates score with partial insurance and missing SIPs', () => {
    const portfolio: Portfolio = {
      id: 'p-partial',
      name: 'personal',
      label: 'Personal',
      holdings: [],
      fixedDeposits: [
        {
          id: 'fd-1',
          portfolio_id: 'p-partial',
          bank_name: 'HDFC',
          principal_amount: 200000, // Covers 4 months (between 3 and 6)
          interest_rate: 7,
          start_date: new Date().toISOString().split('T')[0],
          maturity_date: null,
          maturity_amount: 200000,
          status: 'active',
        }
      ],
      goldHoldings: [],
      realEstate: [],
      sipAccounts: [], // Missing SIPs
      insurances: [
        {
          id: 'ins-1',
          portfolio_id: 'p-partial',
          policy_name: 'HDFC Ergo Health',
          insurance_type: 'health',
          provider: 'HDFC Ergo',
          premium_amount: 15000,
          sum_assured: 1000000,
          renewal_date: '2027-01-01',
        } // Only health insurance, missing term
      ],
      documents: [],
      totalInvested: 200000,
      totalCurrentValue: 200000,
      totalPnL: 0,
      totalPnLPercent: 0,
      stocksValue: 0,
      fdValue: 200000,
      rdValue: 0,
      ssyValue: 0,
      sipValue: 0,
      goldValue: 0,
      realEstateValue: 0,
    };

    const report = calculateHealthScore([portfolio], null);
    // Score calculation:
    // - active classes: only FD (Debt) => 1 class => DivScore: 10
    // - active SIP => 0 (risks contain "⚠ No active Mutual Fund SIPs running")
    // - emergency fund: 200000 covers 4 months => 12 points
    // - stock concentration: no stocks => 15 points
    // - insurance: partial health active => 7 points
    // - High debt penalty: debt is 100% (>70%) => -5
    // Total expected score: 10 + 0 + 12 + 15 + 7 - 5 = 39
    expect(report.score).toBe(39);
    expect(report.risks).toContain('⚠ No active Mutual Fund SIPs running');
    expect(report.risks).toContain('⚠ Missing Term/Life insurance policy');
  });

  it('calculates perfect score under optimal diversification and covers', () => {
    // We want a portfolio with:
    // - At least 3 asset classes active: Stocks, Debt (FD), Gold (DivScore = 30)
    // - SIP active (SIP score = 20)
    // - Emergency fund covers >= 6 months (Emergency score = 20)
    // - Diversified stocks: let's have 8 stocks, each 12.5% of equity (Equity Concentration = 15)
    // - Both insurances active (Insurance score = 15)
    // - Total values balanced to avoid concentration penalties:
    //   - Total Value = 600,000
    //   - Equity: 8 stocks * 25,000 = 200,000 (33.3%, well below 60%)
    //   - Debt: FD 300,000 (50%, below 70%) -> covers exactly 6 months of 50,000 expenses
    //   - Gold: 100,000 (16.7%)
    //   - Real Estate: 0
    // - This avoids all -5 penalties. Total should be 30 + 20 + 20 + 15 + 15 = 100.
    const holdings = Array.from({ length: 8 }, (_, i) => ({
      id: `h-${i}`,
      sno: i + 1,
      stockName: `Stock ${i}`,
      ticker: `STK${i}`,
      yahooSymbol: `STK${i}.NS`,
      qty: 25,
      avgPrice: 1000,
      weekLow52: 900,
      weekHigh52: 1100,
      ltp: 1000,
      amountInvested: 25000,
      unrealizedPnL: 0,
      pnlPercent: 0,
      todayPnLPercent: 0,
      currentValue: 25000,
    }));

    const portfolio: Portfolio = {
      id: 'p-perfect',
      name: 'personal',
      label: 'Personal',
      holdings,
      fixedDeposits: [
        {
          id: 'fd-1',
          portfolio_id: 'p-perfect',
          bank_name: 'HDFC',
          principal_amount: 300000,
          interest_rate: 7,
          start_date: new Date().toISOString().split('T')[0],
          maturity_date: null,
          maturity_amount: 300000,
          status: 'active',
        }
      ],
      goldHoldings: [
        {
          id: 'g-1',
          portfolio_id: 'p-perfect',
          item_name: 'Gold coins',
          purity: '24K',
          weight_grams: 15,
          purchase_price: 100000,
          current_valuation: 100000,
        }
      ],
      realEstate: [],
      sipAccounts: [
        {
          id: 'sip-1',
          portfolio_id: 'p-perfect',
          fund_name: 'Flexi Cap Fund',
          monthly_sip: 5000,
          expected_cagr: 12,
          units: 10,
          start_date: '2025-01-01',
          fallback_valuation: 50000,
        }
      ],
      insurances: [
        {
          id: 'ins-1',
          portfolio_id: 'p-perfect',
          policy_name: 'Health',
          insurance_type: 'health',
          provider: 'Provider A',
          premium_amount: 10000,
          sum_assured: 500000,
          renewal_date: '2027-01-01',
        },
        {
          id: 'ins-2',
          portfolio_id: 'p-perfect',
          policy_name: 'Term',
          insurance_type: 'term',
          provider: 'Provider B',
          premium_amount: 8000,
          sum_assured: 5000000,
          renewal_date: '2027-01-01',
        }
      ],
      documents: [],
      totalInvested: 600000,
      totalCurrentValue: 600000,
      totalPnL: 0,
      totalPnLPercent: 0,
      stocksValue: 200000,
      fdValue: 300000,
      rdValue: 0,
      ssyValue: 0,
      sipValue: 50000,
      goldValue: 100000,
      realEstateValue: 0,
    };

    const report = calculateHealthScore([portfolio], null);
    expect(report.score).toBe(100);
    expect(report.risks.length).toBe(0);
  });
});
