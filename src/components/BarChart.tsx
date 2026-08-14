import React, { useState, useMemo } from 'react';
import { Portfolio } from '../types/portfolio';
import { formatINR } from '../utils/formatters';
import { usePrivacy } from '../contexts/PrivacyContext';
import { SegmentedControl } from './ui/SegmentedControl';
import { BarChart3, Layers } from './icons/AppIcons';

interface BarChartProps {
  portfolios: Portfolio[];
}

type ViewMode = 'grouped' | 'returns' | 'breakdown';

function BarChart({ portfolios }: BarChartProps) {
  const [mode, setMode] = useState<ViewMode>('grouped');
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const { isBalancesHidden } = usePrivacy();

  // Filter out any empty portfolios
  const validPortfolios = useMemo(() => {
    return (portfolios || []).filter((p) => p.totalInvested > 0 || p.totalCurrentValue > 0);
  }, [portfolios]);

  // Overall family aggregated metrics
  const aggregate = useMemo(() => {
    const totalInv = validPortfolios.reduce((s, p) => s + p.totalInvested, 0);
    const totalVal = validPortfolios.reduce((s, p) => s + p.totalCurrentValue, 0);
    const diff = totalVal - totalInv;
    const pct = totalInv > 0 ? (diff / totalInv) * 100 : 0;
    return { totalInv, totalVal, diff, pct };
  }, [validPortfolios]);

  // Max value for absolute scaling
  const maxVal = useMemo(() => {
    if (validPortfolios.length === 0) return 1;
    const highest = Math.max(
      ...validPortfolios.map((p) => Math.max(p.totalInvested, p.totalCurrentValue, 1))
    );
    // 15% headroom so bars and values don't touch the top gridline
    return highest * 1.15;
  }, [validPortfolios]);

  // Max absolute return % for returns mode
  const maxAbsReturn = useMemo(() => {
    if (validPortfolios.length === 0) return 10;
    const highest = Math.max(...validPortfolios.map((p) => Math.abs(p.totalPnLPercent)), 5);
    return Math.ceil(highest * 1.2);
  }, [validPortfolios]);

  if (!validPortfolios || validPortfolios.length === 0) {
    return (
      <div className="apple-card p-4 sm:p-5 flex flex-col h-[370px] justify-between">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-card-title font-bold text-[var(--text-primary)]">Invested vs Current Value</h3>
            <p className="text-supporting text-xs mt-0.5">Portfolio comparison</p>
          </div>
          <div className="w-7 h-7 rounded-[var(--radius-small)] bg-[var(--surface-secondary)] border border-[var(--border-subtle)] flex items-center justify-center text-[var(--text-tertiary)]">
            <BarChart3 size={14} aria-hidden="true" />
          </div>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center text-[var(--text-tertiary)] text-xs">
          <Layers size={24} className="mb-2 opacity-40" />
          <span>No portfolio data available</span>
          <span className="text-[10px] text-[var(--text-tertiary)] mt-1">Add holdings to see comparative metrics</span>
        </div>
      </div>
    );
  }

  // Precise geometry giving ample bottom breathing room
  const chartHeight = 135;
  const paddingTop = 16;
  const paddingBottom = 42;
  const paddingLeft = 48;
  const paddingRight = 16;
  const svgWidth = 440;
  const totalSvgHeight = chartHeight + paddingTop + paddingBottom; // 193
  const innerWidth = svgWidth - paddingLeft - paddingRight;

  const yTicks = 4;

  return (
    <div className="apple-card p-4 sm:p-5 flex flex-col h-[370px] justify-between select-none">
      {/* Header with Title & Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-1.5 shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-card-title font-bold text-[var(--text-primary)]">
              Invested vs Current
            </h3>
            <span
              className={`text-[10.5px] font-extrabold px-1.5 py-0.5 rounded-[var(--radius-small)] tnum inline-flex items-center gap-0.5 ${
                aggregate.pct >= 0
                  ? 'bg-[var(--positive-soft)] text-[var(--positive)]'
                  : 'bg-[var(--negative-soft)] text-[var(--negative)]'
              }`}
            >
              {aggregate.pct >= 0 ? '+' : ''}{aggregate.pct.toFixed(1)}%
            </span>
          </div>
          <p className="text-supporting text-xs mt-0.5">
            {validPortfolios.length === 1
              ? 'Single portfolio metrics'
              : `Comparison across ${validPortfolios.length} portfolios`}
          </p>
        </div>

        <div className="shrink-0">
          <SegmentedControl
            options={[
              { id: 'grouped', label: 'Amount' },
              { id: 'returns', label: '% Return' },
              { id: 'breakdown', label: 'List' },
            ]}
            value={mode}
            onChange={(val) => {
              setMode(val as ViewMode);
              setHoveredIdx(null);
            }}
          />
        </div>
      </div>

      {/* Main Chart / List Area */}
      <div className="flex-1 relative flex flex-col justify-center min-h-0 w-full py-1">
        {mode === 'grouped' && (
          <div className="w-full h-full flex flex-col justify-between">
            {/* Legend & Summary Subhead */}
            <div className="flex items-center justify-between px-1 mb-1 text-[11px] shrink-0">
              <div className="flex items-center gap-3.5">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-[var(--surface-tertiary)] border border-[var(--border-subtle)]" />
                  <span className="text-[var(--text-secondary)] font-medium">Invested</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-[var(--positive)]" />
                  <span className="text-[var(--text-secondary)] font-medium">Current</span>
                </div>
              </div>

              {hoveredIdx !== null && validPortfolios[hoveredIdx] && (
                <div className="hidden sm:flex items-center gap-2 tnum font-bold text-xs animate-fade-in">
                  <span className="text-[var(--text-primary)]">
                    {validPortfolios[hoveredIdx].label.replace("'s Portfolio", '').replace(' Portfolio', '')}:
                  </span>
                  <span
                    className={
                      validPortfolios[hoveredIdx].totalPnL >= 0
                        ? 'text-[var(--positive)]'
                        : 'text-[var(--negative)]'
                    }
                  >
                    {validPortfolios[hoveredIdx].totalPnL >= 0 ? '+' : ''}
                    {isBalancesHidden ? '••••••' : formatINR(validPortfolios[hoveredIdx].totalPnL)} (
                    {validPortfolios[hoveredIdx].totalPnLPercent >= 0 ? '+' : ''}
                    {validPortfolios[hoveredIdx].totalPnLPercent.toFixed(1)}%)
                  </span>
                </div>
              )}
            </div>

            {/* Responsive SVG Grouped Bar Chart */}
            <div className="w-full flex-1 flex items-center justify-center">
              <svg
                viewBox={`0 0 ${svgWidth} ${totalSvgHeight}`}
                className="w-full h-full"
                preserveAspectRatio="xMidYMid meet"
                role="img"
                aria-label="Invested vs Current Value bar chart"
              >
                {/* Horizontal Grid lines and Y-axis labels */}
                {Array.from({ length: yTicks + 1 }).map((_, i) => {
                  const val = (maxVal / yTicks) * i;
                  const y = paddingTop + chartHeight - (val / maxVal) * chartHeight;
                  return (
                    <g key={i}>
                      <line
                        x1={paddingLeft}
                        y1={y}
                        x2={svgWidth - paddingRight}
                        y2={y}
                        stroke="var(--border-subtle)"
                        strokeDasharray={i === 0 ? undefined : '3 3'}
                        strokeOpacity={i === 0 ? 0.8 : 0.4}
                        strokeWidth={1}
                      />
                      <text
                        x={paddingLeft - 6}
                        y={y + 3.5}
                        textAnchor="end"
                        className="fill-[var(--text-tertiary)] font-medium text-[9px] tnum"
                      >
                        {isBalancesHidden
                          ? '••'
                          : val >= 10000000
                          ? `₹${(val / 10000000).toFixed(1)}Cr`
                          : val >= 100000
                          ? `₹${(val / 100000).toFixed(0)}L`
                          : val >= 1000
                          ? `₹${(val / 1000).toFixed(0)}K`
                          : `₹${val.toFixed(0)}`}
                      </text>
                    </g>
                  );
                })}

                {/* Bars per Portfolio */}
                {validPortfolios.map((p, pi) => {
                  const numGroups = validPortfolios.length;
                  const slotWidth = innerWidth / numGroups;
                  const barWidth = Math.min(Math.max(slotWidth * 0.28, 16), 32);
                  const barGap = 4;
                  const groupCenterX = paddingLeft + pi * slotWidth + slotWidth / 2;

                  const investedH = Math.max((p.totalInvested / maxVal) * chartHeight, 4);
                  const currentH = Math.max((p.totalCurrentValue / maxVal) * chartHeight, 4);
                  const isGain = p.totalCurrentValue >= p.totalInvested;
                  const isHovered = hoveredIdx === pi;

                  const investedX = groupCenterX - barWidth - barGap / 2;
                  const currentX = groupCenterX + barGap / 2;

                  const shortName = p.label
                    .replace("'s Portfolio", '')
                    .replace(' Portfolio', '')
                    .slice(0, 10);

                  return (
                    <g
                      key={p.id || pi}
                      className="cursor-pointer"
                      onMouseEnter={() => setHoveredIdx(pi)}
                      onMouseLeave={() => setHoveredIdx(null)}
                    >
                      {/* Hover Highlight Column Background */}
                      {isHovered && (
                        <rect
                          x={groupCenterX - slotWidth * 0.45}
                          y={paddingTop}
                          width={slotWidth * 0.9}
                          height={chartHeight}
                          rx={6}
                          className="fill-[var(--surface-secondary)] opacity-60"
                        />
                      )}

                      {/* Invested Bar */}
                      <rect
                        x={investedX}
                        y={paddingTop + chartHeight - investedH}
                        width={barWidth}
                        height={investedH}
                        rx={4}
                        className={`transition-all duration-150 fill-[var(--surface-tertiary)] stroke-[var(--border-subtle)] ${
                          isHovered ? 'opacity-100 filter brightness-110' : 'opacity-85'
                        }`}
                        strokeWidth={0.5}
                      />

                      {/* Current Value Bar */}
                      <rect
                        x={currentX}
                        y={paddingTop + chartHeight - currentH}
                        width={barWidth}
                        height={currentH}
                        rx={4}
                        className={`transition-all duration-150 ${
                          isGain ? 'fill-[var(--positive)]' : 'fill-[var(--negative)]'
                        } ${isHovered ? 'opacity-100 filter drop-shadow(0 2px 4px rgba(0,0,0,0.15))' : 'opacity-90'}`}
                      />

                      {/* Member Name Label */}
                      <text
                        x={groupCenterX}
                        y={paddingTop + chartHeight + 15}
                        textAnchor="middle"
                        className={`text-[10.5px] font-bold transition-colors ${
                          isHovered ? 'fill-[var(--accent-blue)]' : 'fill-[var(--text-primary)]'
                        }`}
                      >
                        {shortName}
                      </text>

                      {/* Performance % Pill / Text */}
                      <text
                        x={groupCenterX}
                        y={paddingTop + chartHeight + 28}
                        textAnchor="middle"
                        className={`text-[10px] font-extrabold tnum ${
                          p.totalPnLPercent >= 0 ? 'fill-[var(--positive)]' : 'fill-[var(--negative)]'
                        }`}
                      >
                        {p.totalPnLPercent >= 0 ? '+' : ''}{p.totalPnLPercent.toFixed(1)}%
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
          </div>
        )}

        {mode === 'returns' && (
          <div className="w-full h-full flex flex-col justify-between py-0.5">
            <div className="flex items-center justify-between text-xs text-[var(--text-secondary)] px-1 mb-1 shrink-0">
              <span className="font-semibold text-[11px]">Normalized Returns Comparison</span>
              <span className="text-[10px] text-[var(--text-tertiary)]">Baseline 0.0%</span>
            </div>

            {/* Zero-Centered Returns Bar Chart */}
            <div className="w-full flex-1 flex items-center justify-center">
              <svg
                viewBox={`0 0 ${svgWidth} ${totalSvgHeight}`}
                className="w-full h-full"
                preserveAspectRatio="xMidYMid meet"
              >
                {/* 0% Central Baseline */}
                <line
                  x1={paddingLeft}
                  y1={paddingTop + chartHeight / 2}
                  x2={svgWidth - paddingRight}
                  y2={paddingTop + chartHeight / 2}
                  stroke="var(--text-tertiary)"
                  strokeWidth={1.5}
                  strokeOpacity={0.6}
                />

                {/* +Max and -Max helper gridlines */}
                <line
                  x1={paddingLeft}
                  y1={paddingTop + 6}
                  x2={svgWidth - paddingRight}
                  y2={paddingTop + 6}
                  stroke="var(--border-subtle)"
                  strokeDasharray="3 3"
                  strokeOpacity={0.4}
                />
                <text
                  x={paddingLeft - 6}
                  y={paddingTop + 9}
                  textAnchor="end"
                  className="fill-[var(--positive)] font-bold text-[9px] tnum"
                >
                  +{maxAbsReturn}%
                </text>

                <text
                  x={paddingLeft - 6}
                  y={paddingTop + chartHeight / 2 + 3}
                  textAnchor="end"
                  className="fill-[var(--text-tertiary)] font-bold text-[9px] tnum"
                >
                  0%
                </text>

                <line
                  x1={paddingLeft}
                  y1={paddingTop + chartHeight - 6}
                  x2={svgWidth - paddingRight}
                  y2={paddingTop + chartHeight - 6}
                  stroke="var(--border-subtle)"
                  strokeDasharray="3 3"
                  strokeOpacity={0.4}
                />
                <text
                  x={paddingLeft - 6}
                  y={paddingTop + chartHeight - 3}
                  textAnchor="end"
                  className="fill-[var(--negative)] font-bold text-[9px] tnum"
                >
                  -{maxAbsReturn}%
                </text>

                {/* Diverging Bars */}
                {validPortfolios.map((p, pi) => {
                  const numGroups = validPortfolios.length;
                  const slotWidth = innerWidth / numGroups;
                  const barWidth = Math.min(Math.max(slotWidth * 0.42, 22), 44);
                  const groupCenterX = paddingLeft + pi * slotWidth + slotWidth / 2;
                  const barX = groupCenterX - barWidth / 2;

                  const centerY = paddingTop + chartHeight / 2;
                  const halfH = (chartHeight / 2) - 8;
                  const isGain = p.totalPnLPercent >= 0;
                  const barHeight = Math.max(
                    (Math.min(Math.abs(p.totalPnLPercent), maxAbsReturn) / maxAbsReturn) * halfH,
                    4
                  );

                  const barY = isGain ? centerY - barHeight : centerY;

                  const shortName = p.label
                    .replace("'s Portfolio", '')
                    .replace(' Portfolio', '')
                    .slice(0, 10);

                  return (
                    <g key={p.id || pi} className="cursor-pointer">
                      <rect
                        x={barX}
                        y={barY}
                        width={barWidth}
                        height={barHeight}
                        rx={4}
                        className={`transition-all duration-300 ${
                          isGain ? 'fill-[var(--positive)]' : 'fill-[var(--negative)]'
                        } opacity-90 hover:opacity-100`}
                      />

                      {/* Exact % on top/bottom of bar */}
                      <text
                        x={groupCenterX}
                        y={isGain ? barY - 4 : barY + barHeight + 10}
                        textAnchor="middle"
                        className={`font-black text-[9.5px] tnum ${
                          isGain ? 'fill-[var(--positive)]' : 'fill-[var(--negative)]'
                        }`}
                      >
                        {p.totalPnLPercent >= 0 ? '+' : ''}{p.totalPnLPercent.toFixed(1)}%
                      </text>

                      {/* Member Name */}
                      <text
                        x={groupCenterX}
                        y={paddingTop + chartHeight + 16}
                        textAnchor="middle"
                        className="fill-[var(--text-primary)] font-bold text-[10.5px]"
                      >
                        {shortName}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
          </div>
        )}

        {mode === 'breakdown' && (
          <div className="w-full h-full overflow-y-auto space-y-2 pr-1 py-0.5">
            {validPortfolios.map((p) => {
              const isGain = p.totalPnL >= 0;
              const maxMemberVal = Math.max(p.totalInvested, p.totalCurrentValue, 1);
              const invPct = (p.totalInvested / maxMemberVal) * 100;
              const curPct = (p.totalCurrentValue / maxMemberVal) * 100;

              return (
                <div
                  key={p.id || p.name}
                  className="p-2.5 rounded-[var(--radius-medium)] bg-[var(--surface-secondary)] border border-[var(--border-subtle)] hover:border-[var(--accent-blue)]/40 transition-all"
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="font-bold text-xs text-[var(--text-primary)] truncate">
                        {p.label.replace("'s Portfolio", '').replace(' Portfolio', '')}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={`text-xs font-black tnum ${
                          isGain ? 'text-[var(--positive)]' : 'text-[var(--negative)]'
                        }`}
                      >
                        {isGain ? '+' : ''}
                        {isBalancesHidden ? '••••••' : formatINR(p.totalPnL)}
                      </span>
                      <span
                        className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-[var(--radius-small)] tnum ${
                          isGain
                            ? 'bg-[var(--positive-soft)] text-[var(--positive)]'
                            : 'bg-[var(--negative-soft)] text-[var(--negative)]'
                        }`}
                      >
                        {p.totalPnLPercent >= 0 ? '+' : ''}{p.totalPnLPercent.toFixed(1)}%
                      </span>
                    </div>
                  </div>

                  {/* Dual Horizontal Progress Bars */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-[10px]">
                      <span className="text-[var(--text-tertiary)] w-14 shrink-0">Invested:</span>
                      <div className="flex-1 h-1.5 bg-[var(--surface-tertiary)] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[var(--text-tertiary)] rounded-full"
                          style={{ width: `${invPct}%` }}
                        />
                      </div>
                      <span className="font-semibold text-[var(--text-secondary)] tnum w-16 text-right shrink-0">
                        {isBalancesHidden ? '••••' : formatINR(p.totalInvested)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-[10px]">
                      <span className="text-[var(--text-tertiary)] w-14 shrink-0">Current:</span>
                      <div className="flex-1 h-1.5 bg-[var(--surface-tertiary)] rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            isGain ? 'bg-[var(--positive)]' : 'bg-[var(--negative)]'
                          }`}
                          style={{ width: `${curPct}%` }}
                        />
                      </div>
                      <span className="font-bold text-[var(--text-primary)] tnum w-16 text-right shrink-0">
                        {isBalancesHidden ? '••••' : formatINR(p.totalCurrentValue)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default React.memo(BarChart);
