import { useState, useEffect, useRef } from 'react';

export function useAnimatedCounter(
  targetValue: number,
  duration: number = 500,
  formatter?: (val: number) => string
): string | number {
  const [currentValue, setCurrentValue] = useState(targetValue);
  const requestRef = useRef<number>();
  const startTimeRef = useRef<number>();
  const previousValueRef = useRef(targetValue);

  // Read value once to avoid SSR hydration mismatch or errors
  const prefersReducedMotion = useRef(
    typeof window !== 'undefined' ? window.matchMedia('(prefers-reduced-motion: reduce)').matches : false
  );

  useEffect(() => {
    if (typeof targetValue !== 'number' || isNaN(targetValue)) {
      setCurrentValue(0);
      previousValueRef.current = 0;
      return;
    }

    if (targetValue === previousValueRef.current) {
      return;
    }

    if (prefersReducedMotion.current) {
      setCurrentValue(targetValue);
      previousValueRef.current = targetValue;
      return;
    }

    const startValue = previousValueRef.current;
    
    const animate = (time: number) => {
      if (startTimeRef.current === undefined) {
        startTimeRef.current = time;
      }
      
      const elapsed = time - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);
      
      const easeOutCubic = 1 - Math.pow(1 - progress, 3);
      const nextValue = startValue + (targetValue - startValue) * easeOutCubic;
      
      setCurrentValue(nextValue);
      previousValueRef.current = nextValue;

      if (progress < 1) {
        requestRef.current = requestAnimationFrame(animate);
      } else {
        setCurrentValue(targetValue);
        previousValueRef.current = targetValue;
        startTimeRef.current = undefined;
      }
    };

    if (requestRef.current !== undefined) {
      cancelAnimationFrame(requestRef.current);
    }
    
    startTimeRef.current = undefined;
    requestRef.current = requestAnimationFrame(animate);

    return () => {
      if (requestRef.current !== undefined) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [targetValue, duration]);

  return formatter ? formatter(currentValue) : currentValue;
}
