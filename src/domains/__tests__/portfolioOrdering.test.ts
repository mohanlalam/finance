import { describe, it, expect } from 'vitest';
import { sortPortfolios, getPortfolioPriority } from '../portfolio/calculations/portfolioOrdering';
import { Portfolio } from '../../types/portfolio';

describe('Portfolio Ordering', () => {
  const createMockPortfolio = (id: string, name: string, label: string): Portfolio => ({
    id,
    name,
    label,
    holdings: [],
    fixedDeposits: [],
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
  });

  it('always places Rammohan as the 1st portfolio', () => {
    const input: Portfolio[] = [
      createMockPortfolio('1', 'padmavathi', 'Padmavathi'),
      createMockPortfolio('2', 'sai_laxmi', 'Sai Laxmi'),
      createMockPortfolio('3', 'rammohan', 'Rammohan'),
    ];

    const sorted = sortPortfolios(input);
    expect(sorted[0].name).toBe('rammohan');
    expect(sorted[1].name).toBe('padmavathi');
    expect(sorted[2].name).toBe('sai_laxmi');
  });

  it('handles variations like Ram Mohan or personal label', () => {
    const input: Portfolio[] = [
      createMockPortfolio('1', 'padmavathi', 'Padmavathi'),
      createMockPortfolio('2', 'personal', 'Ram Mohan'),
    ];

    const sorted = sortPortfolios(input);
    expect(sorted[0].label).toBe('Ram Mohan');
  });

  it('identifies priority ranks correctly', () => {
    expect(getPortfolioPriority({ name: 'rammohan', label: 'Rammohan' })).toBe(0);
    expect(getPortfolioPriority({ name: 'ram_mohan', label: 'Ram Mohan' })).toBe(0);
    expect(getPortfolioPriority({ name: 'padmavathi', label: 'Padmavathi' })).toBe(1);
    expect(getPortfolioPriority({ name: 'sai_laxmi', label: 'Sai Laxmi' })).toBe(2);
    expect(getPortfolioPriority({ name: 'custom_member', label: 'Anand' })).toBe(99);
  });
});
