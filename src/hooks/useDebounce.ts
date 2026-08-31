import { useState, useEffect } from 'react';

/**
 * Hook to debounce a fast-changing state value (e.g. search inputs, filter queries).
 * @param value The value to debounce
 * @param delayMs Delay in milliseconds (defaults to 200ms)
 */
export function useDebounce<T>(value: T, delayMs: number = 200): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delayMs);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delayMs]);

  return debouncedValue;
}
