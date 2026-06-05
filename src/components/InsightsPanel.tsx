import React, { useState } from 'react';
import { TrendingUp, TrendingDown, AlertTriangle, Landmark, Shield, Activity, Crown, Target, BarChart3, Filter } from 'lucide-react';
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

interface InsightsPanelProps {
  insights: PortfolioInsights;
  /** Called when allocation targets change so the parent re-fetches insights */
  onTargetsChanged?: () => void;
}

/* ── Tiny reusable card wrapper ── */
const Card = React.memo(function Card({ title, icon, children, accent = 'slate', action }: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  accent?: string;
  action?: React.ReactNode;
}) {
  const borderMap: Record<string, string> = {
    slate: 'border-slate-100 dark:border-slate-700',
    emerald: 'border-emerald-100 dark:border-emerald-800/40',
    red: 'border-red-100 dark:border-red-800/40',
    amber: 'border-amber-100 dark:border-amber-800/40',
    blue: 'border-blue-100 dark:border-blue-800/40',
    rose: 'border-rose-100 dark:border-rose-800/40',
    violet: 'border-violet-100 dark:border-violet-800/40',
  };
  return (
    <div className={`bg-white dark:bg-slate-800 rounded-2xl border ${borderMap[accent] ?? borderMap.slate} shadow-sm p-4 hover:shadow-md transition-shadow duration-200`}>
      <div className="flex items-center gap-2 mb-3">
        {icon}
        <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex-1">{title}</h4>
        {action}
      </div>
      {children}
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
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate">{item.holding.ticker}</span>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 truncate hidden sm:inline">{item.portfolioLabel}</span>
              </div>
            </div>
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 shrink-0">{formatINR(item.holding.currentValue)}</span>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 shrink-0 w-10 text-right">{alloc.toFixed(1)}%</span>
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
          <span className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 ${type === 'gain' ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400' : 'bg-red-50 dark:bg-red-950/20 text-red-500 dark:text-red-400'}`}>
            {type === 'gain' ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
          </span>
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate flex-1">{item.holding.ticker}</span>
          <span className={`text-xs font-bold shrink-0 ${type === 'gain' ? 'text-emerald-600 dark:text-emerald-500' : 'text-red-500 dark:text-red-450'}`}>
            {formatPercent(item.holding.pnlPercent, 1)}
          </span>
        </div>
      ))}
    </div>
  );
});

