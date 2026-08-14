import React, { useState, useMemo, useCallback } from 'react';
import { TrendingUp, TrendingDown, Landmark, Shield, Activity, Crown, Target, BarChart3, Filter } from './icons/AppIcons';
import { formatINR, formatPercent } from '../utils/formatters';
import {
  PortfolioInsights,
  HoldingInsight,
  FDMaturityAlert,
  InsuranceRenewalAlert,
  PortfolioBestWorst,
} from '../hooks/usePortfolioInsights';

import { Portfolio } from '../types/portfolio';

interface InsightsPanelProps {
  insights: PortfolioInsights;
  portfolios: Portfolio[];
  activePortfolio: Portfolio | null;
}

/* ── Clean Apple-style card wrapper ── */
const Card = React.memo(function Card({ title, icon, children, action }: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
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
  const totalVal = useMemo(() => items.reduce((s, i) => s + i.holding.currentValue, 0), [items]);
  if (items.length === 0) return <p className="text-xs text-[var(--text-tertiary)]">No holdings yet</p>;
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
  const valid = useMemo(() => items.filter((i) => i.best || i.worst), [items]);
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

type InsightFilter = 'all' | 'stocks' | 'fds' | 'insurance' | 'due_soon';

const FILTERS: { id: InsightFilter; label: string }[] = [
  { id: 'all', label: 'All Insights' },
  { id: 'stocks', label: 'Stocks' },
  { id: 'fds', label: 'Deposits' },
  { id: 'insurance', label: 'Insurance' },
  { id: 'due_soon', label: 'Upcoming' },
];

export default React.memo(function InsightsPanel({
  insights,
}: InsightsPanelProps) {
  const [activeFilter, setActiveFilter] = useState<InsightFilter>('all');
  const handleFilterClick = useCallback((id: InsightFilter) => {
    setActiveFilter(id);
  }, []);

  const f = activeFilter;
  const showStocks = f === 'all' || f === 'stocks';
  const showFDs = f === 'all' || f === 'fds' || f === 'due_soon';
  const showInsurance = f === 'all' || f === 'insurance' || f === 'due_soon';

  const hasPerformanceCards = showStocks;
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
                onClick={() => handleFilterClick(filter.id)}
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

      {/* 2. Upcoming Actions Section */}
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
