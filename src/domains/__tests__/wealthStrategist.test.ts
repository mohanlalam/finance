import { describe, it, expect } from 'vitest';
import {
  isCompoundWealthQuery,
  planAndExecuteWealthStrategy,
} from '../ai/assistant/wealthStrategistEngine';
import { Portfolio } from '../../types/portfolio';

describe('wealthStrategistEngine compound reasoning & tool calling', () => {
  const mockPortfolios: Portfolio[] = [
    {
      id: 'p1',
      name: 'Sai Laxmi',
      label: 'Sai Laxmi',
      holdings: [
        {
          id: 'h1',
          sno: 1,
          stockName: 'Tata Motors Ltd',
          ticker: 'TATAMOTORS.NS',
          yahooSymbol: 'TATAMOTORS.NS',
          qty: 100,
          avgPrice: 1000,
          ltp: 800,
          amountInvested: 100000,
          currentValue: 80000,
          unrealizedPnL: -20000, // Loss of 20,000, liquidation value = 80,000
          pnlPercent: -20,
          todayPnLPercent: 0,
        },
        {
          id: 'h2',
          sno: 2,
          stockName: 'Infosys Ltd',
          ticker: 'INFY.NS',
          yahooSymbol: 'INFY.NS',
          qty: 50,
          avgPrice: 1400,
          ltp: 1600,
          amountInvested: 70000,
          currentValue: 80000,
          unrealizedPnL: 10000, // Profitable stock (should NOT be harvested)
          pnlPercent: 14.28,
          todayPnLPercent: 0,
        },
      ],
      fixedDeposits: [
        {
          id: 'fd1',
          portfolio_id: 'p1',
          bank_name: 'SBI',
          principal_amount: 200000,
          interest_rate: 7.0,
          start_date: '2025-01-01',
          maturity_date: '2027-01-01',
          maturity_amount: 230000,
          status: 'active',
        },
      ],
      rdAccounts: [],
      sipAccounts: [],
      goldHoldings: [],
      realEstate: [],
      insurances: [],
      documents: [],
      totalInvested: 170000,
      totalCurrentValue: 160000,
      totalPnL: -10000,
      totalPnLPercent: -5.88,
      stocksValue: 160000,
      fdValue: 200000,
      rdValue: 0,
      sipValue: 0,
      goldValue: 0,
      realEstateValue: 0,
    },
    {
      id: 'p2',
      name: 'Padmavathi',
      label: 'Padmavathi',
      holdings: [],
      fixedDeposits: [
        {
          id: 'fd2',
          portfolio_id: 'p2',
          bank_name: 'HDFC Bank',
          principal_amount: 500000,
          interest_rate: 7.25,
          start_date: '2025-06-01',
          maturity_date: '2026-12-01',
          maturity_amount: 550000,
          status: 'active',
        },
      ],
      rdAccounts: [],
      sipAccounts: [],
      goldHoldings: [],
      realEstate: [],
      insurances: [
        {
          id: 'ins1',
          portfolio_id: 'p2',
          provider: 'Star Health',
          policy_name: 'Family Health Optima',
          sum_assured: 1500000,
          premium_amount: 50000,
          renewal_date: '2026-10-15',
          insurance_type: 'health',
        },
      ],
      documents: [],
      totalInvested: 500000,
      totalCurrentValue: 500000,
      totalPnL: 0,
      totalPnLPercent: 0,
      stocksValue: 0,
      fdValue: 500000,
      rdValue: 0,
      sipValue: 0,
      goldValue: 0,
      realEstateValue: 0,
    },
  ];

  it('detects compound wealth queries correctly', () => {
    const compoundQ1 =
      "If we sell Sai Laxmi's loss-making stocks to harvest tax, can we fund Padmavathi's upcoming ₹50,000 insurance premium next month without breaking any FDs?";
    expect(isCompoundWealthQuery(compoundQ1)).toBe(true);

    const compoundQ2 = 'Can we fund the upcoming premium by liquidating losses without touching deposits?';
    expect(isCompoundWealthQuery(compoundQ2)).toBe(true);

    const simpleQ1 = 'What is my current net worth?';
    expect(isCompoundWealthQuery(simpleQ1)).toBe(false);

    const simpleQ2 = 'Show my gold holdings';
    expect(isCompoundWealthQuery(simpleQ2)).toBe(false);
  });

  it('executes tools and solves mathematical surplus when proceeds exceed liabilities', () => {
    const query =
      "If we sell Sai Laxmi's loss-making stocks to harvest tax, can we fund Padmavathi's upcoming ₹50,000 insurance premium next month without breaking any FDs?";
    const result = planAndExecuteWealthStrategy(query, mockPortfolios);

    expect(result.isCompound).toBe(true);
    expect(result.verdict).toBe('fully_funded');

    // Sai Laxmi's Tata Motors yields 80,000 in liquidation value against 50,000 premium
    // Net surplus = 80,000 - 50,000 = +30,000
    expect(result.verdictHeadline).toContain('Fully Funded');
    expect(result.verdictHeadline).toContain('Surplus');

    // Verify deterministic tool traces
    expect(result.toolTraces.length).toBeGreaterThanOrEqual(3);
    const taxTrace = result.toolTraces.find((t) => t.toolName === 'findTaxHarvestingOpportunities');
    expect(taxTrace).toBeDefined();
    expect(taxTrace?.outputSummary).toContain('80,000');

    const insTrace = result.toolTraces.find((t) => t.toolName === 'checkInsuranceCommitments');
    expect(insTrace).toBeDefined();
    expect(insTrace?.outputSummary).toContain('50,000');

    // Verify report includes math table and no hallucinated numbers
    expect(result.executiveReport).toContain('+₹30,000');
    expect(result.executiveReport).toContain('₹80,000');
    expect(result.executiveReport).toContain('₹50,000');

    // Verify action chips
    expect(result.actionChips.some((c) => c.tab === 'tax')).toBe(true);
    expect(result.actionChips.some((c) => c.tab === 'insurance')).toBe(true);
  });

  it('accurately identifies shortfall when required liability exceeds proceeds', () => {
    // Large liability of 1,20,000 against 80,000 harvest proceeds -> 40,000 shortfall
    const query =
      "If we sell Sai Laxmi's loss-making stocks, can we pay ₹1,20,000 insurance premium without breaking FDs?";
    const result = planAndExecuteWealthStrategy(query, mockPortfolios);

    expect(result.verdict).toBe('shortfall');
    expect(result.verdictHeadline).toContain('Shortfall');
    expect(result.verdictHeadline).toContain('40,000');
    expect(result.executiveReport).toContain('falls short');
  });
});
