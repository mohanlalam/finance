import { describe, it, expect } from 'vitest';
import { SSYAccount } from '../../types/portfolio';
import {
  getSSYRateForFY,
  getFYStartYear,
  calculateSSYMaturityWithRates,
  getSSYEffectiveValue,
  getSSYInvestedAmount,
  SSY_MAX_FY_DEPOSIT,
} from '../ssyUtils';

describe('SSY Utilities', () => {
  describe('getFYStartYear', () => {
    it('returns the correct financial year start year', () => {
      // April 1st, 2026 is in FY 2026-27
      expect(getFYStartYear(new Date(Date.UTC(2026, 3, 1)))).toBe(2026);
      // March 31st, 2026 is in FY 2025-26
      expect(getFYStartYear(new Date(Date.UTC(2026, 2, 31)))).toBe(2025);
    });

    it('handles local dates and midnights on April 1st without timezone shift', () => {
      const localDate = new Date(2026, 3, 1); // April 1st in local time (month index 3)
      expect(getFYStartYear(localDate)).toBe(2026);

      const localMarch31 = new Date(2026, 2, 31); // March 31st in local time (month index 2)
      expect(getFYStartYear(localMarch31)).toBe(2025);
    });
  });

  describe('getSSYRateForFY', () => {
    it('uses historical rates if available', () => {
      expect(getSSYRateForFY(2024)).toBe(8.2);
      expect(getSSYRateForFY(2020)).toBe(7.6);
    });

    it('uses overrides when provided', () => {
      const overrides = [{ fyStartYear: 2026, rate: 8.5 }];
      expect(getSSYRateForFY(2026, overrides)).toBe(8.5);
    });

    it('uses latest available historical rate as fallback for future years', () => {
      expect(getSSYRateForFY(2035)).toBe(8.2); // latest defined is 2025 (8.2)
    });
  });

  describe('calculateSSYMaturityWithRates', () => {
    it('calculates SSY compounding correctly with annual contributions', () => {
      const start = '2026-04-01';
      const annualDeposit = 100000;
      const result = calculateSSYMaturityWithRates(start, annualDeposit);
      
      expect(result.maturityAmount).toBeGreaterThan(3000000);
      expect(result.yearlyBreakdown.length).toBe(21);
      // First year deposit: 100000, interest at 8.2% = 8200, closing balance = 108200
      expect(result.yearlyBreakdown[0].closingBalance).toBe(108200);
    });

    it('caps annual deposits at SSY_MAX_FY_DEPOSIT', () => {
      const start = '2026-04-01';
      const annualDeposit = 200000; // Over the 1.5L cap
      const result = calculateSSYMaturityWithRates(start, annualDeposit);

      expect(result.yearlyBreakdown[0].deposit).toBe(SSY_MAX_FY_DEPOSIT);
      expect(result.yearlyBreakdown[0].depositCapped).toBe(true);
    });
  });

  describe('getSSYInvestedAmount', () => {
    it('sums contributions up to FY cap', () => {
      const account: SSYAccount = {
        id: 'ssy-1',
        portfolio_id: 'p1',
        bank_name: 'SBI',
        girl_dob: '2020-01-01',
        annual_deposit: 100000,
        interest_rate: 8.2,
        start_date: '2026-04-01',
        maturity_date: '2047-04-01',
        maturity_amount: 0,
        status: 'active',
        contributions: [
          { date: '2026-05-01', amount: 100000 },
          { date: '2026-09-01', amount: 100000 }, // Total FY 2026: 200k, should cap at 150k
          { date: '2027-05-01', amount: 50000 },  // FY 2027: 50k
        ],
        rate_schedule: [],
      };

      const invested = getSSYInvestedAmount(account);
      expect(invested).toBe(200000); // 150k capped for FY 2026 + 50k for FY 2027
    });
  });

  describe('getSSYEffectiveValue', () => {
    it('calculates the correct accrued valuation of the SSY account over time', () => {
      const account: SSYAccount = {
        id: 'ssy-1',
        portfolio_id: 'p1',
        bank_name: 'SBI',
        girl_dob: '2020-01-01',
        annual_deposit: 100000,
        interest_rate: 8.2,
        start_date: '2026-04-01',
        maturity_date: '2047-04-01',
        maturity_amount: 0,
        status: 'active',
        contributions: [
          { date: '2026-04-01', amount: 100000 },
        ],
        rate_schedule: [],
      };

      // Compounded up to 2028-03-31 (end of FY 2027)
      // FY 2026: 100,000 * 1.082 = 108,200
      // FY 2027: 108,200 * 1.082 = 117,072.4
      const val = getSSYEffectiveValue(account, new Date('2028-03-31'));
      expect(Math.round(val)).toBeCloseTo(117072, 0);
    });
  });
});
