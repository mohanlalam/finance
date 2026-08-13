import React from 'react';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
}

export function Skeleton({
  variant = 'text',
  width,
  height,
  className = '',
  style,
  ...props
}: SkeletonProps) {
  const variantClasses = {
    text: 'rounded-md h-4 w-full',
    circular: 'rounded-full',
    rectangular: 'rounded-xl',
  };

  const dynamicStyle: React.CSSProperties = {
    width: width !== undefined ? (typeof width === 'number' ? `${width}px` : width) : undefined,
    height: height !== undefined ? (typeof height === 'number' ? `${height}px` : height) : undefined,
    ...style,
  };

  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label="Loading content"
      className={`animate-pulse bg-slate-200 dark:bg-slate-800 ${variantClasses[variant]} ${className}`}
      style={dynamicStyle}
      {...props}
    />
  );
}
