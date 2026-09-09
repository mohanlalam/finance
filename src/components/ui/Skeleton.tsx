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
    text: 'rounded-[var(--radius-small)] h-4 w-full',
    circular: 'rounded-full',
    rectangular: 'rounded-[var(--radius-medium)]',
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
      className={`animate-shimmer bg-[var(--surface-secondary)] ${variantClasses[variant]} ${className}`}
      style={dynamicStyle}
      {...props}
    />
  );
}
