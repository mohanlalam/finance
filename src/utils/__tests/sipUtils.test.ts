import { describe, it, expect, beforeEach } from 'vitest';
import { SIPAccount } from '../../types/portfolio';
import { getSIPInvestedAmount, getSIPEffectiveValue, isHdfcLifePolicy, getHdfcStrategyCAGR, getUsdInrRate } from '../sipUtils';

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

  describe('HDFC Life ULIP Policy Calculations', () => {
    const mockHdfcSIP: SIPAccount = {
      id: 'sip-hdfc',
      portfolio_id: 'p1',
      fund_name: 'HDFC Life International - Global Equity Index Funds Strategy',
      monthly_sip: 850, // USD
      expected_cagr: 8,
      units: 0,
      start_date: '2026-01-01',
      fallback_valuation: 0,
      mf_scheme_code: 'Global Equity Index Funds Strategy',
    };

    it('identifies HDFC Life policies correctly', () => {
      expect(isHdfcLifePolicy('Global Wealth Advantage Nova ACE')).toBe(true);
      expect(isHdfcLifePolicy('HDFC Life International - Global Multi Cap')).toBe(true);
      expect(isHdfcLifePolicy('Parag Parikh Flexi Cap')).toBe(false);
    });

    it('caps premium payments at 36 months for cost basis', () => {
      // 10 months elapsed
      const today = new Date();
      const past10 = new Date(today.getFullYear(), today.getMonth() - 9, 1);
      const start10Str = past10.toISOString().slice(0, 10);
      const hdfc10 = { ...mockHdfcSIP, start_date: start10Str, monthly_sip: 850 };
      
      const invested10 = getSIPInvestedAmount(hdfc10);
      expect(invested10).toBeCloseTo(850 * 10 * getUsdInrRate(), 1);

      // 40 months elapsed (should cap at 36 months)
      const past40 = new Date(today.getFullYear(), today.getMonth() - 39, 1);
      const start40Str = past40.toISOString().slice(0, 10);
      const hdfc40 = { ...mockHdfcSIP, start_date: start40Str, monthly_sip: 850 };
      const invested40 = getSIPInvestedAmount(hdfc40);
      expect(invested40).toBeCloseTo(850 * 36 * getUsdInrRate(), 1);
    });

    it('calculates effective value using units * live NAV * exchange rate if units > 0', () => {
      const hdfcWithUnits = { ...mockHdfcSIP, units: 100 };
      const val = getSIPEffectiveValue(hdfcWithUnits, 16.5);
      expect(val).toBeCloseTo(100 * 16.5 * getUsdInrRate(), 1);
    });

    it('compounds dynamically using actual returns if units are 0', () => {
      // 12 months elapsed
      const today = new Date();
      const past12 = new Date(today.getFullYear(), today.getMonth() - 11, 1);
      const start12Str = past12.toISOString().slice(0, 10);
      const hdfc12 = { ...mockHdfcSIP, start_date: start12Str, monthly_sip: 850 };
      
      const yearsElapsed = 12 / 12;
      const R = getHdfcStrategyCAGR('Global Equity Index Funds Strategy', yearsElapsed); // 12.65% (0.1265)
      
      const r = Math.pow(1 + R, 1/12) - 1;
      const expectedFVUSD = 850 * ((Math.pow(1 + r, 12) - 1) / r) * (1 + r);
      const expectedValuationINR = expectedFVUSD * getUsdInrRate();
      
      expect(getSIPEffectiveValue(hdfc12)).toBeCloseTo(expectedValuationINR, 1);
    });
  });
});
