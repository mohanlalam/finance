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
 * Safely parse date strings into local Date objects avoiding UTC midnight timezone shifts.
 */
export function parseLocalDateObj(dateStr: string | undefined | null): Date | null {
  const ts = parseLocalDate(dateStr);
  return isNaN(ts) ? null : new Date(ts);
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

export interface DateDurationResult {
  years: number;
  months: number;
  days: number;
  totalDays: number;
  formatted: string;
}

/**
 * Calculates calendar duration (years, months, days) between two dates.
 * If endDateStr is not provided, calculates duration up to today.
 */
export function calculateDateDuration(
  startDateStr: string | undefined | null,
  endDateStr?: string | undefined | null
): DateDurationResult | null {
  if (!startDateStr) return null;
  const start = parseLocalDateObj(startDateStr);
  if (!start) return null;

  const end = endDateStr ? parseLocalDateObj(endDateStr) : parseLocalDateObj(toLocalDateString());
  if (!end) return null;

  let fromDate = start;
  let toDate = end;
  if (toDate.getTime() < fromDate.getTime()) {
    fromDate = end;
    toDate = start;
  }

  const totalDays = Math.max(0, Math.round((toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24)));

  let years = toDate.getFullYear() - fromDate.getFullYear();
  let months = toDate.getMonth() - fromDate.getMonth();
  let days = toDate.getDate() - fromDate.getDate();

  if (days < 0) {
    months -= 1;
    const prevMonth = (toDate.getMonth() - 1 + 12) % 12;
    const prevYear = prevMonth === 11 ? toDate.getFullYear() - 1 : toDate.getFullYear();
    const prevMonthDays = getDaysInMonth(prevYear, prevMonth);
    days += prevMonthDays;
  }
  if (months < 0) {
    years -= 1;
    months += 12;
  }

  const parts: string[] = [];
  if (years > 0) {
    parts.push(`${years} ${years === 1 ? 'Year' : 'Years'}`);
  }
  if (months > 0) {
    parts.push(`${months} ${months === 1 ? 'Month' : 'Months'}`);
  }
  if (days > 0) {
    parts.push(`${days} ${days === 1 ? 'Day' : 'Days'}`);
  }

  const formatted = parts.length > 0 ? parts.join(' ') : '0 Days';

  return {
    years,
    months,
    days,
    totalDays,
    formatted,
  };
}

/**
 * Convenience helper returning human-friendly duration text (e.g. "1 Year", "1 Month", "6 Months 24 Days").
 */
export function formatDateDuration(
  startDateStr: string | undefined | null,
  endDateStr?: string | undefined | null
): string {
  const result = calculateDateDuration(startDateStr, endDateStr);
  return result?.formatted || '';
}

/**
 * Format relative time elapsed (e.g. "just now", "2m ago", "1h ago").
 */
export function formatRelativeTime(date: Date | null | undefined): string {
  if (!date) return 'never';
  const elapsedSec = Math.floor((Date.now() - date.getTime()) / 1000);
  if (elapsedSec < 30) return 'just now';
  if (elapsedSec < 60) return `${elapsedSec}s ago`;
  const elapsedMin = Math.floor(elapsedSec / 60);
  if (elapsedMin < 60) return `${elapsedMin}m ago`;
  const elapsedHr = Math.floor(elapsedMin / 60);
  if (elapsedHr < 24) return `${elapsedHr}h ago`;
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

