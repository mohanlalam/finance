// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAlerts, useDismissibleAlerts } from '../useAlerts';
import { Portfolio } from '../../types/portfolio';

describe('useAlerts & useDismissibleAlerts', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    vi.clearAllMocks();
  });

  const mockPortfolios: Portfolio[] = [
    {
      id: 'p1',
      name: 'personal',
      label: 'Personal',
      totalInvested: 100000,
      totalCurrentValue: 120000,
      totalPnL: 20000,
      totalPnLPercent: 20,
      stocksValue: 0,
      fdValue: 50000,
      rdValue: 0,
      sipValue: 0,
      goldValue: 0,
      realEstateValue: 0,
      holdings: [],
      fixedDeposits: [
        {
          id: 'fd-1',
          portfolio_id: 'p1',
          bank_name: 'HDFC Bank',
          principal_amount: 50000,
          interest_rate: 7.2,
          start_date: '2025-01-01',
          maturity_date: new Date(Date.now() + 5 * 24 * 3600 * 1000).toISOString().split('T')[0],
          maturity_amount: 53600,
          maturityDateTs: Date.now() + 5 * 24 * 3600 * 1000,
          status: 'active',
        },
      ],
      rdAccounts: [],
      sipAccounts: [],
      goldHoldings: [],
      realEstate: [],
      insurances: [
        {
          id: 'ins-1',
          portfolio_id: 'p1',
          insurance_type: 'term',
          policy_name: 'Term Life',
          provider: 'HDFC Life',
          sum_assured: 10000000,
          premium_amount: 15000,
          renewal_date: new Date(Date.now() + 10 * 24 * 3600 * 1000).toISOString().split('T')[0],
          renewalDateTs: Date.now() + 10 * 24 * 3600 * 1000,
        },
      ],
      documents: [],
    },
  ];

  it('generates upcoming maturity and renewal alerts correctly', () => {
    const { result } = renderHook(() => useAlerts(mockPortfolios));
    const alerts = result.current;

    expect(alerts.length).toBe(2);
    expect(alerts.some((a) => a.type === 'fd_maturity' && a.id.includes('fd-1'))).toBe(true);
    expect(alerts.some((a) => a.type === 'insurance_renewal' && a.id.includes('ins-1'))).toBe(true);
  });

  it('supports single and batch alert dismissals with persistence', () => {
    const { result } = renderHook(() => useDismissibleAlerts(mockPortfolios));

    expect(result.current.visibleAlerts.length).toBe(2);

    // Dismiss first alert
    act(() => {
      result.current.handleDismissAlert(result.current.visibleAlerts[0].id);
    });

    expect(result.current.visibleAlerts.length).toBe(1);

    // Dismiss all
    act(() => {
      result.current.handleDismissAll();
    });

    expect(result.current.visibleAlerts.length).toBe(0);
  });
});
