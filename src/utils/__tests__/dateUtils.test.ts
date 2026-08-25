import { describe, it, expect } from 'vitest';
import {
  parseLocalDate,
  formatLocalDate,
  isLeap,
  getDaysInMonth,
  toLocalDateString,
  calculateDateDuration,
  formatDateDuration,
} from '../dateUtils';

describe('dateUtils', () => {
  it('correctly identifies leap years', () => {
    expect(isLeap(2024)).toBe(true);
    expect(isLeap(2020)).toBe(true);
    expect(isLeap(2000)).toBe(true);
    expect(isLeap(2023)).toBe(false);
    expect(isLeap(1900)).toBe(false);
  });

  it('computes correct days in month including leap Februaries', () => {
    expect(getDaysInMonth(2024, 1)).toBe(29); // Feb in leap year
    expect(getDaysInMonth(2023, 1)).toBe(28); // Feb in non-leap year
    expect(getDaysInMonth(2024, 0)).toBe(31); // Jan
    expect(getDaysInMonth(2024, 3)).toBe(30); // Apr
  });

  it('parses YYYY-MM-DD strings without timezone shifts', () => {
    const ts = parseLocalDate('2026-08-23');
    const date = new Date(ts);
    expect(date.getFullYear()).toBe(2026);
    expect(date.getMonth()).toBe(7); // August is index 7
    expect(date.getDate()).toBe(23);
  });

  it('handles invalid or null dates defensively', () => {
    expect(isNaN(parseLocalDate(null))).toBe(true);
    expect(isNaN(parseLocalDate(undefined))).toBe(true);
    expect(isNaN(parseLocalDate('invalid-date'))).toBe(true);
  });

  it('formats local dates consistently', () => {
    expect(formatLocalDate(2026, 7, 23)).toBe('2026-08-23');
    expect(toLocalDateString(new Date(2026, 7, 23))).toBe('2026-08-23');
  });

  describe('calculateDateDuration & formatDateDuration', () => {
    it('calculates 1 year tenure correctly', () => {
      expect(formatDateDuration('2026-02-01', '2027-02-01')).toBe('1 Year');
    });

    it('calculates 2 years tenure correctly', () => {
      expect(formatDateDuration('2025-01-01', '2027-01-01')).toBe('2 Years');
    });

    it('calculates 1 month duration correctly', () => {
      expect(formatDateDuration('2026-02-01', '2026-03-01')).toBe('1 Month');
    });

    it('calculates multiple months duration correctly', () => {
      expect(formatDateDuration('2026-02-01', '2026-08-01')).toBe('6 Months');
    });

    it('calculates years and months combined duration', () => {
      expect(formatDateDuration('2025-02-01', '2026-08-01')).toBe('1 Year 6 Months');
    });

    it('calculates days duration when under a month', () => {
      expect(formatDateDuration('2026-02-01', '2026-02-15')).toBe('14 Days');
      expect(formatDateDuration('2026-02-01', '2026-02-02')).toBe('1 Day');
    });

    it('calculates months and days combined duration', () => {
      expect(formatDateDuration('2026-02-01', '2026-03-15')).toBe('1 Month 14 Days');
    });

    it('returns empty string for invalid start date', () => {
      expect(formatDateDuration('', '2026-08-01')).toBe('');
      expect(formatDateDuration(null, '2026-08-01')).toBe('');
    });

    it('calculates duration up to today when end date is omitted', () => {
      const res = calculateDateDuration('2020-01-01');
      expect(res).not.toBeNull();
      expect(res!.years).toBeGreaterThan(0);
    });
  });
});
