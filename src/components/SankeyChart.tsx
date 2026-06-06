import { useMemo } from 'react';
import { Portfolio } from '../types/portfolio';
import { classBreakdown } from '../utils/portfolioCalcs';


interface SankeyChartProps {
  portfolios: Portfolio[];
  activePortfolio: Portfolio | null;
}

export default function SankeyChart({ portfolios, activePortfolio }: SankeyChartProps) {
  const breakdown = useMemo(() => {
    return classBreakdown(portfolios, activePortfolio);
  }, [portfolios, activePortfolio]);

  const flows = useMemo(() => {
    const equity = breakdown.stocks + breakdown.sip;
    const debt = breakdown.fd + breakdown.rd + breakdown.ssy;
    const gold = breakdown.gold;
    const re = breakdown.realEstate;
    const total = equity + debt + gold + re;

    return {
      equity,
      debt,
      gold,
      re,
      stocks: breakdown.stocks,
      sip: breakdown.sip,
      fd: breakdown.fd,
      rd: breakdown.rd,
      ssy: breakdown.ssy,
      total: total > 0 ? total : 1000000, // fallback
      isMock: total === 0,
    };
  }, [breakdown]);

  // Adjust parameters if all values are zero
  const data = useMemo(() => {
    if (!flows.isMock) return flows;
    return {
      equity: 500000,
      debt: 300000,
      gold: 100000,
      re: 100000,
      stocks: 350000,
      sip: 150000,
      fd: 150000,
      rd: 75000,
      ssy: 75000,
      total: 1000000,
      isMock: true,
    };
  }, [flows]);

  // SVG dimensions
  const width = 600;
  const height = 240;
  
  // Node layout coordinates
  // Col 1: Total Wealth (X=40)
  // Col 2: Categories (X=260)
  // Col 3: Sub-assets (X=480)
  const x1 = 40;
  const x2 = 260;
  const x3 = 480;
  const nodeW = 20;
  const y1_total = 40;

  // Let's compute node heights and layouts proportional to value and memoize them
  const layout = useMemo(() => {
    const totalH = 160; // total height budget for stacks
    const scale = totalH / data.total;

    const nodeHeights = {
      equity: data.equity * scale,
      debt: data.debt * scale,
      gold: data.gold * scale,
      re: data.re * scale,
      stocks: data.stocks * scale,
      sip: data.sip * scale,
      fd: data.fd * scale,
      rd: data.rd * scale,
      ssy: data.ssy * scale,
    };

    const totalNodeH = data.total * scale;

    // Col 2 stack offsets
    const y2_equity = 40;
    const y2_debt = y2_equity + nodeHeights.equity + 15;
    const y2_gold = y2_debt + nodeHeights.debt + 15;
    const y2_re = y2_gold + nodeHeights.gold + 15;

    // Col 3 stack offsets
    const y3_stocks = 40;
    const y3_sip = y3_stocks + nodeHeights.stocks + 10;
    const y3_fd = y3_sip + nodeHeights.sip + 15;
    const y3_rd = y3_fd + nodeHeights.fd + 10;
    const y3_ssy = y3_rd + nodeHeights.rd + 10;
    const y3_gold = y3_ssy + nodeHeights.ssy + 15;
    const y3_re = y3_gold + nodeHeights.gold + 15;

    // Helper to draw smooth bezier link path between nodes
    const getLinkPath = (sx: number, sy: number, sw: number, tx: number, ty: number, tw: number) => {
      const cx1 = sx + (tx - sx) / 2;
      const cy1 = sy;
      const cx2 = sx + (tx - sx) / 2;
      const cy2 = ty;

      return `
        M ${sx} ${sy}
        C ${cx1} ${cy1}, ${cx2} ${cy2}, ${tx} ${ty}
        L ${tx} ${ty + tw}
        C ${cx2} ${cy2 + tw}, ${cx1} ${sy + sw}, ${sx} ${sy + sw}
        Z
      `;
    };

    return {
      nodeHeights,
      totalNodeH,
      y2_equity,
      y2_debt,
      y2_gold,
      y2_re,
      y3_stocks,
      y3_sip,
      y3_fd,
      y3_rd,
      y3_ssy,
      y3_gold,
      y3_re,
      links: {
        eqToCat: getLinkPath(x1 + nodeW, y1_total, nodeHeights.equity, x2, y2_equity, nodeHeights.equity),
        debtToCat: getLinkPath(x1 + nodeW, y1_total + nodeHeights.equity, nodeHeights.debt, x2, y2_debt, nodeHeights.debt),
        goldToCat: getLinkPath(x1 + nodeW, y1_total + nodeHeights.equity + nodeHeights.debt, nodeHeights.gold, x2, y2_gold, nodeHeights.gold),
        reToCat: getLinkPath(x1 + nodeW, y1_total + nodeHeights.equity + nodeHeights.debt + nodeHeights.gold, nodeHeights.re, x2, y2_re, nodeHeights.re),
        stocksToSub: getLinkPath(x2 + nodeW, y2_equity, nodeHeights.stocks, x3, y3_stocks, nodeHeights.stocks),
        sipToSub: getLinkPath(x2 + nodeW, y2_equity + nodeHeights.stocks, nodeHeights.sip, x3, y3_sip, nodeHeights.sip),
        fdToSub: getLinkPath(x2 + nodeW, y2_debt, nodeHeights.fd, x3, y3_fd, nodeHeights.fd),
        rdToSub: getLinkPath(x2 + nodeW, y2_debt + nodeHeights.fd, nodeHeights.rd, x3, y3_rd, nodeHeights.rd),
        ssyToSub: getLinkPath(x2 + nodeW, y2_debt + nodeHeights.fd + nodeHeights.rd, nodeHeights.ssy, x3, y3_ssy, nodeHeights.ssy),
        goldToSub: getLinkPath(x2 + nodeW, y2_gold, nodeHeights.gold, x3, y3_gold, nodeHeights.gold),
        reToSub: getLinkPath(x2 + nodeW, y2_re, nodeHeights.re, x3, y3_re, nodeHeights.re),
      }
    };
  }, [data]);

  const {
    nodeHeights,
    totalNodeH,
    y2_equity,
    y2_debt,
    y2_gold,
    y2_re,
    y3_stocks,
    y3_sip,
    y3_fd,
    y3_rd,
    y3_ssy,
    y3_gold,
    y3_re,
    links
  } = layout;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm p-5 relative">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
            Asset Flow Diagram
          </h3>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
            Sankey visualization from net worth to sub-assets
          </p>
        </div>
        {data.isMock && (
          <span className="text-[9px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/10 px-2 py-0.5 rounded-full uppercase tracking-wider">
            Simulated
          </span>
        )}
      </div>

      <div className="w-full">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
          {/* Defs for gradients */}
          <defs>
            <linearGradient id="eqGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.35" />
            </linearGradient>
            <linearGradient id="debtGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.35" />
            </linearGradient>
            <linearGradient id="goldGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#eab308" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#eab308" stopOpacity="0.35" />
            </linearGradient>
            <linearGradient id="reGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#f97316" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#f97316" stopOpacity="0.35" />
            </linearGradient>
          </defs>

          {/* Links: Col 1 -> Col 2 */}
          {nodeHeights.equity > 0 && <path d={links.eqToCat} fill="url(#eqGrad)" />}
          {nodeHeights.debt > 0 && <path d={links.debtToCat} fill="url(#debtGrad)" />}
          {nodeHeights.gold > 0 && <path d={links.goldToCat} fill="url(#goldGrad)" />}
          {nodeHeights.re > 0 && <path d={links.reToCat} fill="url(#reGrad)" />}

          {/* Links: Col 2 -> Col 3 */}
          {/* Equity -> Stocks & SIPs */}
          {nodeHeights.stocks > 0 && <path d={links.stocksToSub} fill="url(#eqGrad)" />}
          {nodeHeights.sip > 0 && <path d={links.sipToSub} fill="url(#eqGrad)" />}
          {/* Debt -> FDs, RDs, SSYs */}
          {nodeHeights.fd > 0 && <path d={links.fdToSub} fill="url(#debtGrad)" />}
          {nodeHeights.rd > 0 && <path d={links.rdToSub} fill="url(#debtGrad)" />}
          {nodeHeights.ssy > 0 && <path d={links.ssyToSub} fill="url(#debtGrad)" />}
          {/* Gold -> Gold node */}
          {nodeHeights.gold > 0 && <path d={links.goldToSub} fill="url(#goldGrad)" />}
          {/* Real Estate -> Real Estate node */}
          {nodeHeights.re > 0 && <path d={links.reToSub} fill="url(#reGrad)" />}

          {/* Nodes (Col 1: Net Worth) */}
          {totalNodeH > 0 && (
            <>
              <rect x={x1} y={y1_total} width={nodeW} height={totalNodeH} fill="#3b82f6" rx={3} />
              <text x={x1 - 6} y={y1_total + totalNodeH / 2 + 4} textAnchor="end" className="fill-slate-700 dark:fill-slate-200 font-extrabold text-[9.5px]">
                NET WORTH ({formatCompactINR(data.total)})
              </text>
            </>
          )}

          {/* Nodes (Col 2: Categories) */}
          {nodeHeights.equity > 0 && (
            <>
              <rect x={x2} y={y2_equity} width={nodeW} height={nodeHeights.equity} fill="#3b82f6" rx={3} />
              <text x={x2 - 6} y={y2_equity + nodeHeights.equity / 2 + 3} textAnchor="end" className="fill-slate-600 dark:fill-slate-300 font-bold text-[8.5px]">
                Equity ({formatCompactINR(data.equity)})
              </text>
            </>
          )}

          {nodeHeights.debt > 0 && (
            <>
              <rect x={x2} y={y2_debt} width={nodeW} height={nodeHeights.debt} fill="#8b5cf6" rx={3} />
              <text x={x2 - 6} y={y2_debt + nodeHeights.debt / 2 + 3} textAnchor="end" className="fill-slate-600 dark:fill-slate-300 font-bold text-[8.5px]">
                Debt ({formatCompactINR(data.debt)})
              </text>
            </>
          )}

          {nodeHeights.gold > 0 && (
            <>
              <rect x={x2} y={y2_gold} width={nodeW} height={nodeHeights.gold} fill="#eab308" rx={3} />
              <text x={x2 - 6} y={y2_gold + nodeHeights.gold / 2 + 3} textAnchor="end" className="fill-slate-600 dark:fill-slate-300 font-bold text-[8.5px]">
                Gold ({formatCompactINR(data.gold)})
              </text>
            </>
          )}

          {nodeHeights.re > 0 && (
            <>
              <rect x={x2} y={y2_re} width={nodeW} height={nodeHeights.re} fill="#f97316" rx={3} />
              <text x={x2 - 6} y={y2_re + nodeHeights.re / 2 + 3} textAnchor="end" className="fill-slate-600 dark:fill-slate-300 font-bold text-[8.5px]">
                Realty ({formatCompactINR(data.re)})
              </text>
            </>
          )}

          {/* Nodes (Col 3: Sub-assets) */}
          {nodeHeights.stocks > 0 && (
            <>
              <rect x={x3} y={y3_stocks} width={nodeW} height={nodeHeights.stocks} fill="#3b82f6" rx={3} />
              <text x={x3 + nodeW + 6} y={y3_stocks + nodeHeights.stocks / 2 + 3} className="fill-slate-500 dark:fill-slate-400 font-semibold text-[8px]">
                Stocks ({formatCompactINR(data.stocks)})
              </text>
            </>
          )}

          {nodeHeights.sip > 0 && (
            <>
              <rect x={x3} y={y3_sip} width={nodeW} height={nodeHeights.sip} fill="#60a5fa" rx={3} />
              <text x={x3 + nodeW + 6} y={y3_sip + nodeHeights.sip / 2 + 3} className="fill-slate-500 dark:fill-slate-400 font-semibold text-[8px]">
                Mutual Funds ({formatCompactINR(data.sip)})
              </text>
            </>
          )}

          {nodeHeights.fd > 0 && (
            <>
              <rect x={x3} y={y3_fd} width={nodeW} height={nodeHeights.fd} fill="#8b5cf6" rx={3} />
              <text x={x3 + nodeW + 6} y={y3_fd + nodeHeights.fd / 2 + 3} className="fill-slate-500 dark:fill-slate-400 font-semibold text-[8px]">
                FDs ({formatCompactINR(data.fd)})
              </text>
            </>
          )}

          {nodeHeights.rd > 0 && (
            <>
              <rect x={x3} y={y3_rd} width={nodeW} height={nodeHeights.rd} fill="#a78bfa" rx={3} />
              <text x={x3 + nodeW + 6} y={y3_rd + nodeHeights.rd / 2 + 3} className="fill-slate-500 dark:fill-slate-400 font-semibold text-[8px]">
                RDs ({formatCompactINR(data.rd)})
              </text>
            </>
          )}

          {nodeHeights.ssy > 0 && (
            <>
              <rect x={x3} y={y3_ssy} width={nodeW} height={nodeHeights.ssy} fill="#c084fc" rx={3} />
              <text x={x3 + nodeW + 6} y={y3_ssy + nodeHeights.ssy / 2 + 3} className="fill-slate-500 dark:fill-slate-400 font-semibold text-[8px]">
                SSY ({formatCompactINR(data.ssy)})
              </text>
            </>
          )}

          {nodeHeights.gold > 0 && (
            <>
              <rect x={x3} y={y3_gold} width={nodeW} height={nodeHeights.gold} fill="#eab308" rx={3} />
              <text x={x3 + nodeW + 6} y={y3_gold + nodeHeights.gold / 2 + 3} className="fill-slate-500 dark:fill-slate-400 font-semibold text-[8px]">
                Gold ({formatCompactINR(data.gold)})
              </text>
            </>
          )}

          {nodeHeights.re > 0 && (
            <>
              <rect x={x3} y={y3_re} width={nodeW} height={nodeHeights.re} fill="#f97316" rx={3} />
              <text x={x3 + nodeW + 6} y={y3_re + nodeHeights.re / 2 + 3} className="fill-slate-500 dark:fill-slate-400 font-semibold text-[8px]">
                Property ({formatCompactINR(data.re)})
              </text>
            </>
          )}
        </svg>
      </div>
    </div>
  );
}

function formatCompactINR(val: number): string {
  if (val >= 10000000) return `₹${(val / 10000000).toFixed(1)}Cr`;
  if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`;
  return `₹${val.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}
