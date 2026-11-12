import { useState, useEffect } from 'react';
import { formatFullINR, formatINR } from '../utils/formatters';

export interface DayRange {
  dayHigh: number;
  dayLow: number;
}

/**
 * Formats a P&L amount with appropriate currency symbols and +/- indicators.
 */
export function formatPnLValue(val: number): string {
  if (Math.abs(val) >= 10000000) {
    const formatted = formatINR(val);
    return val > 0 ? `+${formatted}` : formatted;
  }
  const formatted = formatFullINR(val, 0);
  return val > 0 ? `+${formatted}` : formatted;
}

/**
 * Computes Day High and Day Low for today's P&L movement, considering baseline (0 vs current todayPnL)
 * and any previously recorded intraday extremes today.
 */
export function computeDayPnLRange(
  todayPnL: number,
  storedRange?: { high: number; low: number } | null
): DayRange {
  if (typeof todayPnL !== 'number' || isNaN(todayPnL)) {
    return { dayHigh: 0, dayLow: 0 };
  }

  // Baseline for today: the day starts with 0 P&L.
  const baseHigh = Math.max(0, todayPnL);
  const baseLow = Math.min(0, todayPnL);

  if (storedRange && typeof storedRange.high === 'number' && typeof storedRange.low === 'number') {
    return {
      dayHigh: Math.max(storedRange.high, baseHigh, todayPnL),
      dayLow: Math.min(storedRange.low, baseLow, todayPnL),
    };
  }

  return {
    dayHigh: baseHigh,
    dayLow: baseLow,
  };
}

/**
 * Custom hook tracking and persisting today's high and low recorded Profit/Loss (P&L).
 * - Tracks intraday P&L extremes recorded during the session in localStorage.
 * - Automatically rolls over each day based on date string.
 */
export function useDayRange(
  todayPnL: number,
  portfolioId?: string | null
): DayRange {
  const [range, setRange] = useState<DayRange>(() => {
    return computeDayPnLRange(todayPnL);
  });

  useEffect(() => {
    if (typeof todayPnL !== 'number' || isNaN(todayPnL)) return;

    const todayStr = new Date().toISOString().split('T')[0];
    const storageKey = `portfolio_day_pnl_range_${portfolioId || 'all'}_${todayStr}`;

    let storedRange: { high: number; low: number } | null = null;
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const item = window.localStorage.getItem(storageKey);
        if (item) {
          storedRange = JSON.parse(item);
        }
      }
    } catch {
      // localStorage may fail in test or private browsing environments
    }

    const next = computeDayPnLRange(todayPnL, storedRange);
    setRange(next);

    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(
          storageKey,
          JSON.stringify({ high: next.dayHigh, low: next.dayLow })
        );
      }
    } catch {
      // Ignore quota/security errors
    }
  }, [todayPnL, portfolioId]);

  return range;
}
