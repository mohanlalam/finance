import React, { useState, useEffect, useMemo, useRef } from 'react';
import { TrendingUp, TrendingDown, AlertTriangle, Landmark, Shield, Activity, Crown, Target, BarChart3, Filter } from './icons/AppIcons';
import { formatINR, formatPercent } from '../utils/formatters';
import {
  PortfolioInsights,
  HoldingInsight,
  AllocationSlice,
  ConcentrationWarning,
  FDMaturityAlert,
  InsuranceRenewalAlert,
  PortfolioBestWorst,
} from '../hooks/usePortfolioInsights';
import AllocationTargetsSettings from './AllocationTargetsSettings';

import { Portfolio } from '../types/portfolio';
import { calculateHealthScore, calculateHealthScoreAsync, HealthReport } from '../utils/healthScore';
import { calculateRebalancing, calculateRebalancingAsync, RebalancingAdvice } from '../utils/rebalancing';

interface InsightsPanelProps {
  insights: PortfolioInsights;
  portfolios: Portfolio[];
  activePortfolio: Portfolio | null;
  onTargetsChanged?: () => void;
}

/* ── Clean Apple-style card wrapper ── */
const Card = React.memo(function Card({ title, icon, children, action }: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  accent?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="apple-card p-4 flex flex-col h-full min-w-0 transition-shadow hover:shadow-md">
      <div className="flex items-center gap-2 mb-3">
        {icon}
        <h4 className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider flex-1">{title}</h4>
        {action}
      </div>
      <div className="flex-1 flex flex-col justify-center">
        {children}
      </div>
    </div>
  );
});

/* ── Sub-sections ── */

const TopHoldings = React.memo(function TopHoldings({ items }: { items: HoldingInsight[] }) {
  if (items.length === 0) return <p className="text-xs text-slate-400 dark:text-slate-500">No holdings yet</p>;
  const totalVal = items.reduce((s, i) => s + i.holding.currentValue, 0);
  return (
    <div className="space-y-2">
      {items.map((item, idx) => {
        const alloc = totalVal > 0 ? (item.holding.currentValue / totalVal) * 100 : 0;
        return (
          <div key={`${item.holding.ticker}-${idx}`} className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-md bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 flex items-center justify-center text-[10px] font-bold shrink-0">
              {idx + 1}
            </span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-400 truncate">{item.holding.ticker}</span>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 truncate hidden sm:inline">{item.portfolioLabel}</span>
              </div>
            </div>
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 shrink-0 tnum">{formatINR(item.holding.currentValue)}</span>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 shrink-0 w-10 text-right tnum">{alloc.toFixed(1)}%</span>
          </div>
        );
      })}
    </div>
  );
});

