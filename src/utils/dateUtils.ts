/**
 * Shared date parsing, formatting, and calendar utility helpers.
 * Handles local date boundaries without UTC timezone shifts.
 */

const DAYS_IN_MONTH_ARRAY = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

export function isLeap(y: number): boolean {
  return (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
}

export function getDaysInMonth(y: number, m: number): number {
  return m === 1 && isLeap(y) ? 29 : (DAYS_IN_MONTH_ARRAY[m] ?? 30);
}

/**
 * Robust date parser returning local timestamp or NaN.
 * Prevents UTC midnight shifts on YYYY-MM-DD ISO strings.
 */
export function parseLocalDate(dateStr: string | undefined | null): number {
  if (!dateStr) return NaN;
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(dateStr);
  if (match) {
    const y = parseInt(match[1], 10);
    const m = parseInt(match[2], 10) - 1;
    const d = parseInt(match[3], 10);
    return new Date(y, m, d).getTime();
  }
  const t = new Date(dateStr).getTime();
  return isNaN(t) ? NaN : t;
}

/**
 * Format local year, month, day to YYYY-MM-DD without UTC timezone shifts.
 */
export function formatLocalDate(year: number, month: number, day: number): string {
  const y = String(year).padStart(4, '0');
  const m = String(month + 1).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Format a Date object or timestamp to local YYYY-MM-DD string.
 */
export function toLocalDateString(date: Date = new Date()): string {
  return formatLocalDate(date.getFullYear(), date.getMonth(), date.getDate());
}
