import { useState, useMemo, useEffect, useRef } from 'react';
import { NetWorthSnapshot } from '../hooks/usePortfolioData';
import { formatINR } from '../utils/formatters';

interface NetWorthTimelineChartProps {
  history: NetWorthSnapshot[];
  currentNetWorth: number;
}

type DateRange = '1M' | '3M' | '6M' | '1Y' | 'ALL';

export default function NetWorthTimelineChart({ history, currentNetWorth }: NetWorthTimelineChartProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [range, setRange] = useState<DateRange>('ALL');
  
  // Resize tracking
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 600, height: 240 });

  useEffect(() => {
    if (!containerRef.current) return;
    let timeoutId: number | null = null;
    const resizeObserver = new ResizeObserver((entries) => {
      if (!entries || entries.length === 0) return;
      const { width } = entries[0].contentRect;
      if (timeoutId) window.clearTimeout(timeoutId);
      timeoutId = window.setTimeout(() => {
        setDimensions((prev) => ({
          width: width > 100 ? width : prev.width,
          height: 240, // fix height to 240px
        }));
      }, 100);
    });
    resizeObserver.observe(containerRef.current);
    return () => {
      resizeObserver.disconnect();
      if (timeoutId) window.clearTimeout(timeoutId);
    };
  }, []);

  // Generate base history (real or mock)
  const baseData = useMemo(() => {
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
      const factor = 1 - (i * 0.03) + (Math.sin(i) * 0.01);
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

  // Filter history based on range selector
  const chartData = useMemo(() => {
    if (range === 'ALL') return baseData;
    const now = new Date();
    let days = 365;
    if (range === '1M') days = 30;
    else if (range === '3M') days = 90;
    else if (range === '6M') days = 180;
    else if (range === '1Y') days = 365;

    const cutoff = new Date();
    cutoff.setDate(now.getDate() - days);

    const filtered = baseData.filter((d) => new Date(d.snapshot_date) >= cutoff);
    if (filtered.length < 2) {
      return baseData.slice(-2); // Fallback: last 2 items
    }
    return filtered;
  }, [baseData, range]);

  // SVG Chart Layout Bounds
  const { width, height } = dimensions;
  const paddingLeft = 60;
  const paddingRight = 20;
  const paddingTop = 20;
  const paddingBottom = 40;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  // Find min & max
  const minMax = useMemo(() => {
    const values = chartData.map((d) => d.total_value);
    const maxVal = Math.max(...values, 1000) * 1.05; // 5% cushion
    const minVal = Math.min(...values, 0) * 0.95;
    return { maxVal, minVal };
  }, [chartData]);
  const { maxVal, minVal } = minMax;

  // Precalculate points coordinates
  const points = useMemo(() => {
    const rangeVal = maxVal - minVal;
    return chartData.map((d, index) => {
      let x = paddingLeft;
      if (chartData.length > 1) {
        x = paddingLeft + (index / (chartData.length - 1)) * chartWidth;
      }
      let y = paddingTop + chartHeight / 2;
      if (rangeVal > 0) {
        const pct = (d.total_value - minVal) / rangeVal;
        y = paddingTop + chartHeight - pct * chartHeight;
      }
      return {
        x,
        y,
        value: d.total_value,
        date: d.snapshot_date,
      };
    });
  }, [chartData, maxVal, minVal, chartWidth, chartHeight]);

  // Generate SVG path strings
  const paths = useMemo(() => {
    if (points.length === 0) return { linePath: '', areaPath: '' };
    const linePath = points
      .map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
      .join(' ');
      
    const areaPath = `M ${points[0].x} ${paddingTop + chartHeight} L ${points.map(p => `${p.x} ${p.y}`).join(' L ')} L ${points[points.length - 1].x} ${paddingTop + chartHeight} Z`;
    
    return { linePath, areaPath };
  }, [points, chartHeight]);
  const { linePath, areaPath } = paths;

  // Precalculate Y axis ticks coordinates
  const yAxisTicks = useMemo(() => {
    const rangeVal = maxVal - minVal;
    const yTicks = 4;
    return Array.from({ length: yTicks }).map((_, i) => {
      const val = minVal + (i / (yTicks - 1)) * rangeVal;
      let y = paddingTop + chartHeight / 2;
      if (rangeVal > 0) {
        const pct = (val - minVal) / rangeVal;
        y = paddingTop + chartHeight - pct * chartHeight;
      }
      return {
        y,
        label: formatCompactINR(val),
      };
    });
  }, [minVal, maxVal, chartHeight]);

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
    <div ref={containerRef} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm p-5 relative overflow-hidden">
      <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
        <div>
          <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
            Net Worth Growth Timeline
          </h3>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
            Historical compound valuation history
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          {history.length < 2 && (
            <span className="text-[9px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/10 px-2 py-0.5 rounded-full uppercase tracking-wider">
              Simulated
            </span>
          )}
          {/* Time range selector */}
          <div className="flex bg-slate-100 dark:bg-slate-750/70 p-1 rounded-xl gap-0.5 border border-slate-200/40 dark:border-slate-700/30">
            {(['1M', '3M', '6M', '1Y', 'ALL'] as DateRange[]).map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`px-2 py-0.5 rounded-lg text-[9px] font-bold transition-all ${
                  range === r
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
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
