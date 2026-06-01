import React, { useState } from 'react';
import { NetWorthSnapshot } from '../hooks/usePortfolioData';
import { formatINR } from '../utils/formatters';

interface NetWorthChartProps {
  history: NetWorthSnapshot[];
}

export default React.memo(function NetWorthChart({ history }: NetWorthChartProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  if (!history || history.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm p-6 flex flex-col justify-center items-center h-64 text-center">
        <p className="text-sm font-semibold text-slate-400 dark:text-slate-500">No Historical Data Available</p>
        <p className="text-xs text-slate-300 dark:text-slate-500 mt-1">Daily net worth tracking snapshots will accumulate on dashboard load.</p>
      </div>
    );
  }

  // Chart config
  const chartHeight = 200;
  const paddingLeft = 50;
  const paddingRight = 20;
  const paddingTop = 25;
  const paddingBottom = 40;

  const width = 640;
  const height = chartHeight + paddingTop + paddingBottom;

  // Compute values for scaling
  const maxVal = Math.max(...history.map((d) => d.total_value), 10000);
  const minVal = Math.min(...history.map((d) => Math.min(d.total_value, d.stocks_value, d.fd_value, d.gold_value, d.real_estate_value)), 0);

  // To give some margin above max value:
  const yMax = maxVal * 1.1;
  const yRange = yMax - minVal;

  const getX = (index: number) => {
    if (history.length <= 1) return paddingLeft + (width - paddingLeft - paddingRight) / 2;
    return paddingLeft + (index / (history.length - 1)) * (width - paddingLeft - paddingRight);
  };

  const getY = (val: number) => {
    return paddingTop + chartHeight - ((val - minVal) / yRange) * chartHeight;
  };

  const buildPath = (key: keyof Omit<NetWorthSnapshot, 'id' | 'snapshot_date'>) => {
    return history.map((d, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(Number(d[key]))}`).join(' ');
  };

  const buildAreaPath = (key: keyof Omit<NetWorthSnapshot, 'id' | 'snapshot_date'>) => {
    const linePath = buildPath(key);
    if (!linePath) return '';
    const startX = getX(0);
    const endX = getX(history.length - 1);
    const bottomY = getY(minVal);
    return `${linePath} L ${endX} ${bottomY} L ${startX} ${bottomY} Z`;
  };

  const hoveredData = hoveredIdx !== null ? history[hoveredIdx] : null;

  return (
    <div
      role="region"
      aria-label="Historical Net Worth Chart"
      className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm p-5 space-y-4"
    >
      <div className="flex justify-between items-center flex-wrap gap-2">
        <div>
          <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-200 uppercase tracking-wider mb-0.5">Historical Net Worth</h3>
          <p className="text-xs text-slate-400 dark:text-slate-500">Total wealth growth and asset breakdown</p>
        </div>

        {hoveredData ? (
          <div className="text-right">
            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold uppercase">{new Date(hoveredData.snapshot_date).toLocaleDateString('en-IN', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
            <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{formatINR(hoveredData.total_value)}</p>
          </div>
        ) : (
          <div className="text-right">
            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold uppercase">Current Net Worth</p>
            <p className="text-sm font-bold text-blue-600 dark:text-blue-450">{formatINR(history[history.length - 1].total_value)}</p>
          </div>
        )}
      </div>

      <div className="relative overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          width="100%"
          height="100%"
          className="min-w-[500px] overflow-visible"
          role="img"
          aria-label="Line chart showing historical net worth and asset allocations over time."
        >
          <title>Historical Net Worth Trend</title>
          <defs>
            {/* Gradients */}
            <linearGradient id="totalGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {Array.from({ length: 5 }).map((_, i) => {
            const val = minVal + (yRange / 4) * i;
            const y = getY(val);
            return (
              <g key={i}>
                <line x1={paddingLeft} y1={y} x2={width - paddingRight} y2={y} className="stroke-slate-100 dark:stroke-slate-700" strokeWidth={1} />
                <text x={paddingLeft - 10} y={y + 3} textAnchor="end" className="fill-slate-400 dark:fill-slate-500" fontSize={9} fontWeight={500}>
                  {val >= 10000000 ? `${(val / 10000000).toFixed(1)}Cr` : val >= 100000 ? `${(val / 100000).toFixed(0)}L` : val >= 1000 ? `${(val / 1000).toFixed(0)}K` : val.toFixed(0)}
                </text>
              </g>
            );
          })}

          {/* X axis labels */}
          {history.map((d, i) => {
            // Only show labels for first, middle, last, or every few if history grows
            const shouldShowLabel = history.length <= 6 || i === 0 || i === history.length - 1 || i === Math.floor(history.length / 2) || i % Math.ceil(history.length / 5) === 0;
            if (!shouldShowLabel) return null;
            return (
              <text key={i} x={getX(i)} y={paddingTop + chartHeight + 18} textAnchor="middle" className="fill-slate-400 dark:fill-slate-500" fontSize={9} fontWeight={500}>
                {new Date(d.snapshot_date).toLocaleDateString('en-IN', { month: 'short', year: '2-digit' })}
              </text>
            );
          })}

          {/* Areas */}
          {history.length > 1 && (
            <path d={buildAreaPath('total_value')} fill="url(#totalGrad)" />
          )}

          {/* Lines */}
          {history.length > 1 && (
            <>
              {/* Asset Class Lines */}
              <path d={buildPath('stocks_value')} fill="none" stroke="#60a5fa" strokeWidth={1.5} strokeDasharray="3 3" opacity={0.7} />
              <path d={buildPath('fd_value')} fill="none" stroke="#818cf8" strokeWidth={1.5} strokeDasharray="3 3" opacity={0.7} />
              <path d={buildPath('gold_value')} fill="none" stroke="#fbbf24" strokeWidth={1.5} strokeDasharray="3 3" opacity={0.7} />
              <path d={buildPath('real_estate_value')} fill="none" stroke="#34d399" strokeWidth={1.5} strokeDasharray="3 3" opacity={0.7} />

              {/* Total line */}
              <path d={buildPath('total_value')} fill="none" stroke="#3b82f6" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
            </>
          )}

          {/* Hover interaction points */}
          {history.map((d, i) => {
            const x = getX(i);
            const totalY = getY(d.total_value);

            return (
              <g key={i}>
                {/* Invisible hover capture bar */}
                <rect
                  x={x - (width - paddingLeft - paddingRight) / (history.length * 2)}
                  y={paddingTop}
                  width={(width - paddingLeft - paddingRight) / history.length}
                  height={chartHeight}
                  fill="transparent"
                  className="cursor-pointer"
                  onMouseEnter={() => setHoveredIdx(i)}
                  onMouseLeave={() => setHoveredIdx(null)}
                />

                {hoveredIdx === i && (
                  <>
                    <line x1={x} y1={paddingTop} x2={x} y2={paddingTop + chartHeight} stroke="#3b82f6" strokeWidth={1.5} strokeDasharray="4 4" />

                    {/* Active values circles */}
                    <circle cx={x} cy={totalY} r={6} fill="#3b82f6" stroke="#ffffff" strokeWidth={2} />
                    <circle cx={x} cy={getY(d.stocks_value)} r={4} fill="#60a5fa" stroke="#ffffff" strokeWidth={1.5} />
                    <circle cx={x} cy={getY(d.fd_value)} r={4} fill="#818cf8" stroke="#ffffff" strokeWidth={1.5} />
                    <circle cx={x} cy={getY(d.gold_value)} r={4} fill="#fbbf24" stroke="#ffffff" strokeWidth={1.5} />
                    <circle cx={x} cy={getY(d.real_estate_value)} r={4} fill="#34d399" stroke="#ffffff" strokeWidth={1.5} />
                  </>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Legend & Breakdown values */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2 text-xs">
        <div className="flex items-center gap-2 border border-slate-100 dark:border-slate-700 rounded-xl p-2 bg-slate-50/50 dark:bg-slate-700/30">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shrink-0" />
          <div className="min-w-0">
            <p className="text-[9px] text-slate-400 dark:text-slate-550 font-semibold uppercase truncate">Total</p>
            <p className="font-bold text-slate-700 dark:text-slate-200 truncate">
              {hoveredData ? formatINR(hoveredData.total_value) : formatINR(history[history.length - 1].total_value)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 border border-slate-100 dark:border-slate-700 rounded-xl p-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#60a5fa] shrink-0" />
          <div className="min-w-0">
            <p className="text-[9px] text-slate-400 dark:text-slate-550 font-semibold uppercase truncate">Stocks</p>
            <p className="font-bold text-slate-700 dark:text-slate-200 truncate">
              {hoveredData ? formatINR(hoveredData.stocks_value) : formatINR(history[history.length - 1].stocks_value)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 border border-slate-100 dark:border-slate-700 rounded-xl p-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#818cf8] shrink-0" />
          <div className="min-w-0">
            <p className="text-[9px] text-slate-400 dark:text-slate-550 font-semibold uppercase truncate">FDs</p>
            <p className="font-bold text-slate-700 dark:text-slate-200 truncate">
              {hoveredData ? formatINR(hoveredData.fd_value) : formatINR(history[history.length - 1].fd_value)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 border border-slate-100 dark:border-slate-700 rounded-xl p-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#fbbf24] shrink-0" />
          <div className="min-w-0">
            <p className="text-[9px] text-slate-400 dark:text-slate-550 font-semibold uppercase truncate">Gold</p>
            <p className="font-bold text-slate-700 dark:text-slate-200 truncate">
              {hoveredData ? formatINR(hoveredData.gold_value) : formatINR(history[history.length - 1].gold_value)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 border border-slate-100 dark:border-slate-700 rounded-xl p-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#34d399] shrink-0" />
          <div className="min-w-0">
            <p className="text-[9px] text-slate-400 dark:text-slate-550 font-semibold uppercase truncate">Realty</p>
            <p className="font-bold text-slate-700 dark:text-slate-200 truncate">
              {hoveredData ? formatINR(hoveredData.real_estate_value) : formatINR(history[history.length - 1].real_estate_value)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
});
