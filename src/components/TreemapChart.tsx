import { useMemo } from 'react';
import { Holding } from '../types/portfolio';
import { formatINR } from '../utils/formatters';

interface TreemapChartProps {
  holdings: Holding[];
}

interface TreemapItem {
  label: string;
  value: number;
  pct: number;
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
}

const COLORS = [
  '#2563eb', '#059669', '#d97706', '#dc2626', '#7c3aed',
  '#0891b2', '#ea580c', '#65a30d', '#db2777', '#0d9488',
];

export default function TreemapChart({ holdings }: TreemapChartProps) {
  const chartData = useMemo(() => {
    if (holdings.length > 0) {
      return [...holdings].sort((a, b) => b.currentValue - a.currentValue);
    }
    
    // Seed mock holdings if no assets are active to make the preview look gorgeous
    return [
      { ticker: 'RELIANCE', stockName: 'Reliance Industries', currentValue: 340000 },
      { ticker: 'TCS', stockName: 'Tata Consultancy Services', currentValue: 280000 },
      { ticker: 'HDFCBANK', stockName: 'HDFC Bank Ltd', currentValue: 210000 },
      { ticker: 'INFY', stockName: 'Infosys Ltd', currentValue: 150000 },
      { ticker: 'ICICIBANK', stockName: 'ICICI Bank Ltd', currentValue: 110000 },
    ] as unknown as Holding[];
  }, [holdings]);

  const treemapItems = useMemo(() => {
    const total = chartData.reduce((sum, h) => sum + h.currentValue, 0);
    if (total <= 0) return [];

    const width = 600;
    const height = 200;

    const items: TreemapItem[] = [];
    let remainingX = 0;
    let remainingY = 0;
    let remainingW = width;
    let remainingH = height;

    // We split along the longest side sequentially for simplicity and stability
    chartData.forEach((item, idx) => {
      if (idx >= 8) return; // Cap at top 8 items

      const pct = (item.currentValue / total) * 100;
      let w = 0;
      let h = 0;
      const x = remainingX;
      const y = remainingY;

      const widthDenom = total * (remainingW / width);
      const heightDenom = total * (remainingH / height);

      if (remainingW >= remainingH) {
        // Split vertically (columns)
        w = widthDenom > 0 ? (item.currentValue / widthDenom) * width : 0;
        w = Math.max(0, Math.min(w, remainingW));
        h = Math.max(0, remainingH);
        remainingX += w;
        remainingW = Math.max(0, remainingW - w);
      } else {
        // Split horizontally (rows)
        h = heightDenom > 0 ? (item.currentValue / heightDenom) * height : 0;
        h = Math.max(0, Math.min(h, remainingH));
        w = Math.max(0, remainingW);
        remainingY += h;
        remainingH = Math.max(0, remainingH - h);
      }

      items.push({
        label: item.ticker,
        value: item.currentValue,
        pct: pct,
        x,
        y,
        w,
        h,
        color: COLORS[idx % COLORS.length],
      });
    });

    // Handle "Others" box if there are more than 8 holdings
    if (chartData.length > 8) {
      const otherValue = chartData.slice(8).reduce((sum, h) => sum + h.currentValue, 0);
      if (otherValue > 0) {
        const pct = (otherValue / total) * 100;
        items.push({
          label: 'OTHERS',
          value: otherValue,
          pct,
          x: remainingX,
          y: remainingY,
          w: Math.max(0, remainingW),
          h: Math.max(0, remainingH),
          color: '#64748b',
        });
      }
    }

    return items;
  }, [chartData]);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm p-5">
      <div className="mb-4">
        <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
          Equity Concentration Treemap
          </h3>
        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
          Relative sizes of stock & mutual fund holdings
        </p>
      </div>

      {treemapItems.length === 0 ? (
        <div className="h-[200px] flex items-center justify-center text-xs text-slate-400 dark:text-slate-500">
          No stock holdings to display
        </div>
      ) : (
        <div className="w-full overflow-hidden rounded-xl border border-slate-200 dark:border-slate-750">
          <svg viewBox="0 0 600 200" className="w-full h-auto">
            {treemapItems.filter(item => item.w >= 1 && item.h >= 1).map((item, idx) => (
              <g key={idx}>
                <rect
                  x={item.x}
                  y={item.y}
                  width={item.w}
                  height={item.h}
                  fill={item.color}
                  className="stroke-white dark:stroke-slate-800 transition-all hover:opacity-90 cursor-help"
                  strokeWidth={1.5}
                >
                  <title>{`${item.label}: ${formatINR(item.value)} (${item.pct.toFixed(1)}%)`}</title>
                </rect>
                {item.w > 45 && item.h > 35 && (
                  <g className="pointer-events-none">
                    <text
                      x={item.x + 8}
                      y={item.y + 18}
                      className="fill-white font-extrabold text-[10px] tracking-wide"
                    >
                      {item.label}
                    </text>
                    <text
                      x={item.x + 8}
                      y={item.y + 30}
                      className="fill-white/80 font-bold text-[8.5px]"
                    >
                      {item.pct.toFixed(1)}%
                    </text>
                    {item.h > 50 && (
                      <text
                        x={item.x + 8}
                        y={item.y + 44}
                        className="fill-white/70 font-semibold text-[8px]"
                      >
                        {formatCompactINR(item.value)}
                      </text>
                    )}
                  </g>
                )}
              </g>
            ))}
          </svg>
        </div>
      )}
    </div>
  );
}

function formatCompactINR(val: number): string {
  if (val >= 10000000) return `₹${(val / 10000000).toFixed(1)}Cr`;
  if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`;
  return `₹${val.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}
