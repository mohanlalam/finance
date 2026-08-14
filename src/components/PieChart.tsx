import React, { useState, useMemo } from 'react';
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
      const sum = customSlices.reduce((s, x) => s + x.value, 0);
      const filtered = customSlices
        .filter((s) => s.value > 0)
        .map((s) => ({
          label: s.label,
          fullName: s.fullName,
          value: s.value,
          pct: sum > 0 ? (s.value / sum) * 100 : 0,
          color: s.color,
        }))
        .sort((a, b) => b.value - a.value);
      return { total: sum, slices: filtered };
    }

    const holdingsList = holdings ?? [];
    const sum = holdingsList.reduce((s, h) => s + h.currentValue, 0);

    const sorted = [...holdingsList].sort((a, b) => b.currentValue - a.currentValue);
    const top6 = sorted.slice(0, 6);
    const otherValue = sorted.slice(6).reduce((s, h) => s + h.currentValue, 0);

    const resultSlices = top6.map((h, i) => ({
      label: h.ticker,
      fullName: h.stockName,
      value: h.currentValue,
      pct: sum > 0 ? (h.currentValue / sum) * 100 : 0,
      color: COLORS[i % COLORS.length],
    }));

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

  // 2. Trigonometric SVG Geometry Setup
  const cx = 115;
  const cy = 115;
  const r = 95;
  const innerR = 58;

  const paths = useMemo(() => {
    let cumAngle = -Math.PI / 2;
    return slices.map((slice, i) => {
      const angle = (slice.pct / 100) * 2 * Math.PI;
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
      const midAngle = startAngle + angle / 2;

      return {
        baseProps: { cx, cy, r, innerR, x1, y1, x2, y2, ix1, iy1, ix2, iy2, largeArc, midAngle },
        color: slice.color,
        i,
      };
    });
  }, [slices]);

  const computedPaths = useMemo(() => {
    return paths.map(({ baseProps, color, i }) => {
      const isHovered = hovered === i;
      const scale = isHovered ? 1.05 : 1;
      const offsetX = isHovered ? Math.cos(baseProps.midAngle) * 5 : 0;
      const offsetY = isHovered ? Math.sin(baseProps.midAngle) * 5 : 0;

      const d = `M ${baseProps.ix1 + offsetX} ${baseProps.iy1 + offsetY} L ${baseProps.x1 + offsetX} ${baseProps.y1 + offsetY} A ${baseProps.r * scale} ${baseProps.r * scale} 0 ${baseProps.largeArc} 1 ${baseProps.x2 + offsetX} ${baseProps.y2 + offsetY} L ${baseProps.ix2 + offsetX} ${baseProps.iy2 + offsetY} A ${baseProps.innerR} ${baseProps.innerR} 0 ${baseProps.largeArc} 0 ${baseProps.ix1 + offsetX} ${baseProps.iy1 + offsetY} Z`;

      return { d, color, i, isHovered };
    });
  }, [paths, hovered]);

  const hoverSlice = hovered !== null ? slices[hovered] : null;

  return (
    <div className="apple-card p-5 flex flex-col h-[370px] justify-between">
      {/* Header */}
      <div className="flex justify-between items-start mb-2">
        <div>
          <h3 className="text-card-title font-bold text-[var(--text-primary)]">
            {title}
          </h3>
          <p className="text-supporting text-xs mt-0.5">
            Portfolio distribution &amp; diversification weight
          </p>
        </div>
        <div className="w-7 h-7 rounded-[var(--radius-small)] bg-[var(--surface-secondary)] border border-[var(--border-subtle)] flex items-center justify-center text-[var(--text-tertiary)]">
          <PieChartIcon size={14} aria-hidden="true" />
        </div>
      </div>

      {slices.length === 0 || total === 0 ? (
        <div className="flex flex-col items-center justify-center h-[240px] text-xs text-[var(--text-tertiary)]">
          <span>No assets recorded yet</span>
          <span className="text-[10px] mt-1">Add stocks, FDs or gold to populate allocation</span>
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row gap-5 items-center justify-between flex-1">
          {/* Donut Visualizer with Interactive Center HUD */}
          <div className="relative shrink-0">
            <svg
              width={230}
              height={230}
              viewBox="0 0 230 230"
              role="img"
              aria-label={`${title} donut chart showing ${slices.length} segments totalling ${isBalancesHidden ? 'hidden' : formatINR(total)}`}
              className="overflow-visible"
            >
              <title>{title}</title>
              {computedPaths.map(({ d, color, i, isHovered }) => (
                <path
                  key={i}
                  d={d}
                  fill={color}
                  stroke="var(--surface)"
                  strokeWidth={2}
                  className="cursor-pointer transition-all duration-200"
                  style={{
                    opacity: hovered !== null && !isHovered ? 0.45 : 1,
                    filter: isHovered ? 'drop-shadow(0 4px 8px rgba(0,0,0,0.15))' : 'none',
                  }}
                  onMouseEnter={() => setHovered(i)}
                  onMouseLeave={() => setHovered(null)}
                  onClick={() => onSelectSlice && onSelectSlice(slices[i].label)}
                />
              ))}

              {/* Center Cutout Disk */}
              <circle cx={cx} cy={cy} r={innerR - 2} className="fill-[var(--surface)]" />

              {/* Center HUD Text */}
              {hoverSlice ? (
                <>
                  <text
                    x={cx}
                    y={cy - 12}
                    textAnchor="middle"
                    className="fill-[var(--text-secondary)] font-extrabold uppercase tracking-wider text-[10px]"
                  >
                    {hoverSlice.fullName.length > 14 ? hoverSlice.label : hoverSlice.fullName}
                  </text>
                  <text
                    x={cx}
                    y={cy + 7}
                    textAnchor="middle"
                    className="fill-[var(--text-primary)] font-black text-sm tnum"
                  >
                    {isBalancesHidden ? '••••••' : formatINR(hoverSlice.value)}
                  </text>
                  <text
                    x={cx}
                    y={cy + 23}
                    textAnchor="middle"
                    className="fill-[var(--accent-blue)] font-bold text-[10.5px] tnum"
                  >
                    {hoverSlice.pct.toFixed(1)}% of total
                  </text>
                </>
              ) : (
                <>
                  <text
                    x={cx}
                    y={cy - 10}
                    textAnchor="middle"
                    className="fill-[var(--text-tertiary)] font-bold text-[9px] uppercase tracking-wider"
                  >
                    TOTAL VALUE
                  </text>
                  <text
                    x={cx}
                    y={cy + 8}
                    textAnchor="middle"
                    className="fill-[var(--text-primary)] font-black text-sm tnum"
                  >
                    {isBalancesHidden ? '••••••' : formatINR(total)}
                  </text>
                  <text
                    x={cx}
                    y={cy + 22}
                    textAnchor="middle"
                    className="fill-[var(--text-tertiary)] font-medium text-[9px]"
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
              const isHovered = hovered === i;
              return (
                <div
                  key={i}
                  className={`p-2 rounded-[var(--radius-medium)] border transition-all cursor-pointer ios-press ${
                    isHovered
                      ? 'bg-[var(--surface-secondary)] border-[var(--border-subtle)] shadow-xs scale-[1.01]'
                      : 'bg-transparent border-transparent hover:bg-[var(--surface-secondary)]/60'
                  }`}
                  onMouseEnter={() => setHovered(i)}
                  onMouseLeave={() => setHovered(null)}
                  onClick={() => onSelectSlice && onSelectSlice(slice.label)}
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
                        {slice.pct.toFixed(1)}%
                      </span>
                    </div>
                  </div>

                  {/* Micro Progress Bar */}
                  <div className="h-1 w-full bg-[var(--surface-secondary)] rounded-[var(--radius-pill)] overflow-hidden">
                    <div
                      className="h-full rounded-[var(--radius-pill)] transition-all duration-300"
                      style={{
                        width: `${slice.pct}%`,
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
