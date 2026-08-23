import { describe, it, expect } from 'vitest';
import { parseLocalDate, formatLocalDate, isLeap, getDaysInMonth, toLocalDateString } from '../dateUtils';

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
});
