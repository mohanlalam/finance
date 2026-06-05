import { describe, it, expect } from 'vitest';
import { getFDEffectiveValue, formatINR, formatPercent } from '../formatters';
import { FixedDeposit } from '../../types/portfolio';

describe('formatINR', () => {
  it('formats thousands correctly', () => {
    expect(formatINR(5000)).toBe('₹5,000.00');
  });

  it('formats lakhs correctly', () => {
    expect(formatINR(150000)).toBe('₹1.50L');
  });

  it('formats crores correctly', () => {
    expect(formatINR(25000000)).toBe('₹2.50Cr');
  });
});

describe('formatPercent', () => {
  it('adds a sign for positive percentage', () => {
    expect(formatPercent(5.5)).toBe('+5.50%');
  });

  it('preserves negative sign', () => {
    expect(formatPercent(-3.25)).toBe('-3.25%');
  });
});

describe('getFDEffectiveValue', () => {
  it('returns maturity amount for matured fds', () => {
    const fd: FixedDeposit = {
      id: 'fd-1',
      portfolio_id: 'p1',
      bank_name: 'HDFC',
      principal_amount: 100000,
      interest_rate: 7.5,
      start_date: '2025-01-01',
      maturity_date: '2026-01-01',
      maturity_amount: 107713,
      status: 'matured',
      fd_type: 'regular',
    };
    expect(getFDEffectiveValue(fd)).toBe(107713);
  });

  it('calculates half-yearly compounding for regular active FDs', () => {
    const fd: FixedDeposit = {
      id: 'fd-2',
      portfolio_id: 'p1',
      bank_name: 'ICICI',
      principal_amount: 100000,
      interest_rate: 8,
      start_date: '2026-01-01',
      maturity_date: '2027-01-01',
      maturity_amount: 108160,
      status: 'active',
      fd_type: 'regular',
    };
    // 1 year half-yearly compounding: 100000 * (1 + 0.08 / 2)^2 = 108160
    // Since 2026 is 365 days, years = 365 / 365.25, giving 108154
    const val = getFDEffectiveValue(fd, new Date('2027-01-01'));
    expect(Math.round(val)).toBe(108154);
  });
});

