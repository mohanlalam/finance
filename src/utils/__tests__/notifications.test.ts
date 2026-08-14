import { describe, it, expect, beforeEach } from 'vitest';
import { checkAndNotifyMaturities, isNotificationSupported } from '../notifications';
import { Portfolio } from '../../types/portfolio';

describe('notifications', () => {
  beforeEach(() => {
    if (typeof localStorage !== 'undefined') {
      localStorage.clear();
    }
  });

  it('checks notification support safely in test environment', () => {
    expect(typeof isNotificationSupported()).toBe('boolean');
  });

  it('returns 0 when notification permission is not granted', () => {
    const dummyPortfolios: Portfolio[] = [
      {
        id: 'p1',
        name: 'ram',
        label: 'Ram',
        holdings: [],
        fixedDeposits: [
          {
            id: 'fd1',
            portfolio_id: 'p1',
            bank_name: 'HDFC',
            principal_amount: 100000,
            interest_rate: 7.5,
            start_date: '2024-01-01',
            maturity_date: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
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
      },
    ];

    const count = checkAndNotifyMaturities(dummyPortfolios);
    expect(count).toBe(0);
  });
});
