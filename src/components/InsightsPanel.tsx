import { TrendingUp, TrendingDown, AlertTriangle, Landmark, Shield, Activity, Crown, Target, BarChart3 } from 'lucide-react';
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

interface InsightsPanelProps {
  insights: PortfolioInsights;
}

/* ── Tiny reusable card wrapper ── */
function Card({ title, icon, children, accent = 'slate' }: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  accent?: string;
}) {
  const borderMap: Record<string, string> = {
    slate: 'border-slate-100',
    emerald: 'border-emerald-100',
    red: 'border-red-100',
    amber: 'border-amber-100',
    blue: 'border-blue-100',
    rose: 'border-rose-100',
    violet: 'border-violet-100',
  };
  return (
    <div className={`bg-white rounded-2xl border ${borderMap[accent] ?? borderMap.slate} shadow-sm p-4 hover:shadow-md transition-shadow duration-200`}>
      <div className="flex items-center gap-2 mb-3">
        {icon}
        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">{title}</h4>
      </div>
      {children}
    </div>
  );
}

/* ── Sub-sections ── */

function TopHoldings({ items }: { items: HoldingInsight[] }) {
  if (items.length === 0) return <p className="text-xs text-slate-400">No holdings yet</p>;
  const totalVal = items.reduce((s, i) => s + i.holding.currentValue, 0);
  return (
    <div className="space-y-2">
      {items.map((item, idx) => {
        const alloc = totalVal > 0 ? (item.holding.currentValue / totalVal) * 100 : 0;
        return (
          <div key={`${item.holding.ticker}-${idx}`} className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center text-[10px] font-bold shrink-0">
              {idx + 1}
            </span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-slate-700 truncate">{item.holding.ticker}</span>
                <span className="text-[10px] text-slate-400 truncate hidden sm:inline">{item.portfolioLabel}</span>
              </div>
            </div>
            <span className="text-xs font-bold text-slate-800 shrink-0">{formatINR(item.holding.currentValue)}</span>
            <span className="text-[10px] text-slate-400 shrink-0 w-10 text-right">{alloc.toFixed(1)}%</span>
          </div>
        );
      })}
    </div>
  );
}

function GainersList({ items, type }: { items: HoldingInsight[]; type: 'gain' | 'loss' }) {
  if (items.length === 0) return <p className="text-xs text-slate-400">None</p>;
  return (
    <div className="space-y-2">
      {items.map((item, idx) => (
        <div key={`${item.holding.ticker}-${idx}`} className="flex items-center gap-2">
          <span className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 ${type === 'gain' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'}`}>
            {type === 'gain' ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
          </span>
          <span className="text-xs font-bold text-slate-700 truncate flex-1">{item.holding.ticker}</span>
          <span className={`text-xs font-bold shrink-0 ${type === 'gain' ? 'text-emerald-600' : 'text-red-500'}`}>
            {formatPercent(item.holding.pnlPercent, 1)}
          </span>
        </div>
      ))}
    </div>
  );
}

function BiggestMover({ mover }: { mover: HoldingInsight | null }) {
  if (!mover) return <p className="text-xs text-slate-400">No data</p>;
  const h = mover.holding;
  const isUp = h.todayPnLPercent >= 0;
  return (
    <div className="flex items-center gap-3">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isUp ? 'bg-emerald-50' : 'bg-red-50'}`}>
        {isUp ? <TrendingUp size={20} className="text-emerald-600" /> : <TrendingDown size={20} className="text-red-500" />}
      </div>
      <div>
        <p className="text-sm font-bold text-slate-800">{h.ticker}</p>
        <p className="text-[10px] text-slate-400">{h.stockName}</p>
      </div>
      <div className="ml-auto text-right">
        <p className={`text-sm font-bold ${isUp ? 'text-emerald-600' : 'text-red-500'}`}>
          {formatPercent(h.todayPnLPercent, 2)}
        </p>
        <p className="text-[10px] text-slate-400">{mover.portfolioLabel}</p>
      </div>
    </div>
  );
}

function AllocationDrift({ slices }: { slices: AllocationSlice[] }) {
  if (slices.every((s) => s.value === 0)) return <p className="text-xs text-slate-400">No assets yet</p>;
  return (
    <div className="space-y-2.5">
      {slices.map((s) => {
        const driftAbs = Math.abs(s.drift);
        const isOver = s.drift > 0;
        const severity = driftAbs > 20 ? 'text-red-500' : driftAbs > 10 ? 'text-amber-500' : 'text-emerald-600';
        return (
          <div key={s.label}>
            <div className="flex items-center justify-between mb-0.5">
              <span className="text-xs font-medium text-slate-600">{s.label}</span>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-400">{s.target.toFixed(0)}% target</span>
                <span className={`text-xs font-bold ${severity}`}>
                  {s.actual.toFixed(1)}% {isOver ? '↑' : '↓'}
                </span>
              </div>
            </div>
            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden relative">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(s.actual, 100)}%`,
                  backgroundColor: driftAbs > 20 ? '#ef4444' : driftAbs > 10 ? '#f59e0b' : '#10b981',
                }}
              />
              {/* Target marker */}
              <div
                className="absolute top-0 h-full w-0.5 bg-slate-400"
                style={{ left: `${s.target}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ConcentrationRisk({ warnings }: { warnings: ConcentrationWarning[] }) {
  if (warnings.length === 0) {
    return (
      <div className="flex items-center gap-2 text-emerald-600">
        <div className="w-6 h-6 rounded-full bg-emerald-50 flex items-center justify-center">✓</div>
        <span className="text-xs font-medium">No concentration risk detected</span>
      </div>
    );
  }
  return (
    <div className="space-y-2">
      {warnings.slice(0, 5).map((w, i) => (
        <div key={`${w.ticker}-${i}`} className="flex items-center gap-2">
          <AlertTriangle size={12} className="text-amber-500 shrink-0" />
          <span className="text-xs text-slate-600 flex-1 truncate">
            <span className="font-bold">{w.ticker}</span> is {w.pct.toFixed(1)}% of {w.portfolioLabel}
          </span>
        </div>
      ))}
    </div>
  );
}

function FDReminders({ alerts }: { alerts: FDMaturityAlert[] }) {
  if (alerts.length === 0) return <p className="text-xs text-slate-400">No upcoming maturities</p>;
  return (
    <div className="space-y-2">
      {alerts.map((a, i) => (
        <div key={`fd-${i}`} className="flex items-center gap-2">
          <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${a.daysLeft <= 7 ? 'bg-red-50 text-red-500' : 'bg-amber-50 text-amber-600'}`}>
            <Landmark size={12} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-slate-700 truncate">{a.fd.bank_name}</p>
            <p className="text-[10px] text-slate-400">{a.portfolioLabel} · {formatINR(Number(a.fd.principal_amount))}</p>
          </div>
          <span className={`text-xs font-bold shrink-0 ${a.daysLeft <= 7 ? 'text-red-500' : 'text-amber-600'}`}>
            {a.daysLeft === 0 ? 'Today' : `${a.daysLeft}d`}
          </span>
        </div>
      ))}
    </div>
  );
}

