import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { NetWorthSnapshot } from '../hooks/usePortfolioData';
import { formatINR, formatPercent } from '../utils/formatters';
import { SegmentedControl } from './ui/SegmentedControl';
import { TrendingUp, TrendingDown, Layers, Landmark } from './icons/AppIcons';

interface NetWorthTimelineChartProps {
  history: NetWorthSnapshot[];
  currentNetWorth: number;
  currentStocks?: number;
  currentFD?: number;
}

type DateRange = '1M' | '3M' | '6M' | '1Y' | 'ALL';
type SeriesMode = 'total' | 'both' | 'stocks' | 'fd';

// Smooth Bezier Curve Path Builder
function buildSmoothPath(pts: { x: number; y: number }[], baseY: number, hasArea = true) {
  if (pts.length === 0) return { linePath: '', areaPath: '' };
  if (pts.length === 1) {
    return {
      linePath: `M ${pts[0].x} ${pts[0].y}`,
      areaPath: `M ${pts[0].x} ${pts[0].y} L ${pts[0].x} ${baseY} Z`,
    };
  }

  let linePath = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const curr = pts[i];
    const next = pts[i + 1];
    const cpX1 = curr.x + (next.x - curr.x) / 3;
    const cpY1 = curr.y;
    const cpX2 = curr.x + (2 * (next.x - curr.x)) / 3;
    const cpY2 = next.y;
    linePath += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${next.x} ${next.y}`;
  }

  const areaPath = hasArea
    ? `${linePath} L ${pts[pts.length - 1].x} ${baseY} L ${pts[0].x} ${baseY} Z`
    : '';

  return { linePath, areaPath };
}

export default function NetWorthTimelineChart({
  history,
  currentNetWorth,
  currentStocks,
  currentFD,
}: NetWorthTimelineChartProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [range, setRange] = useState<DateRange>('ALL');
  const [seriesMode, setSeriesMode] = useState<SeriesMode>('total');

  // Resize tracking
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 240 });

  useEffect(() => {
    if (!containerRef.current) return;
    let animationFrameId: number | null = null;
    const resizeObserver = new ResizeObserver((entries) => {
      if (!entries || entries.length === 0) return;
      const { width } = entries[0].contentRect;
      if (animationFrameId) window.cancelAnimationFrame(animationFrameId);
      animationFrameId = window.requestAnimationFrame(() => {
        setDimensions((prev) => ({
          width: width > 100 ? width : prev.width,
          height: 240,
        }));
      });
    });
    resizeObserver.observe(containerRef.current);
    return () => {
      resizeObserver.disconnect();
      if (animationFrameId) window.cancelAnimationFrame(animationFrameId);
    };
  }, []);

  // Generate base history (real or mock with realistic asset class splits)
  const baseData = useMemo(() => {
    if (history.length >= 2) {
      return [...history]
        .sort((a, b) => new Date(a.snapshot_date).getTime() - new Date(b.snapshot_date).getTime())
        .map((item) => {
          // If stocks_value or fd_value are missing in legacy DB records, estimate cleanly
          const stocksVal = item.stocks_value ?? (item.total_value * 0.6);
          const fdVal = item.fd_value ?? (item.total_value * 0.25);
          return {
            ...item,
            stocks_value: stocksVal,
            fd_value: fdVal,
          };
        });
    }

    // Exactly 1 real snapshot: anchor one month earlier
    if (history.length === 1) {
      const point = history[0];
      const anchor = new Date(point.snapshot_date);
      anchor.setMonth(anchor.getMonth() - 1);
      const prevTotal = point.total_value * 0.96;
      const prevStocks = (point.stocks_value || point.total_value * 0.6) * 0.94;
      const prevFD = (point.fd_value || point.total_value * 0.25) * 0.99;
      return [
        {
          ...point,
          id: 'anchor-start',
          snapshot_date: anchor.toISOString().split('T')[0],
          total_value: prevTotal,
          stocks_value: prevStocks,
          fd_value: prevFD,
        },
        point,
      ];
    }

    // No real data: generate realistic 6-month historical trajectory
    const mockList: NetWorthSnapshot[] = [];
    const baseVal = currentNetWorth > 0 ? currentNetWorth : 1500000;
    const baseStocks = currentStocks !== undefined && currentStocks > 0 ? currentStocks : baseVal * 0.6;
    const baseFD = currentFD !== undefined && currentFD > 0 ? currentFD : baseVal * 0.25;
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 15);
      const totalFactor = 1 - (i * 0.025) + (Math.sin(i * 1.5) * 0.015);
      const stockFactor = 1 - (i * 0.038) + (Math.sin(i * 1.8) * 0.025);
      const fdFactor = 1 - (i * 0.006); // FDs grow steadily with minimal volatility

      const totalVal = Math.round(baseVal * totalFactor);
      const sVal = Math.round(baseStocks * stockFactor);
      const fVal = Math.round(baseFD * fdFactor);

      mockList.push({
        id: `mock-${i}`,
        snapshot_date: d.toISOString().split('T')[0],
        total_value: totalVal,
        stocks_value: sVal,
        fd_value: fVal,
        gold_value: Math.round(baseVal * 0.1),
        real_estate_value: Math.round(baseVal * 0.05),
      });
    }
    return mockList;
  }, [history, currentNetWorth, currentStocks, currentFD]);

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
      return baseData.slice(-2);
    }
    return filtered;
  }, [baseData, range]);

  // Period performance metrics
  const periodPerformance = useMemo(() => {
    if (chartData.length < 2) return null;
    const start = chartData[0].total_value;
    const end = chartData[chartData.length - 1].total_value;
    const change = end - start;
    const changePct = start > 0 ? (change / start) * 100 : 0;

    const startStocks = chartData[0].stocks_value || 0;
    const endStocks = chartData[chartData.length - 1].stocks_value || 0;
    const stocksChange = endStocks - startStocks;
    const stocksChangePct = startStocks > 0 ? (stocksChange / startStocks) * 100 : 0;

    const startFD = chartData[0].fd_value || 0;
    const endFD = chartData[chartData.length - 1].fd_value || 0;
    const fdChange = endFD - startFD;
    const fdChangePct = startFD > 0 ? (fdChange / startFD) * 100 : 0;

    return {
      change,
      changePct,
      stocksChange,
      stocksChangePct,
      fdChange,
      fdChangePct,
      isPositive: change >= 0,
    };
  }, [chartData]);

  // Peak Net Worth Milestone (All-Time High)
  const peakNetWorth = useMemo(() => {
    if (baseData.length === 0) return 0;
    return Math.max(...baseData.map((d) => d.total_value));
  }, [baseData]);

  // SVG Chart Layout Bounds
  const { width, height } = dimensions;
  const paddingLeft = 55;
  const paddingRight = 15;
  const paddingTop = 16;
  const paddingBottom = 36;

  const chartWidth = Math.max(width - paddingLeft - paddingRight, 10);
  const chartHeight = Math.max(height - paddingTop - paddingBottom, 10);

  // Determine active series values to calculate global min & max
  const minMax = useMemo(() => {
    const allValues: number[] = [];
    chartData.forEach((d) => {
      if (seriesMode === 'total') {
        allValues.push(d.total_value);
      } else if (seriesMode === 'stocks') {
        allValues.push(d.stocks_value || 0);
      } else if (seriesMode === 'fd') {
        allValues.push(d.fd_value || 0);
      } else if (seriesMode === 'both') {
        allValues.push(d.stocks_value || 0);
        allValues.push(d.fd_value || 0);
      }
    });

    const maxVal = Math.max(...allValues, 1000) * 1.06;
    const minVal = Math.min(...allValues, 0) * 0.94;
    return { maxVal, minVal };
  }, [chartData, seriesMode]);
  const { maxVal, minVal } = minMax;

  // Precalculate coordinate points for each series
  const pointsMap = useMemo(() => {
    const rangeVal = maxVal - minVal;
    const totalPoints: { x: number; y: number; val: number; date: string }[] = [];
    const stocksPoints: { x: number; y: number; val: number; date: string }[] = [];
    const fdPoints: { x: number; y: number; val: number; date: string }[] = [];

    chartData.forEach((d, index) => {
      let x = paddingLeft;
      if (chartData.length > 1) {
        x = paddingLeft + (index / (chartData.length - 1)) * chartWidth;
      }

      const getY = (val: number) => {
        if (rangeVal <= 0) return paddingTop + chartHeight / 2;
        const pct = (val - minVal) / rangeVal;
        return paddingTop + chartHeight - pct * chartHeight;
      };

      totalPoints.push({ x, y: getY(d.total_value), val: d.total_value, date: d.snapshot_date });
      stocksPoints.push({ x, y: getY(d.stocks_value || 0), val: d.stocks_value || 0, date: d.snapshot_date });
      fdPoints.push({ x, y: getY(d.fd_value || 0), val: d.fd_value || 0, date: d.snapshot_date });
    });

    return { totalPoints, stocksPoints, fdPoints };
  }, [chartData, maxVal, minVal, chartWidth, chartHeight]);

  const baseY = paddingTop + chartHeight;
  const totalPaths = useMemo(() => buildSmoothPath(pointsMap.totalPoints, baseY, true), [pointsMap.totalPoints, baseY]);
  const stocksPaths = useMemo(() => buildSmoothPath(pointsMap.stocksPoints, baseY, seriesMode === 'stocks'), [pointsMap.stocksPoints, seriesMode, baseY]);
  const fdPaths = useMemo(() => buildSmoothPath(pointsMap.fdPoints, baseY, seriesMode === 'fd'), [pointsMap.fdPoints, seriesMode, baseY]);

  const handlePointerMove = useCallback((e: React.PointerEvent<SVGSVGElement>) => {
    if (!pointsMap.totalPoints.length) return;
    const svgRect = e.currentTarget.getBoundingClientRect();
    const clientX = e.clientX - svgRect.left;
    const scaleX = width / (svgRect.width || 1);
    const svgX = clientX * scaleX;

    let closestIdx = 0;
    let minDist = Infinity;
    for (let i = 0; i < pointsMap.totalPoints.length; i++) {
      const dist = Math.abs(pointsMap.totalPoints[i].x - svgX);
      if (dist < minDist) {
        minDist = dist;
        closestIdx = i;
      }
    }
    setHoveredIdx(closestIdx);
  }, [pointsMap.totalPoints, width]);

  // Y-axis tick values
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

  // Collision-Free X-Axis Date Generator (Guarantees zero overlapping labels)
  const xAxisLabels = useMemo(() => {
    const pts = pointsMap.totalPoints;
    if (pts.length === 0) return [];
    const minSpacingPx = 68; // Minimum 68px between date labels
    const result: { x: number; label: string }[] = [];
    let lastX = -Infinity;

    const step = Math.max(1, Math.ceil((pts.length * minSpacingPx) / Math.max(chartWidth, 1)));

    for (let i = 0; i < pts.length; i += step) {
      const p = pts[i];
      if (p.x - lastX >= minSpacingPx) {
        result.push({ x: p.x, label: formatDateLabel(p.date) });
        lastX = p.x;
      }
    }

    // Ensure final date point is cleanly anchored without colliding with preceding label
    const lastPoint = pts[pts.length - 1];
    if (lastPoint) {
      if (lastPoint.x - lastX >= minSpacingPx - 15) {
        result.push({ x: lastPoint.x, label: formatDateLabel(lastPoint.date) });
      } else if (result.length > 1) {
        // Swap last label to end point to preserve right boundary
        result[result.length - 1] = { x: lastPoint.x, label: formatDateLabel(lastPoint.date) };
      }
    }

    return result;
  }, [pointsMap.totalPoints, chartWidth]);

  function formatCompactINR(val: number): string {
    if (val >= 10000000) return `₹${(val / 10000000).toFixed(1)}Cr`;
    if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`;
    return `₹${val.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
  }

  function formatDateLabel(isoString: string): string {
    const d = new Date(isoString);
    return d.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
  }

  const activeHoverItem = hoveredIdx !== null ? chartData[hoveredIdx] : null;
  const hoverX = hoveredIdx !== null ? pointsMap.totalPoints[hoveredIdx]?.x : null;

  return (
    <div ref={containerRef} className="apple-card p-5 relative overflow-hidden flex flex-col h-[370px] justify-between">
      {/* Header with Title, Period Performance & Controls */}
      <div className="flex justify-between items-start mb-2 flex-wrap gap-2">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-card-title font-bold text-[var(--text-primary)]">
              Net worth timeline
            </h3>
            {history.length < 2 && (
              <span className="text-[9px] font-extrabold bg-[var(--accent-blue-soft)] text-[var(--accent-blue)] px-2 py-0.5 rounded-[var(--radius-pill)] uppercase tracking-wider">
                Simulated
              </span>
            )}
          </div>

          {/* Period Performance Subtitle */}
          <div className="flex items-center gap-2 mt-0.5">
            <p className="text-supporting text-xs">
              {seriesMode === 'total' ? 'Compound net worth history' : seriesMode === 'both' ? 'Stocks vs FDs comparison' : seriesMode === 'stocks' ? 'Stocks & equity valuation' : 'Fixed Deposits accumulation'}
            </p>
            {periodPerformance && (
              <span className={`inline-flex items-center gap-0.5 text-[11px] font-extrabold px-1.5 py-0.2 rounded-[var(--radius-small)] tnum ${
                periodPerformance.isPositive ? 'text-[var(--positive)] bg-[var(--positive-soft)]' : 'text-[var(--negative)] bg-[var(--negative-soft)]'
              }`}>
                {periodPerformance.isPositive ? <TrendingUp size={11} aria-hidden="true" /> : <TrendingDown size={11} aria-hidden="true" />}
                {periodPerformance.isPositive ? '+' : ''}{formatINR(periodPerformance.change)} ({formatPercent(periodPerformance.changePct)})
              </span>
            )}
          </div>
        </div>

        {/* Date Range Selector */}
        <div className="flex items-center gap-2">
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

      {/* Series Filter Selector Bar (Total | Stocks vs FDs | Stocks | FDs) */}
      <div className="flex items-center justify-between gap-1.5 pb-1 border-b border-[var(--border-subtle)] text-[11px] overflow-x-auto">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setSeriesMode('total')}
            className={`px-2.5 py-1 rounded-[var(--radius-small)] font-bold transition-all ios-press flex items-center gap-1.5 ${
              seriesMode === 'total'
                ? 'bg-[var(--accent-blue)] text-white shadow-xs'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-secondary)]'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-white/80" />
            Total Net Worth
          </button>

          <button
            onClick={() => setSeriesMode('both')}
            className={`px-2.5 py-1 rounded-[var(--radius-small)] font-bold transition-all ios-press flex items-center gap-1.5 ${
              seriesMode === 'both'
                ? 'bg-[var(--text-primary)] text-[var(--surface)] shadow-xs'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-secondary)]'
            }`}
          >
            <Layers size={12} aria-hidden="true" />
            Stocks vs FDs
          </button>

          <button
            onClick={() => setSeriesMode('stocks')}
            className={`px-2 py-1 rounded-[var(--radius-small)] font-bold transition-all ios-press flex items-center gap-1 ${
              seriesMode === 'stocks'
                ? 'bg-[var(--accent-blue)] text-white shadow-xs'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-secondary)]'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-[#387ed1]" />
            Stocks Only
          </button>

          <button
            onClick={() => setSeriesMode('fd')}
            className={`px-2 py-1 rounded-[var(--radius-small)] font-bold transition-all ios-press flex items-center gap-1 ${
              seriesMode === 'fd'
                ? 'bg-[var(--warning)] text-white shadow-xs'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-secondary)]'
            }`}
          >
            <Landmark size={12} aria-hidden="true" />
            FDs Only
          </button>
        </div>

        {/* Milestone All-Time High Badge */}
        {peakNetWorth > 0 && (
          <span className="text-[10px] font-semibold text-[var(--text-tertiary)] shrink-0 hidden sm:inline tnum">
            ATH Peak: <span className="font-bold text-[var(--text-secondary)]">{formatCompactINR(peakNetWorth)}</span>
          </span>
        )}
      </div>

      {/* SVG Multi-Series Interactive Chart Area */}
      <div className="relative w-full h-[225px]">
        {history.length < 2 && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center pointer-events-none mt-4">
            <div className="bg-[var(--surface)]/80 backdrop-blur-sm rounded-[var(--radius-pill)] px-3 py-1.5 text-xs font-semibold text-[var(--text-secondary)] shadow-sm mb-1 border border-[var(--border-subtle)]">
              Sample Preview Mode
            </div>
            <div className="text-[10.5px] font-medium text-[var(--text-tertiary)] bg-[var(--surface-secondary)]/60 px-2.5 py-0.5 rounded-[var(--radius-pill)]">
              Add assets to track your wealth trajectory over time
            </div>
          </div>
        )}

        <svg
          viewBox={`0 0 ${width} ${height}`}
          onPointerDown={handlePointerMove}
          onPointerMove={handlePointerMove}
          onPointerLeave={() => setHoveredIdx(null)}
          className={`w-full h-full touch-none select-none ${history.length < 2 ? 'opacity-40' : ''}`}
        >
          {/* Gradients */}
          <defs>
            <linearGradient id="totalAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#387ed1" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#387ed1" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="stocksAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#387ed1" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#387ed1" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="fdAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.0" />
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
                className="stroke-[var(--border-subtle)]"
                strokeWidth={1}
                strokeDasharray="4 4"
              />
              <text
                x={paddingLeft - 8}
                y={tick.y + 3}
                textAnchor="end"
                className="fill-[var(--text-tertiary)] font-bold tnum"
                fontSize={9}
              >
                {tick.label}
              </text>
            </g>
          ))}

          {/* Collision-Free X Axis Labels */}
          {xAxisLabels.map((item, idx) => (
            <text
              key={idx}
              x={item.x}
              y={height - paddingBottom + 20}
              textAnchor="middle"
              className="fill-[var(--text-tertiary)] font-semibold"
              fontSize={9}
            >
              {item.label}
            </text>
          ))}

          {/* 1. Total Net Worth Series */}
          {seriesMode === 'total' && (
            <>
              <path d={totalPaths.areaPath} fill="url(#totalAreaGrad)" />
              <path
                d={totalPaths.linePath}
                fill="none"
                stroke="#387ed1"
                strokeWidth={2.5}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </>
          )}

          {/* 2. Stocks Series */}
          {(seriesMode === 'both' || seriesMode === 'stocks') && (
            <>
              {seriesMode === 'stocks' && <path d={stocksPaths.areaPath} fill="url(#stocksAreaGrad)" />}
              <path
                d={stocksPaths.linePath}
                fill="none"
                stroke="#387ed1"
                strokeWidth={2.2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </>
          )}

          {/* 3. Fixed Deposits Series */}
          {(seriesMode === 'both' || seriesMode === 'fd') && (
            <>
              {seriesMode === 'fd' && <path d={fdPaths.areaPath} fill="url(#fdAreaGrad)" />}
              <path
                d={fdPaths.linePath}
                fill="none"
                stroke="#f59e0b"
                strokeWidth={2.2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </>
          )}

          {/* Interactive Vertical Crosshair Line */}
          {hoverX !== null && (
            <line
              x1={hoverX}
              y1={paddingTop}
              x2={hoverX}
              y2={height - paddingBottom}
              stroke="var(--accent-blue)"
              strokeWidth={1.2}
              strokeDasharray="3 3"
              className="opacity-70"
            />
          )}

          {/* Interactive Scrubbing Nodes */}
          {pointsMap.totalPoints.map((p, idx) => {
            const isHovered = hoveredIdx === idx;
            const stockP = pointsMap.stocksPoints[idx];
            const fdP = pointsMap.fdPoints[idx];

            return (
              <g key={idx}>
                {/* Invisible broad touch target for easy scrubbing */}
                <rect
                  x={p.x - 14}
                  y={paddingTop}
                  width={28}
                  height={chartHeight}
                  fill="transparent"
                  className="cursor-pointer"
                  onMouseEnter={() => setHoveredIdx(idx)}
                  onTouchStart={() => setHoveredIdx(idx)}
                  onMouseLeave={() => setHoveredIdx(null)}
                />

                {/* Visible Dots based on series mode */}
                {seriesMode === 'total' && (
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r={isHovered ? 5.5 : 3.5}
                    className={`transition-all ${
                      isHovered
                        ? 'fill-[#387ed1] stroke-[var(--surface)]'
                        : 'fill-transparent hover:fill-[#387ed1]/20'
                    }`}
                    strokeWidth={isHovered ? 2.5 : 0}
                  />
                )}

                {(seriesMode === 'both' || seriesMode === 'stocks') && stockP && (
                  <circle
                    cx={stockP.x}
                    cy={stockP.y}
                    r={isHovered ? 5 : 3}
                    className={`transition-all ${
                      isHovered
                        ? 'fill-[#387ed1] stroke-[var(--surface)]'
                        : 'fill-transparent hover:fill-[#387ed1]/20'
                    }`}
                    strokeWidth={isHovered ? 2 : 0}
                  />
                )}

                {(seriesMode === 'both' || seriesMode === 'fd') && fdP && (
                  <circle
                    cx={fdP.x}
                    cy={fdP.y}
                    r={isHovered ? 5 : 3}
                    className={`transition-all ${
                      isHovered
                        ? 'fill-[#f59e0b] stroke-[var(--surface)]'
                        : 'fill-transparent hover:fill-[#f59e0b]/20'
                    }`}
                    strokeWidth={isHovered ? 2 : 0}
                  />
                )}
              </g>
            );
          })}
        </svg>

        {/* Rich Multi-Series Scrubbing Tooltip HUD */}
        {activeHoverItem && hoverX !== null && (
          <div
            className="absolute bg-[var(--surface)]/95 backdrop-blur-md p-3 rounded-[var(--radius-medium)] border border-[var(--border-subtle)] shadow-2xl z-50 text-[11px] pointer-events-none transform -translate-x-1/2 -translate-y-full transition-transform duration-75 space-y-1.5 min-w-[170px]"
            style={{
              left: `${Math.min(Math.max((hoverX / width) * 100, 20), 80)}%`,
              top: `${Math.max((paddingTop / height) * 100 + 10, 25)}%`,
            }}
          >
            {/* Tooltip Header */}
            <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-1">
              <span className="text-[10px] text-[var(--text-tertiary)] font-extrabold uppercase tracking-wider">
                {new Date(activeHoverItem.snapshot_date).toLocaleDateString('en-IN', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </span>
              <span className="text-[9.5px] font-bold text-[var(--text-secondary)]">Historical Pointer</span>
            </div>

            {/* Total Net Worth */}
            <div className="flex justify-between items-center">
              <span className="font-semibold text-[var(--text-secondary)]">Total Net Worth</span>
              <span className="font-extrabold text-[var(--text-primary)] tnum">
                {formatINR(activeHoverItem.total_value)}
              </span>
            </div>

            {/* Stocks Breakdown */}
            <div className="flex justify-between items-center text-[10.5px]">
              <span className="flex items-center gap-1 text-[var(--text-secondary)]">
                <span className="w-2 h-2 rounded-full bg-[#387ed1]" />
                Stocks &amp; ETFs
              </span>
              <span className="font-bold text-[#387ed1] tnum">
                {formatINR(activeHoverItem.stocks_value || 0)}
              </span>
            </div>

            {/* Fixed Deposits Breakdown */}
            <div className="flex justify-between items-center text-[10.5px]">
              <span className="flex items-center gap-1 text-[var(--text-secondary)]">
                <span className="w-2 h-2 rounded-full bg-[#f59e0b]" />
                Fixed Deposits
              </span>
              <span className="font-bold text-[#f59e0b] tnum">
                {formatINR(activeHoverItem.fd_value || 0)}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
