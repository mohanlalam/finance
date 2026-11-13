import { useState, useEffect, useMemo } from 'react';
import { formatFullINR, formatINR } from '../utils/formatters';
import { Holding } from '../types/portfolio';

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
 * Compute the portfolio Day High P&L and Day Low P&L from exchange-reported
 * per-stock intraday extremes (regularMarketDayHigh / regularMarketDayLow).
 *
 * If `prevClose` is missing from the quote, it derives it from `ltp` and `todayPnLPercent`.
 */
export function computeExchangeDayRange(
  holdings: Holding[],
  todayPnL: number
): { dayHigh: number; dayLow: number; hasExchangeData: boolean } {
  if (!holdings || holdings.length === 0) {
    return { dayHigh: todayPnL, dayLow: todayPnL, hasExchangeData: false };
  }

  let highPnL = 0;
  let lowPnL = 0;
  let hasExchangeData = false;

  for (let i = 0; i < holdings.length; i++) {
    const h = holdings[i];
    const qty = Number(h.qty) || 0;
    const ltp = Number(h.ltp) || 0;
    const todayPct = Number(h.todayPnLPercent) || 0;

    // Resolve previous close: use explicit prevClose or derive from ltp and todayPct
    const explicitPrevClose = Number(h.prevClose) || 0;
    const derivedPrevClose =
      ltp > 0 && todayPct !== 0 ? ltp / (1 + todayPct / 100) : ltp;
    const prevClose = explicitPrevClose > 0 ? explicitPrevClose : derivedPrevClose;

    const dh = Number(h.dayHigh) || 0;
    const dl = Number(h.dayLow) || 0;

    if (qty <= 0 || prevClose <= 0) continue;

    if (dh > 0) {
      hasExchangeData = true;
      highPnL += (dh - prevClose) * qty;
      lowPnL += (dl > 0 ? dl - prevClose : ltp - prevClose) * qty;
    } else if (ltp > 0) {
      // Stock has no exchange day range — use current P&L contribution
      const currentDelta = (ltp - prevClose) * qty;
      highPnL += currentDelta;
      lowPnL += currentDelta;
    }
  }

  if (!hasExchangeData) {
    return { dayHigh: todayPnL, dayLow: todayPnL, hasExchangeData: false };
  }

  return {
    dayHigh: Math.round(highPnL),
    dayLow: Math.round(lowPnL),
    hasExchangeData: true,
  };
}

/**
 * Custom hook computing today's Day High P&L.
 *
 * Primary: Official NSE/BSE exchange-reported Day High from Yahoo Finance.
 * Resilient fallback: Intraday session tracking via localStorage ensuring that
 * Day High never drops below the day's baseline (0) or earlier recorded peaks,
 * even on devices where the cloud market-data edge function is pending deployment.
 */
export function useDayRange(
  todayPnL: number,
  holdings?: Holding[] | unknown,
  _portfolioId?: string | null
): DayRange {
  const hList = useMemo(() => {
    return Array.isArray(holdings) ? (holdings as Holding[]) : [];
  }, [holdings]);

  // Compute exchange-level day range from holdings
  const exchangeResult = useMemo(() => {
    return computeExchangeDayRange(hList, todayPnL);
  }, [hList, todayPnL]);

  // Session-recorded high stored in localStorage to protect against missing exchange data
  const [sessionHigh, setSessionHigh] = useState<number>(() => {
    if (typeof todayPnL !== 'number' || isNaN(todayPnL)) return 0;
    const todayStr = new Date().toISOString().split('T')[0];
    const key = `portfolio_day_high_v3_${todayStr}`;
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const saved = window.localStorage.getItem(key);
        if (saved !== null) {
          const parsed = Number(saved);
          if (!isNaN(parsed)) return Math.max(parsed, todayPnL);
        }
      }
    } catch {
      // ignore
    }
    // Baseline at start of trading day is 0 (prior close).
    // If today's current P&L is positive, start at current P&L; otherwise 0.
    return Math.max(0, todayPnL);
  });

  useEffect(() => {
    if (typeof todayPnL !== 'number' || isNaN(todayPnL)) return;
    const todayStr = new Date().toISOString().split('T')[0];
    const key = `portfolio_day_high_v3_${todayStr}`;

    setSessionHigh((prev) => {
      // Day High is the maximum of:
      // 1. Prior recorded session high
      // 2. Current todayPnL
      // 3. 0 (baseline at market open from yesterday's close)
      const nextHigh = Math.max(prev, todayPnL, 0);
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.setItem(key, String(nextHigh));
        }
      } catch {
        // ignore
      }
      return nextHigh;
    });
  }, [todayPnL]);

  return useMemo(() => {
    if (exchangeResult.hasExchangeData) {
      // When exchange data is available, Day High is the maximum of
      // the official exchange extremes and any observed session peak
      return {
        dayHigh: Math.max(exchangeResult.dayHigh, sessionHigh),
        dayLow: exchangeResult.dayLow,
      };
    }

    // When exchange data is unavailable (e.g. cloud function not deployed),
    // Day High falls back to the session-recorded peak (always >= 0)
    return {
      dayHigh: Math.max(sessionHigh, todayPnL, 0),
      dayLow: todayPnL,
    };
  }, [exchangeResult, sessionHigh, todayPnL]);
}
