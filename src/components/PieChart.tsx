import { useState } from 'react';
import { Holding } from '../types/portfolio';
import { formatINR, formatPercent } from '../utils/formatters';

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
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
  '#06b6d4', '#f97316', '#84cc16', '#ec4899', '#14b8a6',
  '#6366f1', '#a855f7', '#78716c', '#64748b', '#0ea5e9',
  '#22c55e', '#eab308', '#dc2626',
];

export default function PieChart({ holdings, slices: customSlices, title = 'Asset Allocation' }: PieChartProps) {
  const [hovered, setHovered] = useState<number | null>(null);

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
      color: COLORS[i],
    }));

    if (otherValue > 0) {
      slices.push({
        label: 'Others',
        fullName: 'Other Holdings',
        value: otherValue,
        pct: total > 0 ? (otherValue / total) * 100 : 0,
        color: '#94a3b8',
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
    const scale = isHovered ? 1.05 : 1;
    const midAngle = startAngle + angle / 2;
    const offsetX = isHovered ? Math.cos(midAngle) * 6 : 0;
    const offsetY = isHovered ? Math.sin(midAngle) * 6 : 0;

    const d = `M ${ix1 + offsetX} ${iy1 + offsetY} L ${x1 + offsetX} ${y1 + offsetY} A ${r * scale} ${r * scale} 0 ${largeArc} 1 ${x2 + offsetX} ${y2 + offsetY} L ${ix2 + offsetX} ${iy2 + offsetY} A ${innerR} ${innerR} 0 ${largeArc} 0 ${ix1 + offsetX} ${iy1 + offsetY} Z`;

    return { d, color: slice.color, i };
  });

  const hoverSlice = hovered !== null ? slices[hovered] : null;

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
      <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wider mb-4">{title}</h3>
      {slices.length === 0 || total === 0 ? (
        <div className="flex items-center justify-center h-[240px] text-sm text-slate-400">
          No data to chart yet
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-6 items-center">
          <div className="relative shrink-0">
            <svg width={240} height={240} viewBox="0 0 240 240">
              {paths.map(({ d, color, i }) => (
                <path
                  key={i}
                  d={d}
                  fill={color}
                  stroke="white"
                  strokeWidth={2}
                  className="cursor-pointer transition-all duration-150"
                  onMouseEnter={() => setHovered(i)}
                  onMouseLeave={() => setHovered(null)}
                />
              ))}
              <circle cx={cx} cy={cy} r={innerR - 2} fill="white" />
              {hoverSlice ? (
                <>
                  <text x={cx} y={cy - 10} textAnchor="middle" className="text-xs" fill="#334155" fontSize={11} fontWeight={600}>
                    {hoverSlice.label}
                  </text>
                  <text x={cx} y={cy + 6} textAnchor="middle" fill="#3b82f6" fontSize={13} fontWeight={700}>
                    {hoverSlice.pct.toFixed(1)}%
                  </text>
                  <text x={cx} y={cy + 22} textAnchor="middle" fill="#64748b" fontSize={9}>
                    {formatINR(hoverSlice.value)}
                  </text>
                </>
              ) : (
                <>
                  <text x={cx} y={cy - 6} textAnchor="middle" fill="#94a3b8" fontSize={9} fontWeight={500}>
                    TOTAL VALUE
                  </text>
                  <text x={cx} y={cy + 12} textAnchor="middle" fill="#1e293b" fontSize={12} fontWeight={700}>
                    {formatINR(total)}
                  </text>
                </>
              )}
            </svg>
          </div>
          <div className="flex-1 grid grid-cols-1 gap-1.5 w-full">
            {slices.map((slice, i) => (
              <div
                key={i}
                className={`flex items-center gap-2 px-2 py-1 rounded-lg cursor-pointer transition-colors ${hovered === i ? 'bg-slate-100' : 'hover:bg-slate-50'}`}
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered(null)}
              >
                <span className="w-3 h-3 rounded-sm shrink-0" style={{ background: slice.color }} />
                <span className="text-xs text-slate-600 flex-1 truncate" title={slice.fullName}>{slice.fullName}</span>
                <span className="text-xs font-bold text-slate-700 shrink-0">{formatPercent(slice.pct, 1)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
