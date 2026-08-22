import React, { useState, useMemo, useCallback } from 'react';
import { Holding } from '../types/portfolio';
import { formatINR } from '../utils/formatters';
import { usePrivacy } from '../contexts/PrivacyContext';
import { PieChart as PieChartIcon } from './icons/AppIcons';

interface AssetSlice {
  label: string;
  fullName: string;
  value: number;
  color: string;
}

interface PieChartProps {
  holdings?: Holding[];
  slices?: AssetSlice[];
  title?: string;
  onSelectSlice?: (label: string) => void;
}

const COLORS = [
  '#387ed1', '#f59e0b', '#00b074', '#eab308', '#8b5cf6',
  '#f43f5e', '#06b6d4', '#ec4899', '#14b8a6', '#64748b',
];

function PieChart({ holdings, slices: customSlices, title = 'Asset allocation', onSelectSlice }: PieChartProps) {
  const [hovered, setHovered] = useState<number | null>(null);
  const { isBalancesHidden } = usePrivacy();

  // 1. Memoize Slices Computation & Single-pass Sorting
  const { total, slices } = useMemo(() => {
    if (customSlices && customSlices.length > 0) {
      const sum = customSlices.reduce((s, x) => s + (Number(x.value) || 0), 0);
      const filtered = customSlices
        .filter((s) => Number(s.value) > 0)
        .map((s) => {
          const val = Number(s.value) || 0;
          return {
            label: s.label,
            fullName: s.fullName,
            value: val,
            pct: sum > 0 ? (val / sum) * 100 : 0,
            color: s.color,
          };
        })
        .sort((a, b) => b.value - a.value);
      return { total: sum, slices: filtered };
    }

    const holdingsList = holdings ?? [];
    const sum = holdingsList.reduce((s, h) => s + (Number(h.currentValue) || 0), 0);

    const sorted = [...holdingsList].sort((a, b) => (b.currentValue || 0) - (a.currentValue || 0));
    const top6 = sorted.slice(0, 6);
    const otherValue = sorted.slice(6).reduce((s, h) => s + (Number(h.currentValue) || 0), 0);

    const resultSlices = top6.map((h, i) => {
      const val = Number(h.currentValue) || 0;
      return {
        label: h.ticker,
        fullName: h.stockName,
        value: val,
        pct: sum > 0 ? (val / sum) * 100 : 0,
        color: COLORS[i % COLORS.length],
      };
    });

    if (otherValue > 0) {
      resultSlices.push({
        label: 'Others',
        fullName: 'Other Holdings',
        value: otherValue,
        pct: sum > 0 ? (otherValue / sum) * 100 : 0,
        color: '#64748b',
      });
    }

    return { total: sum, slices: resultSlices };
  }, [holdings, customSlices]);

  // Safe hovered index clamped to current slices bounds
  const safeHovered = hovered !== null && hovered >= 0 && hovered < slices.length ? hovered : null;
  const hoverSlice = safeHovered !== null ? slices[safeHovered] : null;

  // 2. Trigonometric SVG Geometry Setup
  const cx = 115;
  const cy = 115;
  const r = 95;
  const innerR = 58;

  const paths = useMemo(() => {
    let cumAngle = -Math.PI / 2;
    return slices.map((slice, i) => {
      // Avoid exact 2*PI boundary where start point == end point causing SVG arc collapse
      const rawAngle = (slice.pct / 100) * 2 * Math.PI;
      const angle = Math.min(rawAngle, 2 * Math.PI - 0.0001);

      const startAngle = cumAngle;
      const endAngle = cumAngle + angle;
      cumAngle = endAngle;

      const x1 = cx + r * Math.cos(startAngle);
      const y1 = cy + r * Math.sin(startAngle);
      const x2 = cx + r * Math.cos(endAngle);
      const y2 = cy + r * Math.sin(endAngle);
      const ix1 = cx + innerR * Math.cos(startAngle);
      const iy1 = cy + innerR * Math.sin(startAngle);
      const ix2 = cx + innerR * Math.cos(endAngle);
      const iy2 = cy + innerR * Math.sin(endAngle);

      const largeArc = angle > Math.PI ? 1 : 0;

      const d = `M ${ix1} ${iy1} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} L ${ix2} ${iy2} A ${innerR} ${innerR} 0 ${largeArc} 0 ${ix1} ${iy1} Z`;

      return {
        d,
        color: slice.color,
        i,
      };
    });
  }, [slices]);

  const handleSliceClick = useCallback((label: string) => {
    if (onSelectSlice) {
      onSelectSlice(label);
    }
  }, [onSelectSlice]);

  return (
    <div className="apple-card p-4 sm:p-5 flex flex-col min-h-[320px] sm:min-h-[370px] justify-between">
      {/* Header */}
      <div className="flex justify-between items-start mb-2 shrink-0">
        <div>
          <h3 className="text-card-title font-bold text-[var(--text-primary)]">
            {title}
          </h3>
          <p className="text-supporting text-xs mt-0.5">
            Portfolio distribution &amp; diversification weight
          </p>
        </div>
        <div className="w-7 h-7 rounded-[var(--radius-small)] bg-[var(--surface-secondary)] border border-[var(--border-subtle)] flex items-center justify-center text-[var(--text-tertiary)] shrink-0">
          <PieChartIcon size={14} aria-hidden="true" />
        </div>
      </div>

      {slices.length === 0 || total === 0 ? (
        <div className="flex flex-col items-center justify-center h-[240px] text-xs text-[var(--text-tertiary)]">
          <span>No assets recorded yet</span>
          <span className="text-[10px] mt-1">Add stocks, FDs, SIPs or gold to populate allocation</span>
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row gap-4 sm:gap-5 items-center justify-between flex-1 min-h-0">
          {/* Donut Visualizer with Interactive Center HUD */}
          <div className="relative shrink-0 flex items-center justify-center py-1">
            <svg
              width={195}
              height={195}
              viewBox="0 0 230 230"
              role="img"
              aria-label={`${title} donut chart showing ${slices.length} segments totalling ${isBalancesHidden ? 'hidden' : formatINR(total)}`}
              className="overflow-visible max-w-full drop-shadow-sm"
            >
              <defs>
                <filter id="donutGlow" x="-30%" y="-30%" width="160%" height="160%">
                  <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.25" />
                </filter>
              </defs>
              <title>{title}</title>
              {paths.map(({ d, color, i }) => {
                const isHovered = safeHovered === i;
                return (
                  <path
                    key={i}
                    d={d}
                    fill={color}
                    stroke="var(--surface)"
                    strokeWidth={2.5}
                    className="cursor-pointer transition-all duration-150 focus:outline-none"
                    tabIndex={0}
                    role="button"
                    aria-label={`${slices[i].fullName}: ${slices[i].pct.toFixed(1)}%`}
                    style={{
                      opacity: safeHovered !== null && !isHovered ? 0.35 : 1,
                      filter: isHovered ? 'url(#donutGlow)' : 'none',
                      transform: isHovered ? 'scale(1.035)' : 'scale(1)',
                      transformOrigin: `${cx}px ${cy}px`,
                    }}
                    onMouseEnter={() => setHovered(i)}
                    onMouseLeave={() => setHovered(null)}
                    onClick={() => handleSliceClick(slices[i].label)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleSliceClick(slices[i].label);
                      }
                    }}
                  />
                );
              })}

              {/* Center Cutout Disk with Glassmorphic Ring */}
              <circle cx={cx} cy={cy} r={innerR - 2} className="fill-[var(--surface)] shadow-inner" />
              <circle cx={cx} cy={cy} r={innerR - 2} fill="none" stroke="var(--border-subtle)" strokeWidth={1} />

              {/* Center HUD Text */}
              {hoverSlice ? (
                <>
                  <text
                    x={cx}
                    y={cy - 14}
                    textAnchor="middle"
                    className="fill-[var(--text-secondary)] font-extrabold uppercase tracking-wider text-[9.5px]"
                  >
                    {hoverSlice.fullName.length > 14 ? hoverSlice.label : hoverSlice.fullName}
                  </text>
                  <text
                    x={cx}
                    y={cy + 6}
                    textAnchor="middle"
                    className="fill-[var(--text-primary)] font-black text-sm tnum"
                  >
                    {isBalancesHidden ? '••••••' : formatINR(hoverSlice.value)}
                  </text>
                  <text
                    x={cx}
                    y={cy + 22}
                    textAnchor="middle"
                    className="fill-[var(--accent-blue)] font-bold text-[10px] tnum"
                  >
                    {hoverSlice.pct < 0.1 && hoverSlice.pct > 0 ? '< 0.1%' : `${hoverSlice.pct.toFixed(1)}%`} of total
                  </text>
                </>
              ) : (
                <>
                  <text
                    x={cx}
                    y={cy - 12}
                    textAnchor="middle"
                    className="fill-[var(--text-tertiary)] font-bold text-[9px] uppercase tracking-wider"
                  >
                    TOTAL VALUE
                  </text>
                  <text
                    x={cx}
                    y={cy + 7}
                    textAnchor="middle"
                    className="fill-[var(--text-primary)] font-black text-sm tnum"
                  >
                    {isBalancesHidden ? '••••••' : formatINR(total)}
                  </text>
                  <text
                    x={cx}
                    y={cy + 22}
                    textAnchor="middle"
                    className="fill-[var(--text-tertiary)] font-semibold text-[9.5px]"
                  >
                    {slices.length} Asset {slices.length === 1 ? 'Class' : 'Classes'}
                  </text>
                </>
              )}
            </svg>
          </div>

          {/* High-Density Legend with Mini Proportion Bars */}
          <div className="flex-1 w-full space-y-1.5 overflow-y-auto max-h-[220px] pr-1">
            {slices.map((slice, i) => {
              const isHovered = safeHovered === i;
              return (
                <div
                  key={i}
                  className={`p-2 rounded-[var(--radius-medium)] border transition-all cursor-pointer ios-press ${
                    isHovered
                      ? 'bg-[var(--surface-secondary)] border-[var(--border-subtle)] shadow-xs scale-[1.01]'
                      : 'bg-transparent border-transparent hover:bg-[var(--surface-secondary)]/60'
                  }`}
                  tabIndex={0}
                  role="button"
                  aria-label={`Select ${slice.fullName}`}
                  onMouseEnter={() => setHovered(i)}
                  onMouseLeave={() => setHovered(null)}
                  onClick={() => handleSliceClick(slice.label)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleSliceClick(slice.label);
                    }
                  }}
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <span
                        className="w-2.5 h-2.5 rounded-[var(--radius-small)] shrink-0"
                        style={{ backgroundColor: slice.color }}
                      />
                      <span
                        className="text-xs font-bold text-[var(--text-primary)] truncate"
                        title={slice.fullName}
                      >
                        {slice.fullName}
                      </span>
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0 text-right">
                      <span className="text-xs font-bold text-[var(--text-primary)] tnum">
                        {isBalancesHidden ? '••••••' : formatINR(slice.value)}
                      </span>
                      <span
                        className="text-[11px] font-extrabold px-1.5 py-0.2 rounded-[var(--radius-small)] tnum"
                        style={{
                          backgroundColor: `${slice.color}18`,
                          color: slice.color,
                        }}
                      >
                        {slice.pct < 0.1 && slice.pct > 0 ? '<0.1%' : `${slice.pct.toFixed(1)}%`}
                      </span>
                    </div>
                  </div>

                  {/* Micro Progress Bar */}
                  <div className="h-1 w-full bg-[var(--surface-secondary)] rounded-[var(--radius-pill)] overflow-hidden">
                    <div
                      className="h-full rounded-[var(--radius-pill)] transition-all duration-300"
                      style={{
                        width: `${Math.max(1, Math.min(100, slice.pct))}%`,
                        backgroundColor: slice.color,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default React.memo(PieChart);

