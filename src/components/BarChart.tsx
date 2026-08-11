import React, { useState } from 'react';
import { Portfolio } from '../types/portfolio';
import { formatINR } from '../utils/formatters';

interface BarChartProps {
  portfolios: Portfolio[];
}

function BarChart({ portfolios }: BarChartProps) {
  const [hovered, setHovered] = useState<{ portfolioIdx: number; type: 'invested' | 'current' } | null>(null);

  const maxVal = Math.max(
    ...portfolios.map((p) => Math.max(p.totalInvested, p.totalCurrentValue))
  );

  const chartHeight = 200;
  const barWidth = 32;
  const gap = 16;
  const groupGap = 40;
  const paddingLeft = 55;
  const paddingBottom = 50;
  const paddingTop = 20;

  const totalWidth = paddingLeft + portfolios.length * (2 * barWidth + gap + groupGap) + 20;

  const yTicks = 5;

  return (
    <div className="apple-card p-5 flex flex-col h-[370px] justify-between">
      <h3 className="text-card-title font-semibold text-slate-800 dark:text-slate-200">Invested vs Current Value</h3>
      <p className="text-supporting mt-0.5 mb-4">Portfolio comparison</p>

      <div className="overflow-x-auto scrollbar-none">
        <svg
          width={Math.max(totalWidth, 360)}
          height={chartHeight + paddingBottom + paddingTop}
          className="overflow-visible"
          role="img"
          aria-label={`Bar chart comparing invested vs current value across ${portfolios.length} portfolios`}
        >
          <title>Invested vs Current Value</title>
          {Array.from({ length: yTicks + 1 }).map((_, i) => {
            const val = (maxVal / yTicks) * i;
            const y = paddingTop + chartHeight - (val / maxVal) * chartHeight;
            return (
              <g key={i}>
                <line x1={paddingLeft - 8} y1={y} x2={paddingLeft + totalWidth - paddingLeft - 20} y2={y} stroke="" strokeWidth={1} className="stroke-slate-100 dark:stroke-slate-800/50" />
                <text x={paddingLeft - 12} y={y + 4} textAnchor="end" className="fill-slate-400 dark:fill-slate-500 font-medium" fontSize={9}>
                  {val >= 10000000 ? `₹${(val / 10000000).toFixed(0)}Cr` : val >= 100000 ? `₹${(val / 100000).toFixed(0)}L` : val >= 1000 ? `₹${(val / 1000).toFixed(0)}K` : `₹${val.toFixed(0)}`}
                </text>
              </g>
            );
          })}

          <line x1={paddingLeft} y1={paddingTop} x2={paddingLeft} y2={paddingTop + chartHeight} className="stroke-slate-200 dark:stroke-slate-700/60" strokeWidth={1} />
          <line x1={paddingLeft} y1={paddingTop + chartHeight} x2={totalWidth - 10} y2={paddingTop + chartHeight} className="stroke-slate-200 dark:stroke-slate-700/60" strokeWidth={1} />

          {portfolios.map((p, pi) => {
            const groupX = paddingLeft + pi * (2 * barWidth + gap + groupGap);
            const investedH = (p.totalInvested / maxVal) * chartHeight;
            const currentH = (p.totalCurrentValue / maxVal) * chartHeight;
            const isGain = p.totalCurrentValue >= p.totalInvested;

            const iInvested = hovered?.portfolioIdx === pi && hovered.type === 'invested';
            const iCurrent = hovered?.portfolioIdx === pi && hovered.type === 'current';

            return (
              <g key={pi}>
                {/* Invested Bar (Quiet gray/slate) */}
                <rect
                  x={groupX}
                  y={paddingTop + chartHeight - investedH - (iInvested ? 1 : 0)}
                  width={barWidth}
                  height={investedH + (iInvested ? 1 : 0)}
                  rx={4}
                  className={`cursor-pointer transition-all duration-150 ${
                    iInvested ? 'fill-[#6e6e73]' : 'fill-[#8e8e93]'
                  }`}
                  onMouseEnter={() => setHovered({ portfolioIdx: pi, type: 'invested' })}
                  onMouseLeave={() => setHovered(null)}
                />
                {iInvested && (
                  <text
                    x={groupX + barWidth / 2}
                    y={paddingTop + chartHeight - investedH - 6}
                    textAnchor="middle"
                    className="fill-slate-700 dark:fill-slate-300 font-bold tnum animate-fade-in"
                    fontSize={9}
                  >
                    {formatINR(p.totalInvested)}
                  </text>
                )}

                {/* Current Value Bar (Green/Red depending on gains) */}
                <rect
                  x={groupX + barWidth + gap}
                  y={paddingTop + chartHeight - currentH - (iCurrent ? 1 : 0)}
                  width={barWidth}
                  height={currentH + (iCurrent ? 1 : 0)}
                  rx={4}
                  className={`cursor-pointer transition-all duration-150 ${
                    iCurrent
                      ? isGain
                        ? 'fill-emerald-700'
                        : 'fill-rose-700'
                      : isGain
                      ? 'fill-emerald-500 dark:fill-emerald-400'
                      : 'fill-rose-500 dark:fill-rose-400'
                  }`}
                  onMouseEnter={() => setHovered({ portfolioIdx: pi, type: 'current' })}
                  onMouseLeave={() => setHovered(null)}
                />
                {iCurrent && (
                  <text
                    x={groupX + barWidth + gap + barWidth / 2}
                    y={paddingTop + chartHeight - currentH - 6}
                    textAnchor="middle"
                    className={`font-bold tnum animate-fade-in ${isGain ? 'fill-emerald-600 dark:fill-emerald-400' : 'fill-rose-600 dark:fill-rose-400'}`}
                    fontSize={9}
                  >
                    {formatINR(p.totalCurrentValue)}
                  </text>
                )}

                {/* Label X-axis */}
                <text
                  x={groupX + barWidth + gap / 2}
                  y={paddingTop + chartHeight + 16}
                  textAnchor="middle"
                  className="fill-slate-700 dark:fill-slate-350 font-semibold"
                  fontSize={10}
                >
                  {p.label.replace("'s Portfolio", '').replace(' Portfolio', '')}
                </text>
                <text
                  x={groupX + barWidth + gap / 2}
                  y={paddingTop + chartHeight + 30}
                  textAnchor="middle"
                  className={`font-bold tnum ${isGain ? 'fill-emerald-600 dark:fill-emerald-400' : 'fill-rose-600 dark:fill-rose-400'}`}
                  fontSize={9}
                >
                  {p.totalPnLPercent >= 0 ? '+' : ''}{p.totalPnLPercent.toFixed(1)}%
                </text>
              </g>
            );
          })}

          {/* Legend */}
          <g>
            <rect x={paddingLeft + 4} y={paddingTop - 18} width={10} height={10} rx={2} fill="#64748b" />
            <text x={paddingLeft + 18} y={paddingTop - 9} className="fill-slate-500 font-medium" fontSize={10}>Invested</text>
            <rect x={paddingLeft + 72} y={paddingTop - 18} width={10} height={10} rx={2} fill="#16a34a" />
            <text x={paddingLeft + 86} y={paddingTop - 9} className="fill-slate-500 font-medium" fontSize={10}>Current Value</text>
          </g>
        </svg>
      </div>
    </div>
  );
}

export default React.memo(BarChart);
