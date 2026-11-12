import { useState, useEffect } from 'react';

export interface DayRange {
  dayHigh: number;
  dayLow: number;
}

/**
 * Computes Day High and Day Low considering the day's baseline (previous close vs current valuation)
 * and any previously recorded highs/lows for today.
 */
export function computeDayRange(
  currentValue: number,
  todayPnL: number,
  storedRange?: { high: number; low: number } | null
): DayRange {
  if (!currentValue || currentValue <= 0) {
    return { dayHigh: 0, dayLow: 0 };
  }

  const prevClose = currentValue - todayPnL;
  const validPrev = prevClose > 0 ? prevClose : currentValue;
  const baseHigh = Math.max(validPrev, currentValue);
  const baseLow = Math.min(validPrev, currentValue);

  if (storedRange && typeof storedRange.high === 'number' && typeof storedRange.low === 'number') {
    return {
      dayHigh: Math.max(storedRange.high, baseHigh, currentValue),
      dayLow: Math.min(storedRange.low, baseLow, currentValue),
    };
  }

  return {
    dayHigh: baseHigh,
    dayLow: baseLow,
  };
}

/**
 * Custom hook tracking and persisting today's high and low recorded valuation.
 * - Computes baseline range from today's movement (previous close vs current value).
 * - Tracks intraday price extremes recorded during the session in localStorage.
 * - Automatically rolls over each day based on date string.
 */
export function useDayRange(
  currentValue: number,
  todayPnL: number,
  portfolioId?: string | null
): DayRange {
  const [range, setRange] = useState<DayRange>(() => {
    return computeDayRange(currentValue, todayPnL);
  });

  useEffect(() => {
    if (!currentValue || currentValue <= 0) return;

    const todayStr = new Date().toISOString().split('T')[0];
    const storageKey = `portfolio_day_range_${portfolioId || 'all'}_${todayStr}`;

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

    const next = computeDayRange(currentValue, todayPnL, storedRange);
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
  }, [currentValue, todayPnL, portfolioId]);

  return range;
}
