import React from 'react';
import { useAnimatedCounter } from '../../hooks/useAnimatedCounter';

export interface AnimatedNumberProps {
  value: number;
  formatter?: (val: number) => string;
  className?: string;
  duration?: number;
}

export const AnimatedNumber = React.memo(({
  value,
  formatter,
  className = '',
  duration = 500
}: AnimatedNumberProps) => {
  const animatedValue = useAnimatedCounter(value, duration, formatter);
  const formattedFinalTarget = formatter ? formatter(value) : value.toLocaleString();

  return (
    <span
      className={`tnum ${className}`}
      aria-label={formattedFinalTarget}
    >
      <span aria-hidden="true">{animatedValue as React.ReactNode}</span>
    </span>
  );
});

AnimatedNumber.displayName = 'AnimatedNumber';