const BiggestMover = React.memo(function BiggestMover({ mover }: { mover: HoldingInsight | null }) {
  if (!mover) return <p className="text-xs text-slate-400 dark:text-slate-500">No data</p>;
  const h = mover.holding;
  const isUp = h.todayPnLPercent >= 0;
  return (
    <div className="flex items-center gap-3">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isUp ? 'bg-emerald-50 dark:bg-emerald-950/30' : 'bg-red-50 dark:bg-red-950/30'}`}>
        {isUp ? <TrendingUp size={20} className="text-emerald-600 dark:text-emerald-400" /> : <TrendingDown size={20} className="text-red-500 dark:text-red-400" />}
      </div>
      <div>
        <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{h.ticker}</p>
        <p className="text-[10px] text-slate-400 dark:text-slate-500">{h.stockName}</p>
      </div>
      <div className="ml-auto text-right">
        <p className={`text-sm font-bold ${isUp ? 'text-emerald-600 dark:text-emerald-500' : 'text-red-500 dark:text-red-450'}`}>
          {formatPercent(h.todayPnLPercent, 2)}
        </p>
        <p className="text-[10px] text-slate-400 dark:text-slate-500">{mover.portfolioLabel}</p>
      </div>
    </div>
  );
});

const AllocationDrift = React.memo(function AllocationDrift({ slices }: { slices: AllocationSlice[] }) {
  if (slices.every((s) => s.value === 0)) return <p className="text-xs text-slate-400 dark:text-slate-500">No assets yet</p>;
  return (
    <div className="space-y-2.5">
      {slices.map((s) => {
        const driftAbs = Math.abs(s.drift);
        const isOver = s.drift > 0;
        const severity = driftAbs > 20 ? 'text-red-500 dark:text-red-400' : driftAbs > 10 ? 'text-amber-500 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400';
        return (
          <div key={s.label}>
            <div className="flex items-center justify-between mb-0.5">
              <span className="text-xs font-medium text-slate-600 dark:text-slate-300">{s.label}</span>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-400 dark:text-slate-500">{s.target.toFixed(0)}% target</span>
                <span className={`text-xs font-bold ${severity}`}>
                  {s.actual.toFixed(1)}% {isOver ? '↑' : '↓'}
                </span>
              </div>
            </div>
            <div className="h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden relative">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(s.actual, 100)}%`,
                  backgroundColor: driftAbs > 20 ? '#ef4444' : driftAbs > 10 ? '#f59e0b' : '#10b981',
                }}
              />
              {/* Target marker */}
              <div
                className="absolute top-0 h-full w-0.5 bg-slate-400 dark:bg-slate-500"
                style={{ left: `${s.target}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
});

const ConcentrationRisk = React.memo(function ConcentrationRisk({ warnings }: { warnings: ConcentrationWarning[] }) {
  if (warnings.length === 0) {
    return (
      <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
        <div className="w-6 h-6 rounded-full bg-emerald-50 dark:bg-emerald-950/20 flex items-center justify-center">✓</div>
        <span className="text-xs font-medium">No concentration risk detected</span>
      </div>
    );
  }
  return (
    <div className="space-y-2">
      {warnings.slice(0, 5).map((w, i) => (
        <div key={`${w.ticker}-${i}`} className="flex items-center gap-2">
          <AlertTriangle size={12} className="text-amber-500 dark:text-amber-500 shrink-0" />
          <span className="text-xs text-slate-600 dark:text-slate-300 flex-1 truncate">
            <span className="font-bold">{w.ticker}</span> is {w.pct.toFixed(1)}% of {w.portfolioLabel}
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
          <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${a.daysLeft <= 7 ? 'bg-red-50 dark:bg-red-950/30 text-red-500 dark:text-red-400' : 'bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400'}`}>
            <Landmark size={12} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate">{a.fd.bank_name}</p>
            <p className="text-[10px] text-slate-400 dark:text-slate-500">{a.portfolioLabel} · {formatINR(Number(a.fd.principal_amount))}</p>
          </div>
          <span className={`text-xs font-bold shrink-0 ${a.daysLeft <= 7 ? 'text-red-500 dark:text-red-400' : 'text-amber-600 dark:text-amber-500'}`}>
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
          <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${a.daysLeft <= 15 ? 'bg-red-50 dark:bg-red-950/30 text-red-500 dark:text-red-400' : 'bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-500'}`}>
            <Shield size={12} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate">{a.insurance.policy_name}</p>
            <p className="text-[10px] text-slate-400 dark:text-slate-500">{a.portfolioLabel} · {formatINR(Number(a.insurance.premium_amount))}/yr</p>
          </div>
          <span className={`text-xs font-bold shrink-0 ${a.daysLeft <= 15 ? 'text-red-500 dark:text-red-450' : 'text-rose-600 dark:text-rose-400'}`}>
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
          <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">{pw.portfolioLabel}</p>
          <div className="grid grid-cols-2 gap-2">
            {pw.best && (
              <div className="flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg px-2 py-1.5">
                <TrendingUp size={10} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 truncate">{pw.best.ticker}</span>
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 ml-auto shrink-0">{formatPercent(pw.best.pnlPercent, 1)}</span>
              </div>
            )}
            {pw.worst && (
              <div className="flex items-center gap-1.5 bg-red-50 dark:bg-red-950/30 rounded-lg px-2 py-1.5">
                <TrendingDown size={10} className="text-red-500 dark:text-red-400 shrink-0" />
                <span className="text-[11px] font-bold text-red-600 dark:text-red-300 truncate">{pw.worst.ticker}</span>
                <span className="text-[10px] font-bold text-red-500 dark:text-red-400 ml-auto shrink-0">{formatPercent(pw.worst.pnlPercent, 1)}</span>
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
  { id: 'all', label: 'All' },
  { id: 'stocks', label: 'Stocks' },
  { id: 'fds', label: 'FDs' },
  { id: 'insurance', label: 'Insurance' },
  { id: 'high_risk', label: 'High Risk' },
  { id: 'due_soon', label: 'Due Soon' },
];

export default React.memo(function InsightsPanel({ insights, onTargetsChanged }: InsightsPanelProps) {
  const [activeFilter, setActiveFilter] = useState<InsightFilter>('all');

  const f = activeFilter;
  const showStocks = f === 'all' || f === 'stocks' || f === 'high_risk';
  const showFDs = f === 'all' || f === 'fds' || f === 'due_soon';
  const showInsurance = f === 'all' || f === 'insurance' || f === 'due_soon';
  const showRisk = f === 'all' || f === 'high_risk';
  const showDrift = f === 'all' || f === 'high_risk' || f === 'fds';

  return (
    <div
      role="region"
      aria-label="Portfolio Insights"
      className="space-y-4"
    >
      <div className="flex items-center gap-2 flex-wrap">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-sm">
          <BarChart3 size={14} className="text-white" />
        </div>
        <h2 className="text-sm font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">Portfolio Insights</h2>
      </div>

      {/* Filter pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 -mb-1 scrollbar-none">
        <Filter size={13} className="text-slate-400 dark:text-slate-500 shrink-0" />
        {FILTERS.map((filter) => {
          const isActive = activeFilter === filter.id;
          return (
            <button
              key={filter.id}
              onClick={() => setActiveFilter(filter.id)}
              className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/20'
                  : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
            >
              {filter.label}
            </button>
          );
        })}
      </div>

      {/* Row 1 — Biggest Mover + Top Holdings */}
      {showStocks && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card
            title="Today's Biggest Mover"
            icon={<Activity size={14} className="text-amber-500 dark:text-amber-405" />}
            accent="amber"
          >
            <BiggestMover mover={insights.biggestMover} />
          </Card>

          <Card
            title="Top 5 by Value"
            icon={<Crown size={14} className="text-blue-500" />}
            accent="blue"
          >
            <TopHoldings items={insights.topByValue} />
          </Card>

          <Card
            title="Best / Worst by Member"
            icon={<Target size={14} className="text-violet-500" />}
            accent="violet"
          >
            <BestWorstPerformers items={insights.portfolioBestWorst} />
          </Card>
        </div>
      )}

      {/* Row 2 — Gainers, Losers, Allocation Drift */}
      {(showStocks || showDrift) && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {showStocks && (
            <Card
              title="Top Gainers"
              icon={<TrendingUp size={14} className="text-emerald-500" />}
              accent="emerald"
            >
              <GainersList items={insights.topGainers} type="gain" />
            </Card>
          )}

          {showStocks && (
            <Card
              title="Top Losers"
              icon={<TrendingDown size={14} className="text-red-500" />}
              accent="red"
            >
              <GainersList items={insights.topLosers} type="loss" />
            </Card>
          )}

          {showDrift && (
            <Card
              title="Asset Allocation Drift"
              icon={<Target size={14} className="text-slate-500" />}
              accent="slate"
              action={<AllocationTargetsSettings onSaved={onTargetsChanged} />}
            >
              <AllocationDrift slices={insights.allocationSlices} />
            </Card>
          )}
        </div>
      )}

      {/* Row 3 — Concentration + Reminders */}
      {(showRisk || showFDs || showInsurance) && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {showRisk && (
            <Card
              title="Concentration Risk"
              icon={<AlertTriangle size={14} className="text-amber-500" />}
              accent="amber"
            >
              <ConcentrationRisk warnings={insights.concentrationWarnings} />
            </Card>
          )}

          {showFDs && (
            <Card
              title="FD Maturity (30d)"
              icon={<Landmark size={14} className="text-blue-500" />}
              accent="blue"
            >
              <FDReminders alerts={insights.fdMaturityAlerts} />
            </Card>
          )}

          {showInsurance && (
            <Card
              title="Insurance Renewal (60d)"
              icon={<Shield size={14} className="text-rose-500" />}
              accent="rose"
            >
              <InsuranceReminders alerts={insights.insuranceRenewalAlerts} />
            </Card>
          )}
        </div>
      )}
    </div>
  );
});
