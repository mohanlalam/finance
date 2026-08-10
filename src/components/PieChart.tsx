import React, { useState } from 'react';
import { Holding } from '../types/portfolio';
import { formatINR } from '../utils/formatters';
import { usePrivacy } from '../contexts/PrivacyContext';

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
}

const COLORS = [
  '#007aff', '#34C759', '#ff9500', '#ff3b30', '#8b5cf6',
  '#06b6d4', '#f97316', '#84cc16', '#ec4899', '#14b8a6',
  '#6366f1', '#a855f7', '#78716c', '#64748b', '#0ea5e9',
  '#22c55e', '#eab308', '#dc2626',
];

function PieChart({ holdings, slices: customSlices, title = 'Asset allocation' }: PieChartProps) {
  const [hovered, setHovered] = useState<number | null>(null);
  const { isBalancesHidden } = usePrivacy();

  let total: number;
  let slices: Array<{ label: string; fullName: string; value: number; pct: number; color: string }>;

  if (customSlices && customSlices.length > 0) {
    total = customSlices.reduce((s, x) => s + x.value, 0);
    slices = customSlices
      .filter((s) => s.value > 0)
      .map((s) => ({
        label: s.label,
        fullName: s.fullName,
        value: s.value,
        pct: total > 0 ? (s.value / total) * 100 : 0,
        color: s.color,
      }));
  } else {
    const holdingsList = holdings ?? [];
    total = holdingsList.reduce((s, h) => s + h.currentValue, 0);
    const top10 = [...holdingsList].sort((a, b) => b.currentValue - a.currentValue).slice(0, 10);
    const otherValue = [...holdingsList]
      .sort((a, b) => b.currentValue - a.currentValue)
      .slice(10)
      .reduce((s, h) => s + h.currentValue, 0);

    slices = top10.map((h, i) => ({
      label: h.ticker,
      fullName: h.stockName,
      value: h.currentValue,
      pct: total > 0 ? (h.currentValue / total) * 100 : 0,
      color: COLORS[i % COLORS.length],
    }));

    if (otherValue > 0) {
      slices.push({
        label: 'Others',
        fullName: 'Other Holdings',
        value: otherValue,
        pct: total > 0 ? (otherValue / total) * 100 : 0,
        color: '#8e8e93',
      });
    }
  }

  const cx = 120;
  const cy = 120;
  const r = 100;
  const innerR = 58;

  let cumAngle = -Math.PI / 2;

  const paths = slices.map((slice, i) => {
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
    const isHovered = hovered === i;
    const scale = isHovered ? 1.04 : 1;
    const midAngle = startAngle + angle / 2;
    const offsetX = isHovered ? Math.cos(midAngle) * 4 : 0;
    const offsetY = isHovered ? Math.sin(midAngle) * 4 : 0;

    const d = `M ${ix1 + offsetX} ${iy1 + offsetY} L ${x1 + offsetX} ${y1 + offsetY} A ${r * scale} ${r * scale} 0 ${largeArc} 1 ${x2 + offsetX} ${y2 + offsetY} L ${ix2 + offsetX} ${iy2 + offsetY} A ${innerR} ${innerR} 0 ${largeArc} 0 ${ix1 + offsetX} ${iy1 + offsetY} Z`;

    return { d, color: slice.color, i };
  });

  const hoverSlice = hovered !== null ? slices[hovered] : null;

  return (
    <div className="apple-card p-5 flex flex-col h-[370px] justify-between">
      <h3 className="text-card-title font-semibold text-slate-800 dark:text-slate-200 mb-4">{title}</h3>
      {slices.length === 0 || total === 0 ? (
        <div className="flex items-center justify-center h-[240px] text-xs text-slate-400 dark:text-slate-500">
          No data to chart yet
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-6 items-center">
          <div className="relative shrink-0">
            <svg
              width={240}
              height={240}
              viewBox="0 0 240 240"
              role="img"
              aria-label={`${title} donut chart showing ${slices.length} segments totalling ${isBalancesHidden ? 'hidden' : formatINR(total)}`}
            >
              <title>{title}</title>
              {paths.map(({ d, color, i }) => (
                <path
                  key={i}
                  d={d}
                  fill={color}
                  stroke="white"
                  strokeWidth={1.5}
                  className="cursor-pointer transition-all duration-150 dark:stroke-zinc-900"
                  onMouseEnter={() => setHovered(i)}
                  onMouseLeave={() => setHovered(null)}
                />
              ))}
              <circle cx={cx} cy={cy} r={innerR - 2} className="fill-white dark:fill-zinc-900" />
              {hoverSlice ? (
                <>
                  <text x={cx} y={cy - 10} textAnchor="middle" className="text-xs fill-slate-700 dark:fill-slate-200" fontSize={11} fontWeight={600}>
                    {hoverSlice.label}
                  </text>
                  <text x={cx} y={cy + 6} textAnchor="middle" className="fill-[#007aff] dark:fill-[#60a5fa]" fontSize={13} fontWeight={700}>
                    {hoverSlice.pct.toFixed(1)}%
                  </text>
                  <text x={cx} y={cy + 22} textAnchor="middle" className="fill-slate-400 dark:fill-slate-500 tnum" fontSize={9}>
                    {isBalancesHidden ? '••••••' : formatINR(hoverSlice.value)}
                  </text>
                </>
              ) : (
                <>
                  <text x={cx} y={cy - 6} textAnchor="middle" className="fill-slate-400 dark:fill-slate-500" fontSize={9} fontWeight={500}>
                    TOTAL VALUE
                  </text>
                  <text x={cx} y={cy + 12} textAnchor="middle" className="fill-slate-800 dark:fill-slate-100 tnum" fontSize={12} fontWeight={700}>
                    {isBalancesHidden ? '••••••' : formatINR(total)}
                  </text>
                </>
              )}
            </svg>
          </div>
          <div className="flex-1 grid grid-cols-1 gap-1.5 w-full">
            {slices.map((slice, i) => (
              <div
                key={i}
                className={`flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg cursor-pointer transition-colors ${hovered === i ? 'bg-slate-100 dark:bg-zinc-800' : 'hover:bg-slate-50 dark:hover:bg-zinc-800/50'}`}
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered(null)}
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: slice.color }} />
                  <span className="text-xs text-slate-600 dark:text-slate-300 font-medium truncate" title={slice.fullName}>
                    {slice.fullName}
                  </span>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 tnum">
                    {isBalancesHidden ? '••••••' : formatINR(slice.value)}
                  </span>
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-200 tnum w-11 text-right">
                    {slice.pct.toFixed(1)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default React.memo(PieChart);
