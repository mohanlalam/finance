import { describe, it, expect } from 'vitest';
import { createNetWorthSnapshot } from '../portfolio/calculations/netWorth';
import { Portfolio } from '../../types/portfolio';

describe('createNetWorthSnapshot', () => {
  it('correctly sums stocks, FDs, RDs, and SIPs into total_value', () => {
    const mockPortfolios = [
      {
        id: 'p1',
        name: 'personal',
        label: 'Personal',
        stocksValue: 100000,
        fdValue: 50000,
        rdValue: 20000,
        sipValue: 30000,
        goldValue: 15000,
        realEstateValue: 500000,
        holdings: [],
        fixedDeposits: [],
        rdAccounts: [],
        sipAccounts: [],
        goldHoldings: [],
        realEstate: [],
        insurances: [],
        documents: [],
        totalInvested: 180000,
        totalCurrentValue: 200000,
        totalPnL: 20000,
        totalPnLPercent: 11.11,
        todayPnL: 1000,
        todayPnLPercent: 0.5,
      },
      {
        id: 'p2',
        name: 'family',
        label: 'Family',
        stocksValue: 200000,
        fdValue: 100000,
        rdValue: 40000,
        sipValue: 60000,
        goldValue: 30000,
        realEstateValue: 0,
        holdings: [],
        fixedDeposits: [],
        rdAccounts: [],
        sipAccounts: [],
        goldHoldings: [],
        realEstate: [],
        insurances: [],
        documents: [],
        totalInvested: 360000,
        totalCurrentValue: 400000,
        totalPnL: 40000,
        totalPnLPercent: 11.11,
        todayPnL: 2000,
        todayPnLPercent: 0.5,
      },
    ] as unknown as Portfolio[];

    const snapshot = createNetWorthSnapshot(mockPortfolios, '2026-09-15');

    expect(snapshot.snapshot_date).toBe('2026-09-15');
    expect(snapshot.stocks_value).toBe(300000);
    expect(snapshot.fd_value).toBe(150000);
    expect(snapshot.rd_value).toBe(60000);
    expect(snapshot.sip_value).toBe(90000);
    expect(snapshot.gold_value).toBe(45000);
    expect(snapshot.real_estate_value).toBe(500000);
    expect(snapshot.total_value).toBe(600000);
  });
});
