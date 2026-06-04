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
  it('returns maturity amount for sip', () => {
    const sip: FixedDeposit = {
      id: 'sip-1',
      portfolio_id: 'p1',
      bank_name: 'Mutual Fund',
      principal_amount: 5000,
      interest_rate: 12,
      start_date: '2026-01-01',
      maturity_date: null,
      maturity_amount: 15000,
      status: 'active',
      fd_type: 'sip',
    };
    expect(getFDEffectiveValue(sip)).toBe(15000);
  });

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

  it('calculates quarterly compounding for regular active FDs', () => {
    const fd: FixedDeposit = {
      id: 'fd-2',
      portfolio_id: 'p1',
      bank_name: 'ICICI',
      principal_amount: 100000,
      interest_rate: 8,
      start_date: '2026-01-01',
      maturity_date: '2027-01-01',
      maturity_amount: 108243,
      status: 'active',
      fd_type: 'regular',
    };
    // 1 year quarterly compounding: 100000 * (1 + 0.08 / 4)^4 = 108243.216
    // Since 2026 is 365 days, years = 365 / 365.25, giving 108237
    const val = getFDEffectiveValue(fd, new Date('2027-01-01'));
    expect(Math.round(val)).toBe(108237);
  });

  it('calculates recurring deposit (RD) compounding correctly', () => {
    const rd: FixedDeposit = {
      id: 'rd-1',
      portfolio_id: 'p1',
      bank_name: 'Post Office',
      principal_amount: 120000,
      interest_rate: 6.8,
      start_date: '2026-01-01',
      maturity_date: '2027-01-01',
      maturity_amount: 124500,
      status: 'active',
      fd_type: 'recurring',
      contributions: [
        { date: '2026-01-01', amount: 10000 },
        { date: '2026-02-01', amount: 10000 },
        { date: '2026-03-01', amount: 10000 },
        { date: '2026-04-01', amount: 10000 },
        { date: '2026-05-01', amount: 10000 },
        { date: '2026-06-01', amount: 10000 },
        { date: '2026-07-01', amount: 10000 },
        { date: '2026-08-01', amount: 10000 },
        { date: '2026-09-01', amount: 10000 },
        { date: '2026-10-01', amount: 10000 },
        { date: '2026-11-01', amount: 10000 },
        { date: '2026-12-01', amount: 10000 },
      ]
    };
    const val = getFDEffectiveValue(rd, new Date('2027-01-01'));
    expect(val).toBeGreaterThan(120000);
    expect(val).toBeLessThan(129000);
  });

});