const GainersList = React.memo(function GainersList({ items, type }: { items: HoldingInsight[]; type: 'gain' | 'loss' }) {
  if (items.length === 0) return <p className="text-xs text-slate-400 dark:text-slate-500">None</p>;
  return (
    <div className="space-y-2">
      {items.map((item, idx) => (
        <div key={`${item.holding.ticker}-${idx}`} className="flex items-center gap-2">
          <span className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 ${type === 'gain' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400' : 'bg-red-100 text-red-600 dark:bg-red-950/40 dark:text-red-400'}`}>
            {type === 'gain' ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
          </span>
          <span className="text-xs font-bold text-slate-700 dark:text-slate-400 truncate flex-1">{item.holding.ticker}</span>
          <span className={`text-xs font-bold shrink-0 tnum ${type === 'gain' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'}`}>
            {formatPercent(item.holding.pnlPercent, 1)}
          </span>
        </div>
      ))}
    </div>
  );
});

const BiggestMovers = React.memo(function BiggestMovers({ movers }: { movers: HoldingInsight[] }) {
  if (movers.length === 0) return <p className="text-xs text-slate-400 dark:text-slate-500">No data</p>;
  return (
    <div className="space-y-3">
      {movers.map((mover, idx) => {
        const h = mover.holding;
        const isUp = h.todayPnLPercent >= 0;
        return (
          <div key={`${h.ticker}-${idx}`} className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${isUp ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400' : 'bg-red-100 text-red-600 dark:bg-red-950/40 dark:text-red-400'}`}>
              {isUp ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{h.ticker}</span>
                <span className="text-[9px] text-slate-400 dark:text-slate-500 truncate">{mover.portfolioLabel}</span>
              </div>
              <p className="text-[9px] text-slate-400 dark:text-slate-500 truncate leading-none mt-0.5">{h.stockName}</p>
            </div>
            <div className="text-right shrink-0">
              <p className={`text-xs font-bold tnum ${isUp ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'}`}>
                {formatPercent(h.todayPnLPercent, 2)}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
});

const AllocationDrift = React.memo(function AllocationDrift({
  slices,
  portfolios,
  activePortfolio,
}: {
  slices: AllocationSlice[];
  portfolios: Portfolio[];
  activePortfolio: Portfolio | null;
}) {
  const targetPcts = useMemo(() => ({
    equity: slices.find((s) => s.label === 'Stocks')?.target ?? 60,
    debt: slices.find((s) => s.label === 'Fixed Deposits')?.target ?? 20,
    gold: slices.find((s) => s.label === 'Gold')?.target ?? 10,
    realEstate: slices.find((s) => s.label === 'Real Estate')?.target ?? 10,
  }), [slices]);

  const [rebalancingAdvice, setRebalancingAdvice] = useState<RebalancingAdvice[]>(() =>
    calculateRebalancing(portfolios, activePortfolio, targetPcts)
  );

  const isFirstMountRebalance = useRef(true);

  useEffect(() => {
    if (isFirstMountRebalance.current) {
      isFirstMountRebalance.current = false;
      return;
    }
    let active = true;
    calculateRebalancingAsync(portfolios, activePortfolio, targetPcts).then((advice) => {
      if (active) setRebalancingAdvice(advice);
    });
    return () => {
      active = false;
    };
  }, [portfolios, activePortfolio, targetPcts]);

  if (slices.every((s) => s.value === 0)) return <p className="text-xs text-slate-400 dark:text-slate-500">No assets yet</p>;
  return (
    <div className="space-y-2.5">
      {slices.map((s) => {
        const driftAbs = Math.abs(s.drift);
        const isOver = s.drift > 0;
        const severityColor = driftAbs > 20 ? 'text-[#ff3b30]' : driftAbs > 10 ? 'text-[#ff9500]' : 'text-[#34C759]';
        const barColor = driftAbs > 20 ? '#ff3b30' : driftAbs > 10 ? '#ff9500' : '#34C759';
        
        return (
          <div key={s.label}>
            <div className="flex items-center justify-between mb-0.5">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{s.label}</span>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-450 dark:text-slate-500">{s.target.toFixed(0)}% target</span>
                <span className={`text-xs font-bold tnum ${severityColor}`}>
                  {s.actual.toFixed(1)}% {isOver ? '↑' : '↓'}
                </span>
              </div>
            </div>
            <div className="h-1.5 bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden relative">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(s.actual, 100)}%`,
                  backgroundColor: barColor,
                }}
              />
              <div
                className="absolute top-0 h-full w-0.5 bg-slate-400 dark:bg-slate-500"
                style={{ left: `${s.target}%` }}
              />
            </div>
          </div>
        );
      })}

      <div className="mt-4 pt-3 border-t border-[var(--border-subtle)] space-y-2">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
          Rebalancing Advice
        </p>
        <div className="grid grid-cols-2 gap-2 text-[10.5px]">
          {rebalancingAdvice.map((advice) => {
            const isAligned = advice.recommendation === 'Aligned';
            return (
              <div key={advice.assetClass} className="flex justify-between items-center bg-[#f2f2f7] dark:bg-zinc-800/60 px-2.5 py-1.5 rounded-xl">
                <span className="font-semibold text-slate-500 dark:text-slate-400">{advice.assetClass}</span>
                <span className={`font-bold ${isAligned ? 'text-slate-400 dark:text-slate-500' : advice.diffAmount > 0 ? 'text-red-500 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                  {advice.recommendation}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
});

const ConcentrationRisk = React.memo(function ConcentrationRisk({ warnings }: { warnings: ConcentrationWarning[] }) {
  if (warnings.length === 0) {
    return (
      <div className="flex items-center gap-2 text-[#34C759]">
        <span className="w-5 h-5 rounded-full bg-[#e8f8ef] flex items-center justify-center text-xs font-bold">✓</span>
        <span className="text-xs font-medium">Safe concentration limits</span>
      </div>
    );
  }
  return (
    <div className="space-y-2">
      {warnings.slice(0, 5).map((w, i) => (
        <div key={`${w.ticker}-${i}`} className="flex items-center gap-2">
          <AlertTriangle size={12} className="text-[#ff9500] shrink-0" />
          <span className="text-xs text-slate-600 dark:text-slate-400 flex-1 truncate">
            <span className="font-bold">{w.ticker}</span> is <span className="tnum">{w.pct.toFixed(1)}%</span> of {w.portfolioLabel}
          </span>
        </div>
      ))}
    </div>
  );
});

const FDReminders = React.memo(function FDReminders({ alerts }: { alerts: FDMaturityAlert[] }) {
  if (alerts.length === 0) return <p className="text-xs text-slate-400 dark:text-slate-500">No upcoming maturities</p>;
  return (
    <div className="space-y-2">
      {alerts.map((a, i) => (
        <div key={`fd-${i}`} className="flex items-center gap-2">
          <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${a.daysLeft <= 7 ? 'bg-red-100 text-red-600 dark:bg-red-950/40 dark:text-red-400' : 'bg-amber-100 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400'}`}>
            <Landmark size={12} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate">{a.fd.bank_name}</p>
            <p className="text-[10px] text-slate-450 dark:text-slate-500">{a.portfolioLabel} · <span className="tnum">{formatINR(Number(a.fd.principal_amount))}</span></p>
          </div>
          <span className={`text-xs font-bold shrink-0 tnum ${a.daysLeft <= 7 ? 'text-red-500 dark:text-red-400' : 'text-amber-500 dark:text-amber-400'}`}>
            {a.daysLeft === 0 ? 'Today' : `${a.daysLeft}d`}
          </span>
        </div>
      ))}
    </div>
  );
});

const InsuranceReminders = React.memo(function InsuranceReminders({ alerts }: { alerts: InsuranceRenewalAlert[] }) {
  if (alerts.length === 0) return <p className="text-xs text-slate-400 dark:text-slate-500">No upcoming renewals</p>;
  return (
    <div className="space-y-2">
      {alerts.map((a, i) => (
        <div key={`ins-${i}`} className="flex items-center gap-2">
          <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${a.daysLeft <= 15 ? 'bg-[#fff0ef] text-[#ff3b30]' : 'bg-slate-100 dark:bg-zinc-800 text-[var(--text-secondary)]'}`}>
            <Shield size={12} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate">{a.insurance.policy_name}</p>
            <p className="text-[10px] text-slate-450 dark:text-slate-500">{a.portfolioLabel} · <span className="tnum">{formatINR(Number(a.insurance.premium_amount))}</span>/yr</p>
          </div>
          <span className={`text-xs font-bold shrink-0 tnum ${a.daysLeft <= 15 ? 'text-[#ff3b30]' : 'text-[var(--text-secondary)]'}`}>
            {a.daysLeft}d
          </span>
        </div>
      ))}
    </div>
  );
});

const BestWorstPerformers = React.memo(function BestWorstPerformers({ items }: { items: PortfolioBestWorst[] }) {
  const valid = items.filter((i) => i.best || i.worst);
  if (valid.length === 0) return <p className="text-xs text-slate-400 dark:text-slate-500">No holdings data</p>;
  return (
    <div className="space-y-3">
      {valid.map((pw, i) => (
        <div key={i}>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">{pw.portfolioLabel}</p>
          <div className="grid grid-cols-2 gap-2">
            {pw.best && (
              <div className="flex items-center gap-1.5 bg-emerald-100 dark:bg-emerald-950/40 rounded-lg px-2 py-1">
                <TrendingUp size={10} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-300 truncate">{pw.best.ticker}</span>
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 ml-auto shrink-0 tnum">{formatPercent(pw.best.pnlPercent, 1)}</span>
              </div>
            )}
            {pw.worst && (
              <div className="flex items-center gap-1.5 bg-red-100 dark:bg-red-950/40 rounded-lg px-2 py-1">
                <TrendingDown size={10} className="text-red-500 dark:text-red-400 shrink-0" />
                <span className="text-[10px] font-bold text-red-800 dark:text-red-300 truncate">{pw.worst.ticker}</span>
                <span className="text-[10px] font-bold text-red-500 dark:text-red-400 ml-auto shrink-0 tnum">{formatPercent(pw.worst.pnlPercent, 1)}</span>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
});

/* ── Main Component ── */

type InsightFilter = 'all' | 'stocks' | 'fds' | 'insurance' | 'high_risk' | 'due_soon';

const FILTERS: { id: InsightFilter; label: string }[] = [
  { id: 'all', label: 'All Insights' },
  { id: 'stocks', label: 'Stocks' },
  { id: 'fds', label: 'Deposits' },
  { id: 'insurance', label: 'Insurance' },
  { id: 'high_risk', label: 'Risk & Drift' },
  { id: 'due_soon', label: 'Upcoming' },
];

export default React.memo(function InsightsPanel({
  insights,
  portfolios,
  activePortfolio,
  onTargetsChanged,
}: InsightsPanelProps) {
  const [activeFilter, setActiveFilter] = useState<InsightFilter>('all');

  const [healthReport, setHealthReport] = useState<HealthReport>(() =>
    calculateHealthScore(portfolios, activePortfolio)
  );

  const isFirstMountHealth = useRef(true);

  useEffect(() => {
    if (isFirstMountHealth.current) {
      isFirstMountHealth.current = false;
      return;
    }
    let active = true;
    calculateHealthScoreAsync(portfolios, activePortfolio).then((report) => {
      if (active) setHealthReport(report);
    });
    return () => {
      active = false;
    };
  }, [portfolios, activePortfolio]);

  const f = activeFilter;
  const showStocks = f === 'all' || f === 'stocks' || f === 'high_risk';
  const showFDs = f === 'all' || f === 'fds' || f === 'due_soon';
  const showInsurance = f === 'all' || f === 'insurance' || f === 'due_soon';
  const showRisk = f === 'all' || f === 'high_risk';
  const showDrift = f === 'all' || f === 'high_risk' || f === 'fds';

  // Section visibility checks
  const hasPerformanceCards = showStocks;
  const hasHealthCards = showStocks || showDrift || showRisk;
  const hasUpcomingCards = showFDs || showInsurance;

  return (
    <div role="region" aria-label="Portfolio Insights" className="space-y-6">
      
      {/* Header and Filter pills */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--border-subtle)] pb-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 text-[#007aff] flex items-center justify-center">
            <BarChart3 size={13} />
          </div>
          <h3 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-wider">Portfolio Insights</h3>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
          <Filter size={12} className="text-slate-400 shrink-0" />
          {FILTERS.map((filter) => {
            const isActive = activeFilter === filter.id;
            return (
              <button
                key={filter.id}
                onClick={() => setActiveFilter(filter.id)}
                className={`shrink-0 px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all duration-150 outline-none ${
                  isActive
                    ? 'bg-[#007aff] text-white shadow-sm'
                    : 'bg-white dark:bg-zinc-800 text-[var(--text-secondary)] border border-[var(--border-subtle)] hover:text-[var(--text-primary)] hover:border-slate-350'
                }`}
              >
                {filter.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 1. Performance Overview Section */}
      {hasPerformanceCards && (
        <div className="space-y-3">
          <h4 className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">Performance Overview</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card title="Today's Movers" icon={<Activity size={13} className="text-[#ff9500]" />}>
              <BiggestMovers movers={insights.biggestMovers} />
            </Card>
            <Card title="Top Holdings by Value" icon={<Crown size={13} className="text-[#007aff]" />}>
              <TopHoldings items={insights.topByValue} />
            </Card>
            <Card title="Best / Worst performers" icon={<Target size={13} className="text-purple-500" />}>
              <BestWorstPerformers items={insights.portfolioBestWorst} />
            </Card>
            <Card title="Top Gainers" icon={<TrendingUp size={13} className="text-[#34C759]" />}>
              <GainersList items={insights.topGainers} type="gain" />
            </Card>
          </div>
        </div>
      )}

      {/* 2. Portfolio Health Section */}
      {hasHealthCards && (
        <div className="space-y-3">
          <h4 className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">Portfolio Health &amp; Risk</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            <Card title="Health Score" icon={<Activity size={13} className="text-[#34C759]" />}>
              <div className="flex items-center gap-4">
                <div className="relative w-16 h-16 flex items-center justify-center shrink-0">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                    <circle
                      cx="18"
                      cy="18"
                      r="15.915"
                      className="text-slate-100 dark:text-zinc-700/60"
                      strokeWidth="3.5"
                      stroke="currentColor"
                      fill="none"
                    />
                    <circle
                      cx="18"
                      cy="18"
                      r="15.915"
                      className="text-[#34C759] transition-all duration-500"
                      strokeDasharray={`${healthReport.score} 100`}
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="none"
                    />
                  </svg>
                  <div className="absolute text-center">
                    <span className="text-xs font-extrabold text-[var(--text-primary)]">{healthReport.score}</span>
                    <span className="text-[6.5px] text-[var(--text-secondary)] block -mt-1">/100</span>
                  </div>
                </div>
                <div className="flex-1 space-y-1 overflow-y-auto max-h-[85px] pr-1 scrollbar-none">
                  {healthReport.strengths.slice(0, 2).map((s, idx) => (
                    <p key={`str-${idx}`} className="text-[9px] font-semibold text-[#34C759] truncate">{s}</p>
                  ))}
                  {healthReport.risks.slice(0, 2).map((r, idx) => (
                    <p key={`risk-${idx}`} className="text-[9px] font-semibold text-[#ff9500] truncate">{r}</p>
                  ))}
                </div>
              </div>
            </Card>

            {showDrift && (
              <Card
                title="Asset Allocation Drift"
                icon={<Target size={13} className="text-[var(--text-secondary)]" />}
                action={<AllocationTargetsSettings onSaved={onTargetsChanged} />}
              >
                <AllocationDrift
                  slices={insights.allocationSlices}
                  portfolios={portfolios}
                  activePortfolio={activePortfolio}
                />
              </Card>
            )}

            {showRisk && (
              <Card title="Concentration Risk" icon={<AlertTriangle size={13} className="text-[#ff9500]" />}>
                <ConcentrationRisk warnings={insights.concentrationWarnings} />
              </Card>
            )}

          </div>
        </div>
      )}

      {/* 3. Upcoming Actions Section */}
      {hasUpcomingCards && (
        <div className="space-y-3">
          <h4 className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">Upcoming Actions</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {showFDs && (
              <Card title="Upcoming FD Maturities (30d)" icon={<Landmark size={13} className="text-[#007aff]" />}>
                <FDReminders alerts={insights.fdMaturityAlerts} />
              </Card>
            )}

            {showInsurance && (
              <Card title="Upcoming Insurance Renewals (60d)" icon={<Shield size={13} className="text-rose-500" />}>
                <InsuranceReminders alerts={insights.insuranceRenewalAlerts} />
              </Card>
            )}
          </div>
        </div>
      )}

    </div>
  );
});
