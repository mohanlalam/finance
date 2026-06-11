import { describe, it, expect, beforeEach } from 'vitest';
import { SIPAccount } from '../../types/portfolio';
import { getSIPInvestedAmount, getSIPEffectiveValue } from '../sipUtils';

describe('sipUtils', () => {
  const mockSIP: SIPAccount = {
    id: 'sip-1',
    portfolio_id: 'p1',
    fund_name: 'Parag Parikh Flexi Cap',
    monthly_sip: 5000,
    expected_cagr: 12,
    units: 100,
    start_date: '2026-01-01',
    fallback_valuation: 15000,
    mf_scheme_code: '122639',
  };

  beforeEach(() => {
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.clear();
    }
  });

  it('calculates invested amount based on start date and day of month', () => {
    const today = new Date();
    const targetMonth = today.getMonth() - 2;
    const year = today.getFullYear() + (targetMonth < 0 ? -1 : 0);
    const month = (targetMonth + 12) % 12;
    const monthStr = String(month + 1).padStart(2, '0');
    
    // 1st of the month means the installment for this month is already paid
    const startStrPaid = `${year}-${monthStr}-01`;
    const sipPaid = { ...mockSIP, start_date: startStrPaid };
    expect(getSIPInvestedAmount(sipPaid)).toBe(15000); // 3 installments

    // A future day in the month means this month's installment has not been paid yet
    const startStrUnpaid = `${year}-${monthStr}-28`;
    const sipUnpaid = { ...mockSIP, start_date: startStrUnpaid };
    // Depending on today's date, it will either be 2 installments (if today < 28) or 3 (if today >= 28)
    const expectedElapsed = today.getDate() >= 28 ? 3 : 2;
    expect(getSIPInvestedAmount(sipUnpaid)).toBe(5000 * expectedElapsed);
  });

  it('returns fallback valuation as effective value when no live NAV is present', () => {
    expect(getSIPEffectiveValue(mockSIP)).toBe(15000);
  });

  it('uses live NAV from parameter if provided', () => {
    expect(getSIPEffectiveValue(mockSIP, 180)).toBe(180 * 100);
  });

  it('supports units_held custom fallback field in effective value calculation', () => {
    const customSIP = {
      ...mockSIP,
      units: 0,
      units_held: 50
    } as unknown as SIPAccount;
    expect(getSIPEffectiveValue(customSIP, 200)).toBe(10000);
  });
});
