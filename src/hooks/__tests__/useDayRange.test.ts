// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { computeDayRange, useDayRange } from '../useDayRange';

describe('computeDayRange', () => {
  it('returns zeros when currentValue is 0 or negative', () => {
    expect(computeDayRange(0, 0)).toEqual({ dayHigh: 0, dayLow: 0 });
    expect(computeDayRange(-100, 10)).toEqual({ dayHigh: 0, dayLow: 0 });
  });

  it('computes baseline high and low correctly for positive today PnL', () => {
    // Current value = 1000, today gain = 100 -> previous close was 900
    // So high = 1000, low = 900
    const result = computeDayRange(1000, 100);
    expect(result.dayHigh).toBe(1000);
    expect(result.dayLow).toBe(900);
  });

  it('computes baseline high and low correctly for negative today PnL', () => {
    // Current value = 900, today loss = -100 -> previous close was 1000
    // So high = 1000, low = 900
    const result = computeDayRange(900, -100);
    expect(result.dayHigh).toBe(1000);
    expect(result.dayLow).toBe(900);
  });

  it('incorporates stored high and low when provided', () => {
    // Current = 950, todayPnL = 50 (prev = 900).
    // Stored had a higher recorded high of 1050 and lower low of 880
    const stored = { high: 1050, low: 880 };
    const result = computeDayRange(950, 50, stored);
    expect(result.dayHigh).toBe(1050);
    expect(result.dayLow).toBe(880);
  });

  it('updates high if current value surpasses stored high', () => {
    const stored = { high: 1050, low: 880 };
    const result = computeDayRange(1100, 200, stored);
    expect(result.dayHigh).toBe(1100);
    expect(result.dayLow).toBe(880);
  });
});

describe('useDayRange hook', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('initializes and saves to localStorage', () => {
    const { result } = renderHook(() => useDayRange(5000000, 50000, 'member-1'));
    expect(result.current.dayHigh).toBe(5000000);
    expect(result.current.dayLow).toBe(4950000);

    const todayStr = new Date().toISOString().split('T')[0];
    const stored = JSON.parse(window.localStorage.getItem(`portfolio_day_range_member-1_${todayStr}`) || '{}');
    expect(stored.high).toBe(5000000);
    expect(stored.low).toBe(4950000);
  });

  it('updates when currentValue increases dynamically', () => {
    const val = 5000000;
    const pnl = 50000;
    const { result, rerender } = renderHook(
      ({ value, change }) => useDayRange(value, change, 'member-1'),
      { initialProps: { value: val, change: pnl } }
    );

    expect(result.current.dayHigh).toBe(5000000);

    // Value jumps to 5200000
    act(() => {
      rerender({ value: 5200000, change: 250000 });
    });
    expect(result.current.dayHigh).toBe(5200000);
    expect(result.current.dayLow).toBe(4950000);
  });
});
