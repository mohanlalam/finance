import { useState, useMemo, useEffect, useRef } from 'react';
import { NetWorthSnapshot } from '../hooks/usePortfolioData';
import { formatINR } from '../utils/formatters';
import { SegmentedControl } from './ui/SegmentedControl';

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
  const [dimensions, setDimensions] = useState({ width: 0, height: 240 });

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

    // Exactly 1 real snapshot: show a flat line anchored one month earlier
    if (history.length === 1) {
      const point = history[0];
      const anchor = new Date(point.snapshot_date);
      anchor.setMonth(anchor.getMonth() - 1);
      return [
        { ...point, id: 'anchor-start', snapshot_date: anchor.toISOString().split('T')[0] },
        point,
      ];
    }

    // No real data at all: generate 6 months of illustrative mock data
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
  const paddingLeft = 55;
  const paddingRight = 15;
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

  // Generate SVG path strings (smooth curve)
  const paths = useMemo(() => {
    if (points.length === 0) return { linePath: '', areaPath: '' };
    
    // Smooth bezier curve builder
    let linePath = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const curr = points[i];
      const next = points[i + 1];
      const cpX1 = curr.x + (next.x - curr.x) / 3;
      const cpY1 = curr.y;
      const cpX2 = curr.x + 2 * (next.x - curr.x) / 3;
      const cpY2 = next.y;
      linePath += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${next.x} ${next.y}`;
    }
      
    const areaPath = `${linePath} L ${points[points.length - 1].x} ${paddingTop + chartHeight} L ${points[0].x} ${paddingTop + chartHeight} Z`;
    
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
    <div ref={containerRef} className="apple-card p-5 relative overflow-hidden">
      <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
        <div>
          <h3 className="text-card-title font-semibold text-slate-800 dark:text-slate-200">
            Net worth timeline
          </h3>
          <p className="text-supporting mt-0.5">
            Compound net worth valuation history
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          {history.length < 2 && (
            <span className="text-[9px] font-bold bg-[#eaf3ff] text-[#007aff] px-2 py-0.5 rounded-full uppercase tracking-wider">
              Simulated
            </span>
          )}
          {/* Apple Segmented date range control */}
          <SegmentedControl
            options={[
              { id: '1M', label: '1M' },
              { id: '3M', label: '3M' },
              { id: '6M', label: '6M' },
              { id: '1Y', label: '1Y' },
              { id: 'ALL', label: 'All' },
            ] as const}
            value={range}
            onChange={setRange}
          />
        </div>
      </div>

      <div className="relative w-full h-[240px]">
        {history.length < 2 && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center pointer-events-none mt-8">
            <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm rounded-full px-4 py-2 text-sm font-medium text-slate-500 dark:text-slate-400 shadow-sm mb-1 border border-slate-200/50 dark:border-slate-700/50">
              Sample Preview
            </div>
            <div className="text-xs font-medium text-slate-400 dark:text-slate-500 bg-white/40 dark:bg-slate-900/40 px-3 py-1 rounded-full backdrop-blur-sm">
              Add assets to track your wealth over time
            </div>
          </div>
        )}
        <svg viewBox={`0 0 ${width} ${height}`} className={`w-full h-full ${history.length < 2 ? 'opacity-40' : ''}`}>
          {/* Gradients */}
          <defs>
            <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#007aff" stopOpacity="0.12" />
              <stop offset="100%" stopColor="#007aff" stopOpacity="0.0" />
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
                className="stroke-slate-100 dark:stroke-zinc-800/50"
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

          {/* X Axis Labels (fewer labels spacing) */}
          {points.map((p, idx) => {
            const total = points.length;
            const skip = Math.max(1, Math.floor(total / 4));
            const shouldShowLabel = idx === 0 || idx === total - 1 || idx % skip === 0;
            if (!shouldShowLabel) return null;

            return (
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
            );
          })}

          {/* Fill Area */}
          <path d={areaPath} fill="url(#areaGrad)" />

          {/* Growth Line */}
          <path
            d={linePath}
            fill="none"
            stroke="#007aff"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Interactive Hover Nodes */}
          {points.map((p, idx) => (
            <circle
              key={idx}
              cx={p.x}
              cy={p.y}
              r={hoveredIdx === idx ? 5 : 3.5}
              className={`cursor-pointer transition-all ${
                hoveredIdx === idx
                  ? 'fill-[#007aff] stroke-white dark:stroke-zinc-900'
                  : 'fill-transparent hover:fill-[#007aff]/20'
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
            className="absolute bg-slate-900/95 dark:bg-zinc-900/95 text-white p-2.5 rounded-xl border border-slate-700/60 shadow-floating z-50 text-[10px] pointer-events-none transform -translate-x-1/2 -translate-y-full"
            style={{
              left: `${(hoverPoint.x / width) * 100}%`,
              top: `${(hoverPoint.y / height) * 100 - 5}%`,
            }}
          >
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">
              {new Date(hoverPoint.date).toLocaleDateString('en-IN', { month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
            <p className="text-xs font-extrabold text-[#60a5fa] mt-0.5 tnum">
              {formatINR(hoverPoint.value)}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
