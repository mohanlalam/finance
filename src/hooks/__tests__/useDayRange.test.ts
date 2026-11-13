// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import {
  computeExchangeDayRange,
  useDayRange,
  formatPnLValue,
} from '../useDayRange';
import { Holding } from '../../types/portfolio';

// Helper to create a minimal holding stub with exchange data
function makeHolding(overrides: Partial<Holding>): Holding {
  return {
    id: 'test',
    sno: 1,
    stockName: 'Test',
    ticker: 'TEST',
    yahooSymbol: 'TEST.NS',
    qty: 10,
    avgPrice: 100,
    ltp: 110,
    amountInvested: 1000,
    unrealizedPnL: 100,
    pnlPercent: 10,
    todayPnLPercent: 1,
    currentValue: 1100,
    dayHigh: null,
    dayLow: null,
    prevClose: null,
    ...overrides,
  };
}

describe('formatPnLValue', () => {
  it('formats positive PnL with plus sign and full INR format', () => {
    expect(formatPnLValue(43155)).toBe('+₹43,155');
  });

  it('formats negative PnL with minus sign', () => {
    expect(formatPnLValue(-5000)).toBe('-₹5,000');
  });

  it('formats zero PnL as ₹0', () => {
    expect(formatPnLValue(0)).toBe('₹0');
  });

  it('formats large values with Cr suffix', () => {
    expect(formatPnLValue(12500000)).toBe('+₹1.25Cr');
    expect(formatPnLValue(-12500000)).toBe('-₹1.25Cr');
  });
});

describe('computeExchangeDayRange', () => {
  it('falls back to todayPnL when no holdings', () => {
    const result = computeExchangeDayRange([], 42224);
    expect(result.dayHigh).toBe(42224);
    expect(result.dayLow).toBe(42224);
    expect(result.hasExchangeData).toBe(false);
  });

  it('computes high/low from exchange data for a single holding', () => {
    const holdings = [
      makeHolding({ qty: 100, prevClose: 500, dayHigh: 520, dayLow: 490, ltp: 510 }),
    ];
    // High = (520 - 500) * 100 = 2000
    // Low  = (490 - 500) * 100 = -1000
    const result = computeExchangeDayRange(holdings, 1000);
    expect(result.dayHigh).toBe(2000);
    expect(result.dayLow).toBe(-1000);
    expect(result.hasExchangeData).toBe(true);
  });

  it('derives prevClose when explicit prevClose is missing', () => {
    // ltp: 110, todayPnLPercent: 10% -> prevClose = 110 / 1.1 = 100
    // dayHigh: 115 -> (115 - 100) * 10 = 150
    const holdings = [
      makeHolding({ qty: 10, ltp: 110, todayPnLPercent: 10, prevClose: null, dayHigh: 115, dayLow: 105 }),
    ];
    const result = computeExchangeDayRange(holdings, 100);
    expect(result.dayHigh).toBe(150);
    expect(result.dayLow).toBe(50);
    expect(result.hasExchangeData).toBe(true);
  });

  it('sums across multiple holdings', () => {
    const holdings = [
      makeHolding({ id: 'a', qty: 50, prevClose: 1000, dayHigh: 1050, dayLow: 980, ltp: 1020 }),
      makeHolding({ id: 'b', qty: 30, prevClose: 200, dayHigh: 210, dayLow: 195, ltp: 205 }),
    ];
    const result = computeExchangeDayRange(holdings, 1000);
    expect(result.dayHigh).toBe(2800);
    expect(result.dayLow).toBe(-1150);
    expect(result.hasExchangeData).toBe(true);
  });

  it('falls back to current PnL for holdings without exchange data', () => {
    const holdings = [
      makeHolding({ qty: 100, prevClose: 500, dayHigh: null, dayLow: null, ltp: 510 }),
    ];
    const result = computeExchangeDayRange(holdings, 1000);
    expect(result.dayHigh).toBe(1000);
    expect(result.dayLow).toBe(1000);
    expect(result.hasExchangeData).toBe(false);
  });
});

describe('useDayRange hook', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('returns exchange-computed day range from holdings', () => {
    const holdings = [
      makeHolding({ qty: 100, prevClose: 500, dayHigh: 520, dayLow: 490, ltp: 510 }),
    ];
    const { result } = renderHook(() => useDayRange(1000, holdings, 'all'));
    expect(result.current.dayHigh).toBe(2000);
    expect(result.current.dayLow).toBe(-1000);
  });

  it('never shows a negative loss as Day High when exchange data is missing', () => {
    // When portfolio is down -13244 and no exchange quotes are returned:
    // Day High should be at least 0 (market open baseline)
    const { result } = renderHook(() => useDayRange(-13244, [], 'all'));
    expect(result.current.dayHigh).toBe(0);
  });

  it('tracks session peaks when exchange data is missing', () => {
    const { result, rerender } = renderHook(
      ({ pnl }) => useDayRange(pnl, [], 'all'),
      { initialProps: { pnl: 25000 } }
    );
    expect(result.current.dayHigh).toBe(25000);

    // Later in the day, market drops to -13244
    act(() => {
      rerender({ pnl: -13244 });
    });
    // Day High stays at 25000, does not collapse to -13244!
    expect(result.current.dayHigh).toBe(25000);
  });

  it('handles non-array holdings gracefully', () => {
    const { result } = renderHook(() => useDayRange(42224, undefined, null));
    expect(result.current.dayHigh).toBe(42224);
  });
});
