// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAutoLock } from '../useAutoLock';

describe('useAutoLock Hook', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('triggers onLock callback after timeout', () => {
    const onLock = vi.fn();
    renderHook(() => useAutoLock(onLock, 5000));

    expect(onLock).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(onLock).toHaveBeenCalledTimes(1);
  });

  it('resets timer on user interaction (wheel, mousemove, keydown)', () => {
    const onLock = vi.fn();
    renderHook(() => useAutoLock(onLock, 5000));

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    // Simulate mouse move
    act(() => {
      window.dispatchEvent(new Event('mousemove'));
    });

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(onLock).not.toHaveBeenCalled();

    // Simulate mouse wheel
    act(() => {
      window.dispatchEvent(new Event('wheel'));
    });

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(onLock).not.toHaveBeenCalled();

    // Advance past remaining 5000ms
    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(onLock).toHaveBeenCalledTimes(1);
  });

  it('cleans up timers and event listeners on unmount', () => {
    const onLock = vi.fn();
    const { unmount } = renderHook(() => useAutoLock(onLock, 5000));

    unmount();

    act(() => {
      vi.advanceTimersByTime(10000);
    });

    expect(onLock).not.toHaveBeenCalled();
  });
});
