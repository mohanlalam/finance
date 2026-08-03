import React from 'react';
import { useAnimatedCounter } from '../../hooks/useAnimatedCounter';

interface AnimatedNumberProps {
  value: number;
  formatter?: (val: number) => string;
  className?: string;
  duration?: number;
}

export const AnimatedNumber = React.memo(({
  value,
  formatter,
  className,
  duration = 500
}: AnimatedNumberProps) => {
  const displayValue = useAnimatedCounter(value, duration, formatter);
  
  if (className) {
    return <span className={className}>{displayValue as React.ReactNode}</span>;
  }
  
  return <>{displayValue}</>;
});
