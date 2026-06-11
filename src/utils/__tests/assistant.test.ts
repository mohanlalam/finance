import { describe, it, expect } from 'vitest';
import { askAssistant } from '../assistant';
import { Portfolio } from '../../types/portfolio';

describe('askAssistant query parser', () => {
  const mockPortfolios: Portfolio[] = [
    {
      id: 'p-1',
      name: 'personal',
      label: 'Personal Portfolio',
      holdings: [
        {
          id: 'stock-1',
          sno: 1,
          stockName: 'Reliance Industries',
          ticker: 'RELIANCE',
          yahooSymbol: 'RELIANCE.NS',
          qty: 10,
          avgPrice: 2000,
          weekLow52: 1800,
          weekHigh52: 2700,
          ltp: 2500,
          amountInvested: 20000,
          unrealizedPnL: 5000, // +25%
          pnlPercent: 25,
          todayPnLPercent: 0,
          currentValue: 25000,
        },
      ],
      fixedDeposits: [
        {
          id: 'fd-1',
          portfolio_id: 'p-1',
          bank_name: 'SBI',
          principal_amount: 100000,
          interest_rate: 6.5,
          start_date: '2025-01-01',
          maturity_date: '2027-01-01', // Maturing in 2027
          maturity_amount: 113000,
          status: 'active',
        },
        {
          id: 'fd-2',
          portfolio_id: 'p-1',
          bank_name: 'HDFC',
          principal_amount: 50000,
          interest_rate: 7.0,
          start_date: '2024-01-01',
          maturity_date: '2025-06-01', // Already matured
          maturity_amount: 55000,
          status: 'active',
        },
      ],
      rdAccounts: [
        {
          id: 'rd-1',
          portfolio_id: 'p-1',
          bank_name: 'ICICI',
          monthly_deposit: 5000,
          interest_rate: 7.0,
          start_date: '2025-01-01',
          maturity_date: '2026-06-01', // Matured or maturing soon
          maturity_amount: 93000,
          status: 'active',
          contributions: [
            { date: '2025-01-10', amount: 5000 },
            { date: '2025-02-10', amount: 5000 },
          ],
        },
      ],
      sipAccounts: [
        {
          id: 'sip-1',
          portfolio_id: 'p-1',
          fund_name: 'Nifty 50 Index Fund',
          monthly_sip: 5000,
          expected_cagr: 12,
          units: 10,
          start_date: '2025-01-01',
          fallback_valuation: 65000,
        },
      ],
      goldHoldings: [
        {
          id: 'gold-1',
          portfolio_id: 'p-1',
          item_name: 'SGB 2026',
          purity: '24K',
          weight_grams: 10,
          purchase_price: 60000,
          current_valuation: 75000, // +25%
        },
      ],
      realEstate: [
        {
          id: 're-1',
          portfolio_id: 'p-1',
          property_name: 'Sector 45 Apartment',
          property_type: 'apartment',
          purchase_price: 5000000,
          current_valuation: 6000000, // +20%
          monthly_rent: 15000,
        },
      ],
      insurances: [
        {
          id: 'ins-1',
          portfolio_id: 'p-1',
          insurance_type: 'health',
          provider: 'Max Life',
          policy_name: 'Secure Health Plus',
          sum_assured: 1000000,
          premium_amount: 15000,
          renewal_date: '2026-12-15',
        },
      ],
      documents: [
        {
          id: 'doc-1',
          portfolio_id: 'p-1',
          name: 'Passport Copy',
          file_path: 'passport.pdf',
          asset_type: 'general',
          expiry_date: '2029-08-20',
        },
      ],
      totalInvested: 5340000,
      totalCurrentValue: 6418000,
      totalPnL: 1078000,
      totalPnLPercent: 20.18,
      stocksValue: 25000,
      fdValue: 150000,
      rdValue: 10000,
      sipValue: 65000,
      goldValue: 75000,
      realEstateValue: 6000000,
    },
  ];

  it('handles top performer queries correctly', () => {
    const res = askAssistant('who is the top performer?', mockPortfolios);
    expect(res.answer).toContain('Sector 45 Apartment'); // Absolute gain: 1,000,000
    expect(res.answer).toContain('Reliance Industries');
    expect(res.matchedAssets.length).toBeGreaterThan(0);
  });

  it('handles maturity year queries', () => {
    const res = askAssistant('maturing in 2027', mockPortfolios);
    expect(res.answer).toContain('SBI FD');
    expect(res.answer).toContain('2027');
    expect(res.matchedAssets.some(m => m.name.includes('SBI'))).toBe(true);
  });

  it('handles upcoming maturity timeline queries with expired alerts', () => {
    const res = askAssistant('upcoming maturities', mockPortfolios);
    expect(res.answer).toContain('Matured Items');
    expect(res.answer).toContain('HDFC FD');
  });

  it('handles asset allocation split queries', () => {
    const res = askAssistant('what is my asset allocation split?', mockPortfolios);
    expect(res.answer).toContain('Consolidated Asset Allocation Split');
    expect(res.answer).toContain('Equity');
    expect(res.answer).toContain('Debt');
    expect(res.answer).toContain('Gold');
    expect(res.answer).toContain('Real Estate');
  });

  it('handles specific asset type queries (gold)', () => {
    const res = askAssistant('how much do I have in gold?', mockPortfolios);
    expect(res.answer).toContain('SGB 2026');
    expect(res.answer).toContain('Gold Registry');
  });

  it('handles insurance renewal queries', () => {
    const res = askAssistant('show insurance due dates', mockPortfolios);
    expect(res.answer).toContain('Max Life - Secure Health Plus');
    expect(res.answer).toContain('due on');
    expect(res.answer).toContain('15,000');
  });

  it('prevents false positive matches on unrelated phrases containing gold or return', () => {
    const resGold = askAssistant('is this gold standard?', mockPortfolios);
    expect(resGold.answer).toContain("I couldn't match your exact query");
    expect(resGold.matchedAssets.length).toBe(0);

    const resReturn = askAssistant('what is the return address?', mockPortfolios);
    expect(resReturn.answer).toContain("I couldn't match your exact query");
    expect(resReturn.matchedAssets.length).toBe(0);
  });

  it('correctly routes ambiguous queries like show me my best SIP returns this year to Intent.PERFORMERS', () => {
    const res = askAssistant('show me my best SIP returns this year', mockPortfolios);
    expect(res.answer).toContain('Sector 45 Apartment'); // matches the top overall performer in mockPortfolios
  });

  it('handles family breakdown queries correctly', () => {
    const res = askAssistant('show family member breakdown', mockPortfolios);
    expect(res.answer).toContain('Family Member Portfolio Breakdown');
    expect(res.answer).toContain('Personal Portfolio');
    expect(res.answer).toContain('64.18L');
    expect(res.matchedAssets.some(m => m.name === 'Personal Portfolio')).toBe(true);
  });

  it('handles upcoming SIP schedules', () => {
    const res = askAssistant('when is my next SIP?', mockPortfolios);
    expect(res.answer).toContain('Upcoming Mutual Fund SIP Schedule');
    expect(res.answer).toContain('Nifty 50 Index Fund');
    expect(res.answer).toContain('5,000');
  });

  it('correctly normalizes queries and maps synonyms', () => {
    // wealth -> net worth -> Intent.NET_WORTH
    const res1 = askAssistant('show my total wealth', mockPortfolios);
    expect(res1.answer).toContain('total consolidated family net worth today is');

    // fds -> fixed deposit -> SPECIFIC_FDS
    const res2 = askAssistant('list my fds', mockPortfolios);
    expect(res2.answer).toContain('Fixed Deposits:');
    expect(res2.answer).toContain('SBI FD');
  });

  it('handles portfolio health queries correctly', () => {
    const res = askAssistant('how healthy is my portfolio?', mockPortfolios);
    expect(res.answer).toContain('Portfolio Health Audit');
    expect(res.answer).toContain('health score is');
  });

  it('handles rebalancing advice queries', () => {
    const res = askAssistant('give me asset rebalancing advice', mockPortfolios);
    expect(res.answer).toContain('Asset Rebalancing Advice');
    expect(res.answer).toContain('Drift');
  });

  it('handles emergency fund status queries', () => {
    const res = askAssistant('check emergency fund status', mockPortfolios);
    expect(res.answer).toContain('Emergency Fund Analysis');
    expect(res.answer).toContain('liquid capital');
  });

  it('handles property rental yield queries', () => {
    const res = askAssistant('rental yields for properties', mockPortfolios);
    expect(res.answer).toContain('Real Estate Rental Yields');
    expect(res.answer).toContain('Sector 45 Apartment');
  });

  it('handles expired document alerts', () => {
    const res = askAssistant('are there expired documents?', mockPortfolios);
    expect(res.answer).toContain('no renewals are due');
  });

  it('handles comprehensive search queries', () => {
    const res = askAssistant('find HDFC', mockPortfolios);
    expect(res.answer).toContain('Consolidated Search Results');
    expect(res.answer).toContain('HDFC FD');
  });
});

