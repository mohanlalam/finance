// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDebounce } from '../useDebounce';

describe('useDebounce', () => {
  it('returns initial value immediately and debounces updates', () => {
    vi.useFakeTimers();

    const { result, rerender } = renderHook(({ val, delay }) => useDebounce(val, delay), {
      initialProps: { val: 'initial', delay: 200 },
    });

    expect(result.current).toBe('initial');

    // Update prop
    rerender({ val: 'updated', delay: 200 });

    // Not updated before timer
    expect(result.current).toBe('initial');

    act(() => {
      vi.advanceTimersByTime(199);
    });
    expect(result.current).toBe('initial');

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(result.current).toBe('updated');

    vi.useRealTimers();
  });
});
