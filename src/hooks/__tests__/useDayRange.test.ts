// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { computeDayPnLRange, useDayRange, formatPnLValue } from '../useDayRange';

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

describe('computeDayPnLRange', () => {
  it('computes baseline high and low correctly for positive today PnL', () => {
    // Today gain = +50,000 -> High = +50,000, Low = 0
    const result = computeDayPnLRange(50000);
    expect(result.dayHigh).toBe(50000);
    expect(result.dayLow).toBe(0);
  });

  it('computes baseline high and low correctly for negative today PnL', () => {
    // Today loss = -15,000 -> High = 0, Low = -15,000
    const result = computeDayPnLRange(-15000);
    expect(result.dayHigh).toBe(0);
    expect(result.dayLow).toBe(-15000);
  });

  it('incorporates stored high and low when provided', () => {
    // Stored had a recorded high of +60,000 and low of -10,000.
    // Current is +25,000.
    const stored = { high: 60000, low: -10000 };
    const result = computeDayPnLRange(25000, stored);
    expect(result.dayHigh).toBe(60000);
    expect(result.dayLow).toBe(-10000);
  });

  it('updates high if current PnL surpasses stored high', () => {
    const stored = { high: 60000, low: -10000 };
    const result = computeDayPnLRange(75000, stored);
    expect(result.dayHigh).toBe(75000);
    expect(result.dayLow).toBe(-10000);
  });

  it('updates low if current PnL drops below stored low', () => {
    const stored = { high: 60000, low: -10000 };
    const result = computeDayPnLRange(-20000, stored);
    expect(result.dayHigh).toBe(60000);
    expect(result.dayLow).toBe(-20000);
  });
});

describe('useDayRange hook', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('initializes and saves PnL range to localStorage', () => {
    const { result } = renderHook(() => useDayRange(43155, 'member-1'));
    expect(result.current.dayHigh).toBe(43155);
    expect(result.current.dayLow).toBe(0);

    const todayStr = new Date().toISOString().split('T')[0];
    const stored = JSON.parse(window.localStorage.getItem(`portfolio_day_pnl_range_member-1_${todayStr}`) || '{}');
    expect(stored.high).toBe(43155);
    expect(stored.low).toBe(0);
  });

  it('updates dynamically as today PnL updates', () => {
    const { result, rerender } = renderHook(
      ({ pnl }) => useDayRange(pnl, 'member-1'),
      { initialProps: { pnl: 43155 } }
    );

    expect(result.current.dayHigh).toBe(43155);

    // PnL rises to 65000
    act(() => {
      rerender({ pnl: 65000 });
    });
    expect(result.current.dayHigh).toBe(65000);
    expect(result.current.dayLow).toBe(0);

    // PnL drops to -5000
    act(() => {
      rerender({ pnl: -5000 });
    });
    expect(result.current.dayHigh).toBe(65000);
    expect(result.current.dayLow).toBe(-5000);
  });
});
