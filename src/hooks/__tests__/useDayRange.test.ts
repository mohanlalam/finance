// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
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
  });

  it('sums across multiple holdings', () => {
    const holdings = [
      makeHolding({ id: 'a', qty: 50, prevClose: 1000, dayHigh: 1050, dayLow: 980, ltp: 1020 }),
      makeHolding({ id: 'b', qty: 30, prevClose: 200, dayHigh: 210, dayLow: 195, ltp: 205 }),
    ];
    // Stock A: High = (1050-1000)*50 = 2500, Low = (980-1000)*50 = -1000
    // Stock B: High = (210-200)*30 = 300,   Low = (195-200)*30 = -150
    // Total: High = 2800, Low = -1150
    const result = computeExchangeDayRange(holdings, 1000);
    expect(result.dayHigh).toBe(2800);
    expect(result.dayLow).toBe(-1150);
  });

  it('falls back to current PnL for holdings without exchange data', () => {
    const holdings = [
      makeHolding({ qty: 100, prevClose: 500, dayHigh: null, dayLow: null, ltp: 510 }),
    ];
    // No exchange data, so uses current delta: (510 - 500) * 100 = 1000
    const result = computeExchangeDayRange(holdings, 1000);
    expect(result.dayHigh).toBe(1000);
    expect(result.dayLow).toBe(1000);
  });

  it('mixes holdings with and without exchange data', () => {
    const holdings = [
      makeHolding({ id: 'a', qty: 100, prevClose: 500, dayHigh: 520, dayLow: 490, ltp: 510 }),
      makeHolding({ id: 'b', qty: 50, prevClose: 300, dayHigh: null, dayLow: null, ltp: 310 }),
    ];
    // Stock A: High = (520-500)*100 = 2000, Low = (490-500)*100 = -1000
    // Stock B (no exchange): current delta = (310-300)*50 = 500
    // Total: High = 2500, Low = -500
    const result = computeExchangeDayRange(holdings, 1500);
    expect(result.dayHigh).toBe(2500);
    expect(result.dayLow).toBe(-500);
  });
});

describe('useDayRange hook', () => {
  it('returns exchange-computed day range from holdings', () => {
    const holdings = [
      makeHolding({ qty: 100, prevClose: 500, dayHigh: 520, dayLow: 490, ltp: 510 }),
    ];
    const { result } = renderHook(() => useDayRange(1000, holdings, 'all'));
    expect(result.current.dayHigh).toBe(2000);
    expect(result.current.dayLow).toBe(-1000);
  });

  it('falls back gracefully when holdings is empty array', () => {
    const { result } = renderHook(() => useDayRange(42224, [], 'all'));
    expect(result.current.dayHigh).toBe(42224);
    expect(result.current.dayLow).toBe(42224);
  });

  it('handles non-array holdings gracefully', () => {
    const { result } = renderHook(() => useDayRange(42224, undefined, null));
    expect(result.current.dayHigh).toBe(42224);
    expect(result.current.dayLow).toBe(42224);
  });
});
