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
  const paddingLeft = 60;
  const paddingBottom = 50;
  const paddingTop = 20;

  const totalWidth = paddingLeft + portfolios.length * (2 * barWidth + gap + groupGap) + 20;

  const yTicks = 5;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm p-5">
      <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1">Invested vs Current Value</h3>
      <p className="text-xs text-slate-400 dark:text-slate-500 mb-4">Portfolio comparison</p>

      <div className="overflow-x-auto">
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
                <line x1={paddingLeft - 8} y1={y} x2={paddingLeft + totalWidth - paddingLeft - 20} y2={y} stroke="#f1f5f9" strokeWidth={1} className="dark:stroke-slate-700" />
                <text x={paddingLeft - 12} y={y + 4} textAnchor="end" className="fill-slate-400 dark:fill-slate-500" fontSize={9}>
                  {val >= 1000000 ? `${(val / 100000).toFixed(0)}L` : val >= 1000 ? `${(val / 1000).toFixed(0)}K` : val.toFixed(0)}
                </text>
              </g>
            );
          })}

          <line x1={paddingLeft} y1={paddingTop} x2={paddingLeft} y2={paddingTop + chartHeight} className="stroke-slate-200 dark:stroke-slate-600" strokeWidth={1} />
          <line x1={paddingLeft} y1={paddingTop + chartHeight} x2={totalWidth - 10} y2={paddingTop + chartHeight} className="stroke-slate-200 dark:stroke-slate-600" strokeWidth={1} />

          {portfolios.map((p, pi) => {
            const groupX = paddingLeft + pi * (2 * barWidth + gap + groupGap);
            const investedH = (p.totalInvested / maxVal) * chartHeight;
            const currentH = (p.totalCurrentValue / maxVal) * chartHeight;
            const isGain = p.totalCurrentValue >= p.totalInvested;

            const iInvested = hovered?.portfolioIdx === pi && hovered.type === 'invested';
            const iCurrent = hovered?.portfolioIdx === pi && hovered.type === 'current';

            return (
              <g key={pi}>
                <rect
                  x={groupX}
                  y={paddingTop + chartHeight - investedH - (iInvested ? 2 : 0)}
                  width={barWidth}
                  height={investedH + (iInvested ? 2 : 0)}
                  rx={4}
                  fill={iInvested ? '#94a3b8' : '#cbd5e1'}
                  className="cursor-pointer transition-all duration-150"
                  onMouseEnter={() => setHovered({ portfolioIdx: pi, type: 'invested' })}
                  onMouseLeave={() => setHovered(null)}
                />
                {iInvested && (
                  <text
                    x={groupX + barWidth / 2}
                    y={paddingTop + chartHeight - investedH - 6}
                    textAnchor="middle"
                    className="fill-slate-600 dark:fill-slate-300"
                    fontSize={9}
                    fontWeight={600}
                  >
                    {formatINR(p.totalInvested)}
                  </text>
                )}

                <rect
                  x={groupX + barWidth + gap}
                  y={paddingTop + chartHeight - currentH - (iCurrent ? 2 : 0)}
                  width={barWidth}
                  height={currentH + (iCurrent ? 2 : 0)}
                  rx={4}
                  fill={iCurrent ? (isGain ? '#059669' : '#dc2626') : (isGain ? '#10b981' : '#f87171')}
                  className="cursor-pointer transition-all duration-150"
                  onMouseEnter={() => setHovered({ portfolioIdx: pi, type: 'current' })}
                  onMouseLeave={() => setHovered(null)}
                />
                {iCurrent && (
                  <text
                    x={groupX + barWidth + gap + barWidth / 2}
                    y={paddingTop + chartHeight - currentH - 6}
                    textAnchor="middle"
                    fill={isGain ? '#065f46' : '#991b1b'}
                    fontSize={9}
                    fontWeight={600}
                  >
                    {formatINR(p.totalCurrentValue)}
                  </text>
                )}

                <text
                  x={groupX + barWidth + gap / 2}
                  y={paddingTop + chartHeight + 16}
                  textAnchor="middle"
                  className="fill-slate-600 dark:fill-slate-300"
                  fontSize={10}
                  fontWeight={600}
                >
                  {p.label.replace("'s Portfolio", '').replace(' Portfolio', '')}
                </text>
                <text
                  x={groupX + barWidth + gap / 2}
                  y={paddingTop + chartHeight + 30}
                  textAnchor="middle"
                  fill={isGain ? '#059669' : '#dc2626'}
                  fontSize={9}
                >
                  {isGain ? '+' : ''}{p.totalPnLPercent.toFixed(1)}%
                </text>
              </g>
            );
          })}

          <g>
            <rect x={paddingLeft + 4} y={paddingTop - 18} width={10} height={10} rx={2} fill="#cbd5e1" />
            <text x={paddingLeft + 18} y={paddingTop - 9} className="fill-slate-500 dark:fill-slate-400" fontSize={10}>Invested</text>
            <rect x={paddingLeft + 72} y={paddingTop - 18} width={10} height={10} rx={2} fill="#10b981" />
            <text x={paddingLeft + 86} y={paddingTop - 9} className="fill-slate-500 dark:fill-slate-400" fontSize={10}>Current Value</text>
          </g>
        </svg>
      </div>
    </div>
  );
}

export default React.memo(BarChart);
