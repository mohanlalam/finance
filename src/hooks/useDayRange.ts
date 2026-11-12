import { useMemo } from 'react';
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
 * Day High P&L = Σ (holding.dayHigh − holding.prevClose) × holding.qty
 * Day Low P&L  = Σ (holding.dayLow  − holding.prevClose) × holding.qty
 *
 * Falls back to the current todayPnL when exchange data is unavailable.
 */
export function computeExchangeDayRange(
  holdings: Holding[],
  todayPnL: number
): DayRange {
  if (!holdings || holdings.length === 0) {
    return { dayHigh: todayPnL, dayLow: todayPnL };
  }

  let highPnL = 0;
  let lowPnL = 0;
  let hasExchangeData = false;

  for (let i = 0; i < holdings.length; i++) {
    const h = holdings[i];
    const qty = Number(h.qty) || 0;
    const prevClose = Number(h.prevClose) || 0;
    const dh = Number(h.dayHigh) || 0;
    const dl = Number(h.dayLow) || 0;

    if (qty <= 0 || prevClose <= 0) continue;

    if (dh > 0 && dl > 0) {
      hasExchangeData = true;
      highPnL += (dh - prevClose) * qty;
      lowPnL += (dl - prevClose) * qty;
    } else {
      // Stock has no exchange day range — use its current PnL contribution
      const ltp = Number(h.ltp) || 0;
      if (ltp > 0) {
        const currentDelta = (ltp - prevClose) * qty;
        highPnL += currentDelta;
        lowPnL += currentDelta;
      }
    }
  }

  if (!hasExchangeData) {
    return { dayHigh: todayPnL, dayLow: todayPnL };
  }

  return {
    dayHigh: Math.round(highPnL),
    dayLow: Math.round(lowPnL),
  };
}

/**
 * Custom hook computing today's Day High and Day Low P&L from
 * exchange-reported per-stock intraday extremes (NSE/BSE via Yahoo Finance).
 *
 * Unlike session tracking, this works even when the app wasn't open during
 * market hours — the exchange always records each stock's true intraday
 * high and low price.
 */
export function useDayRange(
  todayPnL: number,
  holdings?: Holding[] | unknown,
  _portfolioId?: string | null
): DayRange {
  return useMemo(() => {
    const h = Array.isArray(holdings) ? holdings as Holding[] : [];
    return computeExchangeDayRange(h, todayPnL);
  }, [holdings, todayPnL]);
}
