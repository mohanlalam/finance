import React, { useMemo } from 'react';

export interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  className?: string;
}

export const Sparkline = React.memo(function Sparkline({
  data,
  width = 80,
  height = 28,
  color = 'var(--positive)',
  className = '',
}: SparklineProps) {
  const gradientId = useMemo(
    () => `sparkline-gradient-${color.replace(/[^a-zA-Z0-9]/g, '')}-${width}-${height}`,
    [color, width, height]
  );

  const points = useMemo(() => {
    if (!data || data.length === 0) return '';
    if (data.length === 1) return `0,${height / 2} ${width},${height / 2}`;

    const min = Math.min(...data);
    const max = Math.max(...data);
    
    // Add small padding so line doesn't get clipped by stroke width
    const paddingY = 2;
    const effectiveHeight = height - paddingY * 2;
    
    const range = max - min;
    const isFlat = range === 0;

    return data.map((value, i) => {
      const x = (i / (data.length - 1)) * width;
      let y;
      if (isFlat) {
        y = height / 2;
      } else {
        // SVG y goes down, so we invert
        y = height - paddingY - ((value - min) / range) * effectiveHeight;
      }
      return `${x},${y}`;
    }).join(' ');
  }, [data, width, height]);

  if (!data || data.length < 2) {
    return null;
  }

  return (
    <svg 
      width={width} 
      height={height} 
      viewBox={`0 0 ${width} ${height}`} 
      className={`overflow-visible ${className}`}
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.2} />
          <stop offset="100%" stopColor={color} stopOpacity={0.0} />
        </linearGradient>
      </defs>
      <polygon
        points={`${points} ${width},${height} 0,${height}`}
        fill={`url(#${gradientId})`}
      />
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="animate-sparkline-draw"
      />
    </svg>
  );
});

export default Sparkline;