function InsuranceReminders({ alerts }: { alerts: InsuranceRenewalAlert[] }) {
  if (alerts.length === 0) return <p className="text-xs text-slate-400">No upcoming renewals</p>;
  return (
    <div className="space-y-2">
      {alerts.map((a, i) => (
        <div key={`ins-${i}`} className="flex items-center gap-2">
          <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${a.daysLeft <= 15 ? 'bg-red-50 text-red-500' : 'bg-rose-50 text-rose-600'}`}>
            <Shield size={12} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-slate-700 truncate">{a.insurance.policy_name}</p>
            <p className="text-[10px] text-slate-400">{a.portfolioLabel} · {formatINR(Number(a.insurance.premium_amount))}/yr</p>
          </div>
          <span className={`text-xs font-bold shrink-0 ${a.daysLeft <= 15 ? 'text-red-500' : 'text-rose-600'}`}>
            {a.daysLeft}d
          </span>
        </div>
      ))}
    </div>
  );
}

function BestWorstPerformers({ items }: { items: PortfolioBestWorst[] }) {
  const valid = items.filter((i) => i.best || i.worst);
  if (valid.length === 0) return <p className="text-xs text-slate-400">No holdings data</p>;
  return (
    <div className="space-y-3">
      {valid.map((pw, i) => (
        <div key={i}>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">{pw.portfolioLabel}</p>
          <div className="grid grid-cols-2 gap-2">
            {pw.best && (
              <div className="flex items-center gap-1.5 bg-emerald-50 rounded-lg px-2 py-1.5">
                <TrendingUp size={10} className="text-emerald-600 shrink-0" />
                <span className="text-[11px] font-bold text-emerald-700 truncate">{pw.best.ticker}</span>
                <span className="text-[10px] font-bold text-emerald-600 ml-auto shrink-0">{formatPercent(pw.best.pnlPercent, 1)}</span>
              </div>
            )}
            {pw.worst && (
              <div className="flex items-center gap-1.5 bg-red-50 rounded-lg px-2 py-1.5">
                <TrendingDown size={10} className="text-red-500 shrink-0" />
                <span className="text-[11px] font-bold text-red-600 truncate">{pw.worst.ticker}</span>
                <span className="text-[10px] font-bold text-red-500 ml-auto shrink-0">{formatPercent(pw.worst.pnlPercent, 1)}</span>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Main Component ── */

export default function InsightsPanel({ insights }: InsightsPanelProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-sm">
          <BarChart3 size={14} className="text-white" />
        </div>
        <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Portfolio Insights</h2>
      </div>

      {/* Row 1 — Biggest Mover + Top Holdings */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card
          title="Today's Biggest Mover"
          icon={<Activity size={14} className="text-amber-500" />}
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

      {/* Row 2 — Gainers, Losers, Allocation Drift */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card
          title="Top Gainers"
          icon={<TrendingUp size={14} className="text-emerald-500" />}
          accent="emerald"
        >
          <GainersList items={insights.topGainers} type="gain" />
        </Card>

        <Card
          title="Top Losers"
          icon={<TrendingDown size={14} className="text-red-500" />}
          accent="red"
        >
          <GainersList items={insights.topLosers} type="loss" />
        </Card>

        <Card
          title="Asset Allocation Drift"
          icon={<Target size={14} className="text-slate-500" />}
          accent="slate"
        >
          <AllocationDrift slices={insights.allocationSlices} />
        </Card>
      </div>

      {/* Row 3 — Concentration + Reminders */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card
          title="Concentration Risk"
          icon={<AlertTriangle size={14} className="text-amber-500" />}
          accent="amber"
        >
          <ConcentrationRisk warnings={insights.concentrationWarnings} />
        </Card>

        <Card
          title="FD Maturity (30d)"
          icon={<Landmark size={14} className="text-blue-500" />}
          accent="blue"
        >
          <FDReminders alerts={insights.fdMaturityAlerts} />
        </Card>

        <Card
          title="Insurance Renewal (60d)"
          icon={<Shield size={14} className="text-rose-500" />}
          accent="rose"
        >
          <InsuranceReminders alerts={insights.insuranceRenewalAlerts} />
        </Card>
      </div>
    </div>
  );
}
