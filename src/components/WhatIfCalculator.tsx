import { useState, useMemo, useEffect, useRef } from 'react';
import { formatINRCompact, formatINR } from '../utils/formatters';

interface ProjectionPoint {
  year: number;
  invested: number;
  futureValue: number;
  wealthGain: number;
}

export default function WhatIfCalculator() {
  const [calcMode, setCalcMode] = useState<'sip' | 'lumpsum'>('sip');
  const [investment, setInvestment] = useState<number>(10000); // Monthly SIP or Lumpsum
  const [rate, setRate] = useState<number>(12); // Expected Return p.a.
  const [duration, setDuration] = useState<number>(15); // Years

  // Resize tracking for SVG
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 600, height: 260 });
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

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
          height: 260,
        }));
      }, 100);
    });
    resizeObserver.observe(containerRef.current);
    return () => {
      resizeObserver.disconnect();
      if (timeoutId) window.clearTimeout(timeoutId);
    };
  }, []);

  // Compute projection points for each year
  const points = useMemo<ProjectionPoint[]>(() => {
    const list: ProjectionPoint[] = [];
    const monthlyRate = rate / 12 / 100;

    for (let y = 0; y <= duration; y++) {
      let invested = 0;
      let fv = 0;

      if (y === 0) {
        invested = calcMode === 'sip' ? 0 : investment;
        fv = calcMode === 'sip' ? 0 : investment;
      } else if (calcMode === 'sip') {
        invested = investment * y * 12;
        if (rate === 0) {
          fv = invested;
        } else {
          const totalMonths = y * 12;
          fv = investment * ((Math.pow(1 + monthlyRate, totalMonths) - 1) / monthlyRate) * (1 + monthlyRate);
        }
      } else {
        // Lumpsum
        invested = investment;
        fv = investment * Math.pow(1 + rate / 100, y);
      }

      list.push({
        year: y,
        invested: Math.round(invested),
        futureValue: Math.round(fv),
        wealthGain: Math.max(0, Math.round(fv - invested)),
      });
    }
    return list;
  }, [calcMode, investment, rate, duration]);

  // Current selected totals at the end of the duration
  const totals = useMemo(() => {
    if (points.length === 0) return { invested: 0, futureValue: 0, wealthGain: 0 };
    return points[points.length - 1];
  }, [points]);

  // Chart layout parameters
  const { width, height } = dimensions;
  const paddingLeft = 65;
  const paddingRight = 20;
  const paddingTop = 25;
  const paddingBottom = 40;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  // Max value for scaling
  const maxChartVal = useMemo(() => {
    if (points.length === 0) return 1000;
    const maxVal = Math.max(...points.map((p) => p.futureValue));
    return maxVal > 0 ? maxVal * 1.05 : 1000; // 5% padding
  }, [points]);

  // Precalculate point SVG coordinates
  const svgPoints = useMemo(() => {
    return points.map((p, idx) => {
      let x = paddingLeft;
      if (points.length > 1) {
        x = paddingLeft + (idx / (points.length - 1)) * chartWidth;
      }
      const investedY = paddingTop + chartHeight - (p.invested / maxChartVal) * chartHeight;
      const fvY = paddingTop + chartHeight - (p.futureValue / maxChartVal) * chartHeight;

      return {
        x,
        investedY,
        fvY,
        ...p,
      };
    });
  }, [points, maxChartVal, chartWidth, chartHeight]);

  // SVG Paths
  const paths = useMemo(() => {
    if (svgPoints.length === 0) return { investedLine: '', fvLine: '', wealthArea: '', investedArea: '' };

    const investedLine = svgPoints
      .map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x} ${p.investedY}`)
      .join(' ');

    const fvLine = svgPoints
      .map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x} ${p.fvY}`)
      .join(' ');

    // Wealth Area: between fvLine (top) and investedLine (bottom)
    const fvPart = svgPoints.map((p) => `L ${p.x} ${p.fvY}`).join(' ');
    const investedPartReverse = [...svgPoints]
      .reverse()
      .map((p) => `L ${p.x} ${p.investedY}`)
      .join(' ');
    
    // SVG area path starts at (firstX, firstInvestedY), traces up to firstFvY, sweeps to lastFvY, down to lastInvestedY, and sweeps back in reverse along invested line to close
    const wealthArea = `M ${svgPoints[0].x} ${svgPoints[0].investedY} ${fvPart} ${investedPartReverse} Z`;

    // Invested Area: between investedLine and bottom axis
    const investedArea = `M ${svgPoints[0].x} ${paddingTop + chartHeight} L ${svgPoints.map(p => `${p.x} ${p.investedY}`).join(' L ')} L ${svgPoints[svgPoints.length - 1].x} ${paddingTop + chartHeight} Z`;

    return { investedLine, fvLine, wealthArea, investedArea };
  }, [svgPoints, chartHeight]);

  // Horizontal ticks
  const yTicks = useMemo(() => {
    const count = 4;
    return Array.from({ length: count }).map((_, i) => {
      const val = (i / (count - 1)) * maxChartVal;
      const y = paddingTop + chartHeight - (val / maxChartVal) * chartHeight;
      return {
        y,
        label: formatINRCompact(val),
      };
    });
  }, [maxChartVal, chartHeight]);

  // X-axis ticks (spaced years)
  const xTicks = useMemo(() => {
    const list: number[] = [];
    const step = Math.max(1, Math.round(duration / 5));
    for (let i = 0; i <= duration; i += step) {
      list.push(i);
    }
    if (list[list.length - 1] !== duration) {
      list.push(duration);
    }
    return list;
  }, [duration]);

  const hoverPoint = hoveredIdx !== null ? svgPoints[hoveredIdx] : null;

  return (
    <div className="space-y-6 animate-tab-transition">
      {/* Overview header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            What-If Investment Calculator
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Simulate and visualize wealth accumulation over time with compound interest.
          </p>
        </div>

        {/* Mode Toggles */}
        <div className="flex bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200/50 dark:border-slate-700/50 self-start md:self-auto shadow-inner">
          <button
            onClick={() => {
              setCalcMode('sip');
              if (investment > 500000) setInvestment(50000); // clamp for SIP mode
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              calcMode === 'sip'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            Monthly SIP
          </button>
          <button
            onClick={() => setCalcMode('lumpsum')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              calcMode === 'lumpsum'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            One-time Lumpsum
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Sliders Form Column */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900/40 backdrop-blur-md border border-slate-200/60 dark:border-slate-800/60 rounded-2xl p-5 md:p-6 shadow-xl space-y-6">
          <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
            Investment Parameters
          </h3>

          {/* Slider 1: Investment Amount */}
          <div className="space-y-2.5">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-slate-600 dark:text-slate-400">
                {calcMode === 'sip' ? 'Monthly SIP Amount' : 'One-time Investment'}
              </span>
              <span className="font-extrabold text-blue-600 dark:text-blue-400 text-sm">
                {formatINR(investment)}
              </span>
            </div>
            <input
              type="range"
              min={calcMode === 'sip' ? 500 : 5000}
              max={calcMode === 'sip' ? 200000 : 10000000}
              step={calcMode === 'sip' ? 500 : 5000}
              value={investment}
              onChange={(e) => setInvestment(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-600 dark:accent-blue-400"
              aria-label={calcMode === 'sip' ? 'Monthly SIP Amount' : 'One-time Investment'}
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-bold">
              <span>{calcMode === 'sip' ? '₹500' : '₹5k'}</span>
              <span>{calcMode === 'sip' ? '₹2L' : '₹1Cr'}</span>
            </div>
          </div>

          {/* Slider 2: Rate of Return */}
          <div className="space-y-2.5">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-slate-600 dark:text-slate-400">Expected Annual Return</span>
              <span className="font-extrabold text-emerald-600 dark:text-emerald-400 text-sm">
                {rate}% p.a.
              </span>
            </div>
            <input
              type="range"
              min="1"
              max="30"
              step="0.5"
              value={rate}
              onChange={(e) => setRate(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-600 dark:accent-emerald-400"
              aria-label="Expected Annual Return"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-bold">
              <span>1%</span>
              <span>30%</span>
            </div>
          </div>

          {/* Slider 3: Duration */}
          <div className="space-y-2.5">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-slate-600 dark:text-slate-400">Duration Period</span>
              <span className="font-extrabold text-indigo-600 dark:text-indigo-400 text-sm">
                {duration} Years
              </span>
            </div>
            <input
              type="range"
              min="1"
              max="40"
              step="1"
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600 dark:accent-indigo-400"
              aria-label="Duration Period"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-bold">
              <span>1 Year</span>
              <span>40 Years</span>
            </div>
          </div>
        </div>

        {/* Results Metrics & SVG Chart Column */}
        <div className="lg:col-span-7 space-y-6">
          {/* Summary Metric Cards */}
          <div className="grid grid-cols-3 gap-3">
            {/* Total Invested */}
            <div className="bg-white dark:bg-slate-900/30 border border-slate-200/50 dark:border-slate-800/50 rounded-2xl p-3 shadow-md">
              <span className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                Total Invested
              </span>
              <span className="text-sm md:text-base font-extrabold text-slate-700 dark:text-slate-200 mt-1 block tracking-tight">
                {formatINR(totals.invested)}
              </span>
            </div>

            {/* Wealth Gain */}
            <div className="bg-white dark:bg-slate-900/30 border border-slate-200/50 dark:border-slate-800/50 rounded-2xl p-3 shadow-md">
              <span className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                Wealth Gain
              </span>
              <span className="text-sm md:text-base font-extrabold text-emerald-600 dark:text-emerald-400 mt-1 block tracking-tight">
                {formatINR(totals.wealthGain)}
              </span>
            </div>

            {/* Future Value */}
            <div className="bg-blue-600/5 dark:bg-blue-500/5 border border-blue-500/20 rounded-2xl p-3 shadow-md">
              <span className="text-[10px] font-extrabold text-blue-600/80 dark:text-blue-400/80 uppercase tracking-wider block">
                Future Value
              </span>
              <span className="text-sm md:text-base font-extrabold text-blue-600 dark:text-blue-400 mt-1 block tracking-tight">
                {formatINR(totals.futureValue)}
              </span>
            </div>
          </div>

          {/* SVG Chart Container */}
          <div
            ref={containerRef}
            className="bg-white dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-800/60 rounded-2xl p-5 shadow-xl relative overflow-hidden"
          >
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                Growth Projection Curve
              </h4>
              {/* Legend */}
              <div className="flex items-center gap-3 text-[10px] font-bold text-slate-400">
                <div className="flex items-center gap-1">
                  <span className="w-2.5 h-1.5 rounded bg-blue-500 inline-block" />
                  <span>Invested</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-2.5 h-1.5 rounded bg-emerald-500 inline-block" />
                  <span>Wealth</span>
                </div>
              </div>
            </div>

            <div className="relative w-full h-[260px]">
              <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full">
                <defs>
                  {/* Gradients */}
                  <linearGradient id="calcWealthGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                  </linearGradient>
                  <linearGradient id="calcInvestGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.15" />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Y-axis grids */}
                {yTicks.map((tick, idx) => (
                  <g key={idx}>
                    <line
                      x1={paddingLeft}
                      y1={tick.y}
                      x2={width - paddingRight}
                      y2={tick.y}
                      className="stroke-slate-100 dark:stroke-slate-800/60"
                      strokeWidth={1}
                      strokeDasharray="4 4"
                    />
                    <text
                      x={paddingLeft - 8}
                      y={tick.y + 3}
                      textAnchor="end"
                      className="fill-slate-400 dark:fill-slate-500 font-bold"
                      fontSize={8.5}
                    >
                      {tick.label}
                    </text>
                  </g>
                ))}

                {/* X-axis labels */}
                {xTicks.map((yVal, idx) => {
                  const pIdx = points.findIndex((pt) => pt.year === yVal);
                  if (pIdx === -1) return null;
                  const pt = svgPoints[pIdx];
                  return (
                    <g key={idx}>
                      <line
                        x1={pt.x}
                        y1={paddingTop}
                        x2={pt.x}
                        y2={height - paddingBottom}
                        className="stroke-slate-100 dark:stroke-slate-800/30"
                        strokeWidth={1}
                        strokeDasharray="2 2"
                      />
                      <text
                        x={pt.x}
                        y={height - paddingBottom + 16}
                        textAnchor="middle"
                        className="fill-slate-400 dark:fill-slate-500 font-semibold"
                        fontSize={8.5}
                      >
                        Yr {yVal}
                      </text>
                    </g>
                  );
                })}

                {/* Shaded Areas */}
                <path d={paths.wealthArea} fill="url(#calcWealthGrad)" />
                <path d={paths.investedArea} fill="url(#calcInvestGrad)" />

                {/* Trend Lines */}
                <path
                  d={paths.investedLine}
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d={paths.fvLine}
                  fill="none"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Vertical hover marker line */}
                {hoverPoint && (
                  <line
                    x1={hoverPoint.x}
                    y1={paddingTop}
                    x2={hoverPoint.x}
                    y2={height - paddingBottom}
                    className="stroke-slate-300 dark:stroke-slate-700"
                    strokeWidth={1.5}
                  />
                )}

                {/* Clickable/hoverable point circles */}
                {svgPoints.map((pt, idx) => (
                  <circle
                    key={idx}
                    cx={pt.x}
                    cy={pt.fvY}
                    r={hoveredIdx === idx ? 6 : 4}
                    className={`cursor-pointer transition-all ${
                      hoveredIdx === idx
                        ? 'fill-emerald-500 stroke-white dark:stroke-slate-900'
                        : 'fill-transparent hover:fill-emerald-500/20'
                    }`}
                    strokeWidth={hoveredIdx === idx ? 2 : 0}
                    onMouseEnter={() => setHoveredIdx(idx)}
                    onMouseLeave={() => setHoveredIdx(null)}
                  />
                ))}
              </svg>

              {/* Hover Tooltip Details */}
              {hoverPoint && (
                <div
                  className="absolute bg-slate-950/95 text-white p-3 rounded-xl border border-slate-800 shadow-2xl z-[150] text-[10px] pointer-events-none transform -translate-x-1/2 -translate-y-full flex flex-col gap-1 w-40"
                  style={{
                    left: `${(hoverPoint.x / width) * 100}%`,
                    top: `${(hoverPoint.fvY / height) * 100 - 6}%`,
                  }}
                >
                  <p className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wider border-b border-slate-800 pb-1">
                    Year {hoverPoint.year}
                  </p>
                  <div className="flex justify-between mt-1">
                    <span className="text-slate-400">Invested:</span>
                    <span className="font-bold text-blue-400">{formatINR(hoverPoint.invested)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Est. Returns:</span>
                    <span className="font-bold text-emerald-400">{formatINR(hoverPoint.wealthGain)}</span>
                  </div>
                  <div className="flex justify-between font-extrabold border-t border-slate-800/80 pt-1 mt-0.5 text-xs">
                    <span>Future Val:</span>
                    <span className="text-blue-300">{formatINR(hoverPoint.futureValue)}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
