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
    <div className="apple-card p-4 flex flex-col h-full min-w-0 transition-shadow hover:shadow-[var(--shadow-card)]">
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
  if (items.length === 0) return <p className="text-xs text-[var(--text-tertiary)]">No holdings yet</p>;
  const totalVal = items.reduce((s, i) => s + i.holding.currentValue, 0);
  return (
    <div className="space-y-2">
      {items.map((item, idx) => {
        const alloc = totalVal > 0 ? (item.holding.currentValue / totalVal) * 100 : 0;
        return (
          <div key={`${item.holding.ticker}-${idx}`} className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-[var(--radius-small)] bg-[var(--accent-blue-soft)] text-[var(--accent-blue)] flex items-center justify-center text-label-micro font-bold shrink-0">
              {idx + 1}
            </span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-[var(--text-primary)] truncate">{item.holding.ticker}</span>
                <span className="text-label-micro text-[var(--text-tertiary)] truncate hidden sm:inline">{item.portfolioLabel}</span>
              </div>
            </div>
            <span className="text-xs font-bold text-[var(--text-primary)] shrink-0 tnum">{formatINR(item.holding.currentValue)}</span>
            <span className="text-label-micro text-[var(--text-tertiary)] shrink-0 w-10 text-right tnum">{alloc.toFixed(1)}%</span>
          </div>
        );
      })}
    </div>
  );
});

const GainersList = React.memo(function GainersList({ items, type }: { items: HoldingInsight[]; type: 'gain' | 'loss' }) {
  if (items.length === 0) return <p className="text-xs text-[var(--text-tertiary)]">None</p>;
  return (
    <div className="space-y-2">
      {items.map((item, idx) => (
        <div key={`${item.holding.ticker}-${idx}`} className="flex items-center gap-2">
          <span className={`w-5 h-5 rounded-[var(--radius-small)] flex items-center justify-center shrink-0 ${type === 'gain' ? 'bg-[var(--positive-soft)] text-[var(--positive)]' : 'bg-[var(--negative-soft)] text-[var(--negative)]'}`}>
            {type === 'gain' ? <TrendingUp size={10} aria-hidden="true" /> : <TrendingDown size={10} aria-hidden="true" />}
          </span>
          <span className="text-xs font-bold text-[var(--text-primary)] truncate flex-1">{item.holding.ticker}</span>
          <span className={`text-xs font-bold shrink-0 tnum ${type === 'gain' ? 'text-[var(--positive)]' : 'text-[var(--negative)]'}`}>
            {formatPercent(item.holding.pnlPercent, 1)}
          </span>
        </div>
      ))}
    </div>
  );
});

