import { useState, useMemo, useCallback } from 'react';
import { NetWorthSnapshot } from '../hooks/usePortfolioData';
import { formatINR } from '../utils/formatters';

interface NetWorthTimelineChartProps {
  history: NetWorthSnapshot[];
  currentNetWorth: number;
}

export default function NetWorthTimelineChart({ history, currentNetWorth }: NetWorthTimelineChartProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  // Generate mock history if database is empty to show a beautiful starting timeline
  const chartData = useMemo(() => {
    if (history.length >= 2) {
      return [...history].sort(
        (a, b) => new Date(a.snapshot_date).getTime() - new Date(b.snapshot_date).getTime()
      );
    }

    // Mock history: 6 months of simulated growth ending in the current net worth
    const mockList: NetWorthSnapshot[] = [];
    const baseVal = currentNetWorth > 0 ? currentNetWorth : 1500000;
    const now = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 15);
      const factor = 1 - (i * 0.03) + (Math.sin(i) * 0.01); // 3% monthly drag back
      mockList.push({
        id: `mock-${i}`,
        snapshot_date: d.toISOString().split('T')[0],
        total_value: parseFloat((baseVal * factor).toFixed(0)),
        stocks_value: parseFloat((baseVal * factor * 0.45).toFixed(0)),
        fd_value: parseFloat((baseVal * factor * 0.35).toFixed(0)),
        gold_value: parseFloat((baseVal * factor * 0.10).toFixed(0)),
        real_estate_value: parseFloat((baseVal * factor * 0.10).toFixed(0)),
      });
    }
    return mockList;
  }, [history, currentNetWorth]);

  // SVG Chart Layout Bounds
  const width = 600;
  const height = 240;
  const paddingLeft = 60;
  const paddingRight = 20;
  const paddingTop = 20;
  const paddingBottom = 40;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  // Find min & max
  const values = chartData.map((d) => d.total_value);
  const maxVal = Math.max(...values, 1000) * 1.05; // 5% cushion
  const minVal = Math.min(...values, 0) * 0.95;

  const getX = useCallback((index: number) => {
    if (chartData.length <= 1) return paddingLeft;
    return paddingLeft + (index / (chartData.length - 1)) * chartWidth;
  }, [chartData.length, paddingLeft, chartWidth]);

  const getY = useCallback((val: number) => {
    const range = maxVal - minVal;
    if (range <= 0) return paddingTop + chartHeight / 2;
    const pct = (val - minVal) / range;
    return paddingTop + chartHeight - pct * chartHeight;
  }, [maxVal, minVal, paddingTop, chartHeight]);

  // Generate SVG path strings
  const linePath = useMemo(() => {
    if (chartData.length === 0) return '';
    return chartData
      .map((d, idx) => `${idx === 0 ? 'M' : 'L'} ${getX(idx)} ${getY(d.total_value)}`)
      .join(' ');
  }, [chartData, getX, getY]);

  const areaPath = useMemo(() => {
    if (chartData.length === 0) return '';
    const start = `M ${getX(0)} ${paddingTop + chartHeight}`;
    const line = chartData
      .map((d, idx) => `L ${getX(idx)} ${getY(d.total_value)}`)
      .join(' ');
    const end = `L ${getX(chartData.length - 1)} ${paddingTop + chartHeight} Z`;
    return `${start} ${line} ${end}`;
  }, [chartData, getX, getY, paddingTop, chartHeight]);

  const points = chartData.map((d, idx) => ({
    x: getX(idx),
    y: getY(d.total_value),
    value: d.total_value,
    date: d.snapshot_date,
  }));

  const yTicks = 4;
  const yAxisTicks = Array.from({ length: yTicks }).map((_, i) => {
    const val = minVal + (i / (yTicks - 1)) * (maxVal - minVal);
    return {
      y: getY(val),
      label: formatCompactINR(val),
    };
  });

  function formatCompactINR(val: number): string {
    if (val >= 10000000) return `₹${(val / 10000000).toFixed(1)}Cr`;
    if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`;
    return `₹${val.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
  }

  function formatDateLabel(isoString: string): string {
    const d = new Date(isoString);
    return d.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
  }

  const hoverPoint = hoveredIdx !== null ? points[hoveredIdx] : null;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm p-5 relative overflow-hidden">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
            Net Worth Growth Timeline
          </h3>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
            Historical compound valuation history
          </p>
        </div>
        {history.length < 2 && (
          <span className="text-[9px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/10 px-2 py-0.5 rounded-full uppercase tracking-wider">
            Simulated
          </span>
        )}
      </div>

      <div className="relative w-full h-[240px]">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full">
          {/* Gradients */}
          <defs>
            <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines (horizontal) */}
          {yAxisTicks.map((tick, i) => (
            <g key={i}>
              <line
                x1={paddingLeft}
                y1={tick.y}
                x2={width - paddingRight}
                y2={tick.y}
                className="stroke-slate-100 dark:stroke-slate-700/50"
                strokeWidth={1}
                strokeDasharray="4 4"
              />
              <text
                x={paddingLeft - 8}
                y={tick.y + 3}
                textAnchor="end"
                className="fill-slate-400 dark:fill-slate-500 font-bold"
                fontSize={9}
              >
                {tick.label}
              </text>
            </g>
          ))}

          {/* X Axis Labels */}
          {points.map((p, idx) => (
            <text
              key={idx}
              x={p.x}
              y={height - paddingBottom + 18}
              textAnchor="middle"
              className="fill-slate-400 dark:fill-slate-500 font-semibold"
              fontSize={8.5}
            >
              {formatDateLabel(p.date)}
            </text>
          ))}

          {/* Fill Area */}
          <path d={areaPath} fill="url(#areaGrad)" />

          {/* Growth Line */}
          <path
            d={linePath}
            fill="none"
            stroke="#3b82f6"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Interactive Hover Nodes */}
          {points.map((p, idx) => (
            <circle
              key={idx}
              cx={p.x}
              cy={p.y}
              r={hoveredIdx === idx ? 6 : 4}
              className={`cursor-pointer transition-all ${
                hoveredIdx === idx
                  ? 'fill-blue-500 stroke-white dark:stroke-slate-800'
                  : 'fill-transparent hover:fill-blue-500/20'
              }`}
              strokeWidth={hoveredIdx === idx ? 2 : 0}
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
            />
          ))}
        </svg>

        {/* Floating Tooltip details */}
        {hoverPoint && (
          <div
            className="absolute bg-slate-900/95 text-white p-3 rounded-xl border border-slate-700 shadow-2xl z-50 text-[10px] pointer-events-none transform -translate-x-1/2 -translate-y-full"
            style={{
              left: `${(hoverPoint.x / width) * 100}%`,
              top: `${(hoverPoint.y / height) * 100 - 5}%`,
            }}
          >
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">
              {new Date(hoverPoint.date).toLocaleDateString('en-IN', { month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
            <p className="text-sm font-extrabold text-blue-400 mt-0.5">
              {formatINR(hoverPoint.value)}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
