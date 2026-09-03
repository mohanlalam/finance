import { describe, it, expect } from 'vitest';
import { generateReinvestmentMatrix } from '../cashflow/calculations/reinvestmentPlaybook';
import { Portfolio } from '../../types/portfolio';

describe('reinvestmentPlaybook calculation engine', () => {
  const mockPortfolios: Portfolio[] = [
    {
      id: 'p1',
      name: 'Rammohan',
      label: 'Rammohan',
      holdings: [],
      fixedDeposits: [
        {
          id: 'fd1',
          portfolio_id: 'p1',
          bank_name: 'ICICI Bank',
          principal_amount: 500000,
          interest_rate: 7.1,
          start_date: '2025-10-15',
          maturity_date: '2026-10-15', // 45 days from 2026-09-01
          maturity_amount: 535500,
          status: 'active',
        },
      ],
      rdAccounts: [],
      sipAccounts: [],
      goldHoldings: [],
      realEstate: [],
      insurances: [],
      documents: [],
      totalInvested: 0,
      totalCurrentValue: 0,
      totalPnL: 0,
      totalPnLPercent: 0,
      stocksValue: 0,
      fdValue: 0,
      rdValue: 0,
      sipValue: 0,
      goldValue: 0,
      realEstateValue: 0,
    },
  ];

  it('detects maturing FD within 90 days horizon', () => {
    const refDate = new Date('2026-09-01T00:00:00Z');
    const result = generateReinvestmentMatrix(mockPortfolios, 90, refDate);

    expect(result.maturingCount).toBe(1);
    expect(result.totalUpcomingMaturitiesAmount).toBe(535500);

    const opp = result.opportunities[0];
    expect(opp.title).toContain('ICICI Bank');
    expect(opp.ownerName).toBe('Rammohan');
    expect(opp.daysToMaturity).toBe(44);
  });

  it('generates 3 comparative reinvestment options: Bank FD, Arbitrage Fund, and Gold SGB', () => {
    const refDate = new Date('2026-09-01T00:00:00Z');
    const result = generateReinvestmentMatrix(mockPortfolios, 90, refDate);

    const opp = result.opportunities[0];
    expect(opp.playbookOptions).toHaveLength(3);

    const fdOpt = opp.playbookOptions.find((o) => o.type === 'bank_fd');
    const arbOpt = opp.playbookOptions.find((o) => o.type === 'arbitrage_fund');
    const sgbOpt = opp.playbookOptions.find((o) => o.type === 'gold_sgb');

    expect(fdOpt).toBeDefined();
    expect(arbOpt).toBeDefined();
    expect(sgbOpt).toBeDefined();

    // Verify family tax-arbitrage splits are included
    expect(fdOpt?.recommendedMemberSplit.length).toBeGreaterThanOrEqual(1);
    expect(arbOpt?.recommendedMemberSplit.length).toBeGreaterThanOrEqual(1);
  });
});