const BiggestMovers = React.memo(function BiggestMovers({ movers }: { movers: HoldingInsight[] }) {
  if (movers.length === 0) return <p className="text-xs text-[var(--text-tertiary)]">No data</p>;
  return (
    <div className="space-y-2">
      {movers.map((mover, idx) => {
        const h = mover.holding;
        const isUp = h.todayPnLPercent >= 0;
        return (
          <div key={`${h.ticker}-${idx}`} className="flex items-center gap-2.5">
            <div className={`w-7 h-7 rounded-[var(--radius-small)] flex items-center justify-center shrink-0 ${isUp ? 'bg-[var(--positive-soft)] text-[var(--positive)]' : 'bg-[var(--negative-soft)] text-[var(--negative)]'}`}>
              {isUp ? <TrendingUp size={13} aria-hidden="true" /> : <TrendingDown size={13} aria-hidden="true" />}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-[var(--text-primary)] truncate">{h.ticker}</span>
                <span className="text-[9px] text-[var(--text-tertiary)] truncate">{mover.portfolioLabel}</span>
              </div>
              <p className="text-[9px] text-[var(--text-tertiary)] truncate leading-none mt-0.5">{h.stockName}</p>
            </div>
            <div className="text-right shrink-0">
              <p className={`text-xs font-bold tnum ${isUp ? 'text-[var(--positive)]' : 'text-[var(--negative)]'}`}>
                {formatPercent(h.todayPnLPercent, 2)}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
});

const ASSET_COLORS: Record<string, string> = {
  'Stocks': '#387ed1',
  'Fixed Deposits': '#f59e0b',
  'Gold': '#eab308',
  'Real Estate': '#a855f7',
};

const DualRingDonut = React.memo(function DualRingDonut({ slices }: { slices: AllocationSlice[] }) {
  const outerR = 30;
  const innerR = 21;
  const outerCircum = 2 * Math.PI * outerR;
  const innerCircum = 2 * Math.PI * innerR;

  let outerOffset = 0;
  let innerOffset = 0;

  return (
    <div className="flex items-center gap-3 py-1 bg-[var(--surface-secondary)]/50 p-2.5 rounded-[var(--radius-medium)] border border-[var(--border-subtle)] mb-2">
      <div className="relative w-16 h-16 shrink-0">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 80 80">
          {/* Background tracks */}
          <circle cx="40" cy="40" r={outerR} stroke="var(--border-subtle)" strokeWidth="5" fill="none" opacity="0.3" />
          <circle cx="40" cy="40" r={innerR} stroke="var(--border-subtle)" strokeWidth="4" fill="none" opacity="0.3" />

          {/* Inner Ring: Target Slices */}
          {slices.map((s) => {
            const dash = Math.max((s.target / 100) * innerCircum - 1, 0);
            const currentOffset = innerOffset;
            innerOffset += s.target;
            const color = ASSET_COLORS[s.label] || '#64748b';
            return (
              <circle
                key={`target-${s.label}`}
                cx="40"
                cy="40"
                r={innerR}
                stroke={color}
                strokeWidth="4"
                strokeDasharray={`${dash} ${innerCircum}`}
                strokeDashoffset={-(currentOffset / 100) * innerCircum}
                fill="none"
                opacity="0.45"
              />
            );
          })}

          {/* Outer Ring: Actual Slices */}
          {slices.map((s) => {
            const dash = Math.max((s.actual / 100) * outerCircum - 1, 0);
            const currentOffset = outerOffset;
            outerOffset += s.actual;
            const color = ASSET_COLORS[s.label] || '#64748b';
            return (
              <circle
                key={`actual-${s.label}`}
                cx="40"
                cy="40"
                r={outerR}
                stroke={color}
                strokeWidth="5"
                strokeDasharray={`${dash} ${outerCircum}`}
                strokeDashoffset={-(currentOffset / 100) * outerCircum}
                fill="none"
              />
            );
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-[9px] font-black text-[var(--text-tertiary)] uppercase">Drift</span>
        </div>
      </div>

      <div className="flex-1 space-y-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] text-[var(--text-secondary)]">
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[var(--accent-blue)] shrink-0" />
            <span className="font-bold">Outer: Live</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[var(--accent-blue)] opacity-40 shrink-0" />
            <span className="font-bold">Inner: Target</span>
          </div>
        </div>
        <p className="text-[9.5px] text-[var(--text-tertiary)] leading-tight">
          Visual multi-asset drift comparison against portfolio target allocation
        </p>
      </div>
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

  if (slices.every((s) => s.value === 0)) return <p className="text-xs text-[var(--text-tertiary)]">No assets yet</p>;
  return (
    <div className="space-y-2.5">
      {/* Dual-Ring Visual Rebalancing Donut */}
      <DualRingDonut slices={slices} />

      {slices.map((s) => {
        const driftAbs = Math.abs(s.drift);
        const isOver = s.drift > 0;
        const severityColor = driftAbs > 20 ? 'text-[var(--negative)]' : driftAbs > 10 ? 'text-[var(--warning)]' : 'text-[var(--positive)]';
        const barColor = driftAbs > 20 ? 'var(--negative)' : driftAbs > 10 ? 'var(--warning)' : 'var(--positive)';
        
        return (
          <div key={s.label}>
            <div className="flex items-center justify-between mb-0.5">
              <span className="text-xs font-semibold text-[var(--text-secondary)]">{s.label}</span>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-[var(--text-tertiary)]">{s.target.toFixed(0)}% target</span>
                <span className={`text-xs font-bold tnum ${severityColor}`}>
                  {s.actual.toFixed(1)}% {isOver ? '↑' : '↓'}
                </span>
              </div>
            </div>
            <div className="h-1.5 bg-[var(--surface-secondary)] rounded-[var(--radius-pill)] overflow-hidden relative border border-[var(--border-subtle)]">
              <div
                className="h-full rounded-[var(--radius-pill)] transition-all duration-500"
                style={{
                  width: `${Math.min(s.actual, 100)}%`,
                  backgroundColor: barColor,
                }}
              />
              <div
                className="absolute top-0 h-full w-0.5 bg-[var(--text-secondary)]"
                style={{ left: `${s.target}%` }}
              />
            </div>
          </div>
        );
      })}

      <div className="mt-4 pt-3 border-t border-[var(--border-subtle)] space-y-2">
        <p className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider">
          Rebalancing Advice
        </p>
        <div className="grid grid-cols-2 gap-2 text-[10.5px]">
          {rebalancingAdvice.map((advice) => {
            const isHold = advice.action === 'HOLD';
            return (
              <div key={advice.assetClass} className="flex justify-between items-center bg-[var(--surface-secondary)] border border-[var(--border-subtle)] px-2.5 py-1.5 rounded-[var(--radius-medium)]">
                <span className="font-semibold text-[var(--text-secondary)]">{advice.assetClass}</span>
                <span className={`font-bold ${isHold ? 'text-[var(--text-tertiary)]' : advice.action === 'BUY' ? 'text-[var(--positive)]' : 'text-[var(--negative)]'}`}>
                  {advice.action === 'HOLD' ? 'HOLD' : `${advice.action} (${advice.formattedAmount})`}
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
      <div className="flex items-center gap-2 text-[var(--positive)]">
        <span className="w-5 h-5 rounded-[var(--radius-pill)] bg-[var(--positive-soft)] flex items-center justify-center text-xs font-bold" aria-hidden="true">✓</span>
        <span className="text-xs font-medium">Safe concentration limits</span>
      </div>
    );
  }
  return (
    <div className="space-y-2">
      {warnings.slice(0, 5).map((w, i) => (
        <div key={`${w.ticker}-${i}`} className="flex items-center gap-2">
          <AlertTriangle size={12} className="text-[var(--warning)] shrink-0" aria-hidden="true" />
          <span className="text-xs text-[var(--text-secondary)] flex-1 truncate">
            <span className="font-bold">{w.ticker}</span> is <span className="tnum">{w.pct.toFixed(1)}%</span> of {w.portfolioLabel}
          </span>
        </div>
      ))}
    </div>
  );
});

const FDReminders = React.memo(function FDReminders({ alerts }: { alerts: FDMaturityAlert[] }) {
  if (alerts.length === 0) return <p className="text-xs text-[var(--text-tertiary)]">No upcoming maturities</p>;
  return (
    <div className="space-y-2">
      {alerts.map((a, i) => (
        <div key={`fd-${i}`} className="flex items-center gap-2">
          <div className={`w-6 h-6 rounded-[var(--radius-medium)] flex items-center justify-center shrink-0 ${a.daysLeft <= 7 ? 'bg-[var(--negative-soft)] text-[var(--negative)]' : 'bg-[var(--warning-soft)] text-[var(--warning)]'}`}>
            <Landmark size={12} aria-hidden="true" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-[var(--text-primary)] truncate">{a.fd.bank_name}</p>
            <p className="text-[10px] text-[var(--text-tertiary)]">{a.portfolioLabel} · <span className="tnum">{formatINR(Number(a.fd.principal_amount))}</span></p>
          </div>
          <span className={`text-xs font-bold shrink-0 tnum ${a.daysLeft <= 7 ? 'text-[var(--negative)]' : 'text-[var(--warning)]'}`}>
            {a.daysLeft === 0 ? 'Today' : `${a.daysLeft}d`}
          </span>
        </div>
      ))}
    </div>
  );
});

const InsuranceReminders = React.memo(function InsuranceReminders({ alerts }: { alerts: InsuranceRenewalAlert[] }) {
  if (alerts.length === 0) return <p className="text-xs text-[var(--text-tertiary)]">No upcoming renewals</p>;
  return (
    <div className="space-y-2">
      {alerts.map((a, i) => (
        <div key={`ins-${i}`} className="flex items-center gap-2">
          <div className={`w-6 h-6 rounded-[var(--radius-medium)] flex items-center justify-center shrink-0 ${a.daysLeft <= 15 ? 'bg-[var(--negative-soft)] text-[var(--negative)]' : 'bg-[var(--surface-secondary)] text-[var(--text-secondary)]'}`}>
            <Shield size={12} aria-hidden="true" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-[var(--text-primary)] truncate">{a.insurance.policy_name}</p>
            <p className="text-[10px] text-[var(--text-tertiary)]">{a.portfolioLabel} · <span className="tnum">{formatINR(Number(a.insurance.premium_amount))}</span>/yr</p>
          </div>
          <span className={`text-xs font-bold shrink-0 tnum ${a.daysLeft <= 15 ? 'text-[var(--negative)]' : 'text-[var(--text-secondary)]'}`}>
            {a.daysLeft}d
          </span>
        </div>
      ))}
    </div>
  );
});

const BestWorstPerformers = React.memo(function BestWorstPerformers({ items }: { items: PortfolioBestWorst[] }) {
  const valid = items.filter((i) => i.best || i.worst);
  if (valid.length === 0) return <p className="text-xs text-[var(--text-tertiary)]">No holdings data</p>;
  return (
    <div className="space-y-3">
      {valid.map((pw, i) => (
        <div key={i}>
          <p className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider mb-1">{pw.portfolioLabel}</p>
          <div className="grid grid-cols-2 gap-2">
            {pw.best && (
              <div className="flex items-center gap-1.5 bg-[var(--positive-soft)] rounded-[var(--radius-medium)] px-2 py-1">
                <TrendingUp size={10} className="text-[var(--positive)] shrink-0" aria-hidden="true" />
                <span className="text-[10px] font-bold text-[var(--positive)] truncate">{pw.best.ticker}</span>
                <span className="text-[10px] font-bold text-[var(--positive)] ml-auto shrink-0 tnum">{formatPercent(pw.best.pnlPercent, 1)}</span>
              </div>
            )}
            {pw.worst && (
              <div className="flex items-center gap-1.5 bg-[var(--negative-soft)] rounded-[var(--radius-medium)] px-2 py-1">
                <TrendingDown size={10} className="text-[var(--negative)] shrink-0" aria-hidden="true" />
                <span className="text-[10px] font-bold text-[var(--negative)] truncate">{pw.worst.ticker}</span>
                <span className="text-[10px] font-bold text-[var(--negative)] ml-auto shrink-0 tnum">{formatPercent(pw.worst.pnlPercent, 1)}</span>
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
          <div className="w-6 h-6 rounded-[var(--radius-medium)] bg-[var(--accent-blue-soft)] text-[var(--accent-blue)] flex items-center justify-center">
            <BarChart3 size={13} aria-hidden="true" />
          </div>
          <h3 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-wider">Portfolio Insights</h3>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
          <Filter size={12} className="text-[var(--text-tertiary)] shrink-0" aria-hidden="true" />
          {FILTERS.map((filter) => {
            const isActive = activeFilter === filter.id;
            return (
              <button
                key={filter.id}
                onClick={() => setActiveFilter(filter.id)}
                className={`shrink-0 px-2.5 py-1 rounded-[var(--radius-medium)] text-[10px] font-bold transition-all duration-150 outline-none ios-press ${
                  isActive
                    ? 'bg-[var(--accent-blue)] text-[var(--surface)] shadow-sm'
                    : 'bg-[var(--surface)] text-[var(--text-secondary)] border border-[var(--border-subtle)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-secondary)]'
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <Card title="Today's Movers" icon={<Activity size={13} className="text-[var(--warning)]" aria-hidden="true" />}>
              <BiggestMovers movers={insights.biggestMovers} />
            </Card>
            <Card title="Top Holdings by Value" icon={<Crown size={13} className="text-[var(--accent-blue)]" aria-hidden="true" />}>
              <TopHoldings items={insights.topByValue} />
            </Card>
            <Card title="Best / Worst performers" icon={<Target size={13} className="text-purple-500" aria-hidden="true" />}>
              <BestWorstPerformers items={insights.portfolioBestWorst} />
            </Card>
            <Card title="Top Gainers" icon={<TrendingUp size={13} className="text-[var(--positive)]" aria-hidden="true" />}>
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
            
            <Card title="Health Score" icon={<Activity size={13} className="text-[var(--positive)]" aria-hidden="true" />}>
              <div className="flex items-center gap-4">
                <div className="relative w-16 h-16 flex items-center justify-center shrink-0">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                    <circle
                      cx="18"
                      cy="18"
                      r="15.915"
                      className="text-[var(--surface-secondary)]"
                      strokeWidth="3.5"
                      stroke="currentColor"
                      fill="none"
                    />
                    <circle
                      cx="18"
                      cy="18"
                      r="15.915"
                      className="text-[var(--positive)] transition-all duration-500"
                      strokeDasharray={`${healthReport.score} 100`}
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="none"
                    />
                  </svg>
                  <div className="absolute text-center">
                    <span className="text-xs font-extrabold text-[var(--text-primary)]">{healthReport.score}</span>
                    <span className="text-[9px] text-[var(--text-secondary)] block -mt-1">/100</span>
                  </div>
                </div>
                <div className="flex-1 space-y-1 overflow-y-auto max-h-[85px] pr-1 scrollbar-none">
                  {healthReport.strengths.slice(0, 2).map((s, idx) => (
                    <p key={`str-${idx}`} className="text-[9px] font-semibold text-[var(--positive)] truncate">{s}</p>
                  ))}
                  {healthReport.risks.slice(0, 2).map((r, idx) => (
                    <p key={`risk-${idx}`} className="text-[9px] font-semibold text-[var(--warning)] truncate">{r}</p>
                  ))}
                </div>
              </div>
            </Card>

            {showDrift && (
              <Card
                title="Asset Allocation Drift"
                icon={<Target size={13} className="text-[var(--text-secondary)]" aria-hidden="true" />}
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
              <Card title="Concentration Risk" icon={<AlertTriangle size={13} className="text-[var(--warning)]" aria-hidden="true" />}>
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
              <Card title="Upcoming FD Maturities (30d)" icon={<Landmark size={13} className="text-[var(--accent-blue)]" aria-hidden="true" />}>
                <FDReminders alerts={insights.fdMaturityAlerts} />
              </Card>
            )}

            {showInsurance && (
              <Card title="Upcoming Insurance Renewals (60d)" icon={<Shield size={13} className="text-[var(--negative)]" aria-hidden="true" />}>
                <InsuranceReminders alerts={insights.insuranceRenewalAlerts} />
              </Card>
            )}
          </div>
        </div>
      )}

    </div>
  );
});
