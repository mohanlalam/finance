import { describe, it, expect } from 'vitest';
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
  };

  it('calculates invested amount based on start date', () => {
    const today = new Date();
    const targetMonth = today.getMonth() - 2;
    const year = today.getFullYear() + (targetMonth < 0 ? -1 : 0);
    const month = (targetMonth + 12) % 12;
    const monthStr = String(month + 1).padStart(2, '0');
    // Using 15th of the month prevents timezone conversion shifts to previous month
    const startStr = `${year}-${monthStr}-15`;
    
    const sip = { ...mockSIP, start_date: startStr };
    expect(getSIPInvestedAmount(sip)).toBe(15000);
  });

  it('returns fallback valuation as effective value', () => {
    expect(getSIPEffectiveValue(mockSIP)).toBe(15000);
  });
});
