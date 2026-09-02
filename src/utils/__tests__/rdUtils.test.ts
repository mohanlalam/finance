import { describe, it, expect } from 'vitest';
import { RDAccount } from '../../types/portfolio';
import { getRDInvestedAmount, getRDEffectiveValue, getRDMaturityValue } from '../../domains/assets/rd/calculations/rdCompounding';

describe('rdUtils', () => {
  const mockRD: RDAccount = {
    id: 'rd-1',
    portfolio_id: 'p1',
    bank_name: 'Post Office',
    monthly_deposit: 10000,
    interest_rate: 6.8,
    start_date: '2026-01-01',
    maturity_date: '2027-01-01',
    maturity_amount: 124500,
    status: 'active',
    contributions: [
      { date: '2026-01-01', amount: 10000 },
      { date: '2026-02-01', amount: 10000 },
    ],
  };

  it('calculates invested amount based on contributions', () => {
    expect(getRDInvestedAmount(mockRD)).toBe(20000);
  });

  it('calculates invested amount as 0 when no contributions', () => {
    expect(getRDInvestedAmount({ ...mockRD, contributions: [] })).toBe(0);
  });

  it('returns maturity amount if status is matured', () => {
    const maturedRD: RDAccount = {
      ...mockRD,
      status: 'matured',
    };
    expect(getRDEffectiveValue(maturedRD)).toBe(124500);
  });

  it('calculates rd effective value compounding correctly for contributions', () => {
    const val = getRDEffectiveValue(mockRD, new Date('2027-01-01'));
    expect(val).toBeGreaterThan(20000);
  });

  it('calculates maturity value correctly', () => {
    expect(getRDMaturityValue(mockRD)).toBe(124500);
  });

  it('returns 0 effective value for future RD that has not yet started', () => {
    const futureRD: RDAccount = {
      ...mockRD,
      start_date: '2028-01-01',
      maturity_date: '2029-01-01',
      contributions: [],
    };
    expect(getRDEffectiveValue(futureRD, new Date('2026-06-01'))).toBe(0);
  });

  it('excludes future contributions from current invested amount and effective value', () => {
    const rdWithFuture: RDAccount = {
      ...mockRD,
      contributions: [
        { date: '2026-01-01', amount: 10000 },
        { date: '2028-01-01', amount: 50000 },
      ],
    };
    expect(getRDInvestedAmount(rdWithFuture, new Date('2026-06-01'))).toBe(10000);
  });

  it('calculates quarterly-compounded value for untracked RD without contributions', () => {
    const untrackedRD: RDAccount = {
      id: 'rd-untracked',
      portfolio_id: 'p1',
      bank_name: 'SBI',
      monthly_deposit: 1000,
      interest_rate: 6.0,
      start_date: '2025-01-01',
      maturity_date: '2025-12-31',
      maturity_amount: 0,
      status: 'active',
      contributions: [],
    };
    // 12 months of 1000 = 12000 principal. With 6% quarterly compounding, value should be ~12395
    const val = getRDEffectiveValue(untrackedRD, new Date('2025-12-31'));
    expect(val).toBeGreaterThan(12300);
    expect(val).toBeLessThan(12500);
  });

  it('handles 0% interest rate gracefully for untracked RD', () => {
    const zeroRateRD: RDAccount = {
      id: 'rd-zero',
      portfolio_id: 'p1',
      bank_name: 'Post Office',
      monthly_deposit: 5000,
      interest_rate: 0,
      start_date: '2025-01-01',
      maturity_date: '2025-06-30',
      maturity_amount: 0,
      status: 'active',
      contributions: [],
    };
    // 6 months of 5000 at 0% rate = 30000
    const val = getRDEffectiveValue(zeroRateRD, new Date('2025-06-30'));
    expect(val).toBe(30000);
  });
});
