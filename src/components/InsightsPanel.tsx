import React, { useState, useMemo, useCallback, Suspense } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Landmark,
  Shield,
  Activity,
  Crown,
  Target,
  BarChart3,
  Filter,
  ChevronRight,
  Home
} from './icons/AppIcons';
import { formatINR, formatPercent } from '../utils/formatters';
import {
  PortfolioInsights,
  HoldingInsight,
  FDMaturityAlert,
  InsuranceRenewalAlert,
  PortfolioBestWorst,
} from '../hooks/usePortfolioInsights';
import { Portfolio, AssetTab, FetchStatus } from '../types/portfolio';
import { InsightsSkeleton } from './ui/ChartSkeleton';
import { analyzePortfolioHealth } from '../utils/dataQuality';

const DataQualityHealthModal = React.lazy(() => import('./DataQualityHealthModal'));

interface InsightsPanelProps {
  insights: PortfolioInsights;
  portfolios: Portfolio[];
  activePortfolio: Portfolio | null;
  onNavigateAsset?: (tab: AssetTab) => void;
  onRefreshPrices?: () => void;
  isLoadingPrices?: boolean;
  isPriceStale?: boolean;
  priceStatus?: FetchStatus;
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

const TopHoldings = React.memo(function TopHoldings({ items, totalStockValue }: { items: HoldingInsight[]; totalStockValue?: number }) {
  const fallbackVal = useMemo(() => items.reduce((s, i) => s + i.holding.currentValue, 0), [items]);
  const effectiveTotal = totalStockValue !== undefined && totalStockValue > 0 ? totalStockValue : fallbackVal;
  if (items.length === 0) return <p className="text-xs text-[var(--text-tertiary)]">No holdings yet</p>;
  return (
    <div className="space-y-2">
      {items.map((item, idx) => {
        const alloc = effectiveTotal > 0 ? (item.holding.currentValue / effectiveTotal) * 100 : 0;
        return (
          <div key={`${item.portfolioName}-${item.holding.id || item.holding.ticker}`} className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-[var(--radius-small)] bg-[var(--accent-blue-soft)] text-[var(--accent-blue)] flex items-center justify-center text-label-micro font-bold shrink-0">
              {idx + 1}
            </span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-[var(--text-primary)] truncate">{item.holding.ticker}</span>
                <span className="text-label-micro text-[var(--text-tertiary)] truncate hidden sm:inline">{item.portfolioLabel}</span>
              </div>
              <div className="w-full bg-[var(--surface-secondary)] h-1 rounded-full overflow-hidden mt-1">
                <div className="bg-[var(--accent-blue)] h-full rounded-full transition-all duration-300" style={{ width: `${Math.min(alloc, 100)}%` }} />
              </div>
            </div>
            <div className="text-right shrink-0">
              <p className="text-xs font-bold text-[var(--text-primary)] tnum">{formatINR(item.holding.currentValue)}</p>
              <p className="text-[10px] text-[var(--text-tertiary)] tnum">{alloc.toFixed(1)}%</p>
            </div>
          </div>
        );
      })}
    </div>
  );
});

const GainersList = React.memo(function GainersList({ items, type }: { items: HoldingInsight[]; type: 'gain' | 'loss' }) {
  if (items.length === 0) return <p className="text-xs text-[var(--text-tertiary)]">No {type === 'gain' ? 'gainers' : 'losers'} yet</p>;
  const isGain = type === 'gain';
  return (
    <div className="space-y-2">
      {items.map((item) => (
        <div key={`${item.portfolioName}-${item.holding.id || item.holding.ticker}`} className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className={`w-5 h-5 rounded-[var(--radius-small)] flex items-center justify-center shrink-0 ${isGain ? 'bg-[var(--positive-soft)] text-[var(--positive)]' : 'bg-[var(--negative-soft)] text-[var(--negative)]'}`}>
              {isGain ? <TrendingUp size={10} aria-hidden="true" /> : <TrendingDown size={10} aria-hidden="true" />}
            </div>
            <div className="min-w-0">
              <span className="text-xs font-bold text-[var(--text-primary)] truncate block">{item.holding.ticker}</span>
              <span className="text-label-micro text-[var(--text-tertiary)] truncate block">{item.portfolioLabel}</span>
            </div>
          </div>
          <div className="text-right shrink-0">
            <span className={`text-xs font-bold tnum ${isGain ? 'text-[var(--positive)]' : 'text-[var(--negative)]'}`}>
              {formatPercent(item.holding.pnlPercent, 1)}
            </span>
            <p className="text-[10px] text-[var(--text-tertiary)] tnum">{formatINR(item.holding.unrealizedPnL)}</p>
          </div>
        </div>
      ))}
    </div>
  );
});

const BiggestMovers = React.memo(function BiggestMovers({ movers }: { movers: HoldingInsight[] }) {
  if (movers.length === 0) return <p className="text-xs text-[var(--text-tertiary)]">No movements today</p>;
  return (
    <div className="space-y-2">
      {movers.map((m) => {
        const isUp = m.holding.todayPnLPercent >= 0;
        return (
          <div key={`${m.portfolioName}-${m.holding.id || m.holding.ticker}`} className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className={`w-5 h-5 rounded-[var(--radius-small)] flex items-center justify-center shrink-0 ${isUp ? 'bg-[var(--positive-soft)] text-[var(--positive)]' : 'bg-[var(--negative-soft)] text-[var(--negative)]'}`}>
                {isUp ? <TrendingUp size={10} aria-hidden="true" /> : <TrendingDown size={10} aria-hidden="true" />}
              </div>
              <div className="min-w-0">
                <span className="text-xs font-bold text-[var(--text-primary)] truncate block">{m.holding.ticker}</span>
                <span className="text-label-micro text-[var(--text-tertiary)] truncate block">{m.portfolioLabel}</span>
              </div>
            </div>
            <div className="text-right shrink-0">
              <span className={`text-xs font-bold tnum ${isUp ? 'text-[var(--positive)]' : 'text-[var(--negative)]'}`}>
                {formatPercent(m.holding.todayPnLPercent, 2)}
              </span>
              <p className="text-[10px] text-[var(--text-tertiary)] tnum">LTP {formatINR(m.holding.ltp)}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
});

const FDReminders = React.memo(function FDReminders({ alerts }: { alerts: FDMaturityAlert[] }) {
  if (alerts.length === 0) return <p className="text-xs text-[var(--text-tertiary)]">No FDs maturing in the next 30 days</p>;
  return (
    <div className="space-y-2">
      {alerts.map((a) => {
        const isOverdue = a.daysLeft < 0;
        return (
          <div key={`${a.fd.id || a.fd.bank_name}-${a.daysLeft}`} className="flex items-center gap-2 p-2 bg-[var(--surface-secondary)] rounded-[var(--radius-medium)]">
            <div className="w-6 h-6 rounded-[var(--radius-small)] bg-[var(--accent-blue-soft)] text-[var(--accent-blue)] flex items-center justify-center shrink-0">
              <Landmark size={12} aria-hidden="true" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-[var(--text-primary)] truncate">{a.fd.bank_name}</p>
              <p className="text-[10px] text-[var(--text-tertiary)]">{a.portfolioLabel} · <span className="tnum">{formatINR(Number(a.fd.maturity_amount))}</span></p>
            </div>
            <span className={`text-xs font-bold shrink-0 tnum ${a.daysLeft <= 7 || isOverdue ? 'text-[var(--warning)]' : 'text-[var(--text-secondary)]'}`}>
              {isOverdue ? `${Math.abs(a.daysLeft)}d overdue` : `${a.daysLeft}d`}
            </span>
          </div>
        );
      })}
    </div>
  );
});

const InsuranceReminders = React.memo(function InsuranceReminders({ alerts }: { alerts: InsuranceRenewalAlert[] }) {
  if (alerts.length === 0) return <p className="text-xs text-[var(--text-tertiary)]">No renewals in next 60 days</p>;
  return (
    <div className="space-y-2">
      {alerts.map((a) => {
        const isOverdue = a.daysLeft < 0;
        return (
          <div key={`${a.insurance.id || a.insurance.policy_name}-${a.daysLeft}`} className="flex items-center gap-2 p-2 bg-[var(--surface-secondary)] rounded-[var(--radius-medium)]">
            <div className="w-6 h-6 rounded-[var(--radius-small)] bg-[var(--negative-soft)] text-[var(--negative)] flex items-center justify-center shrink-0">
              <Shield size={12} aria-hidden="true" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-[var(--text-primary)] truncate">{a.insurance.policy_name}</p>
              <p className="text-[10px] text-[var(--text-tertiary)]">{a.portfolioLabel} · <span className="tnum">{formatINR(Number(a.insurance.premium_amount))}</span>/yr</p>
            </div>
            <span className={`text-xs font-bold shrink-0 tnum ${a.daysLeft <= 15 || isOverdue ? 'text-[var(--negative)]' : 'text-[var(--text-secondary)]'}`}>
              {isOverdue ? `${Math.abs(a.daysLeft)}d overdue` : `${a.daysLeft}d`}
            </span>
          </div>
        );
      })}
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 sm:gap-2">
            {pw.best && (
              <div className="flex items-center gap-1.5 bg-[var(--positive-soft)] rounded-[var(--radius-medium)] px-2 py-1.5 min-w-0">
                <TrendingUp size={10} className="text-[var(--positive)] shrink-0" aria-hidden="true" />
                <span className="text-[10px] font-bold text-[var(--positive)] truncate">{pw.best.ticker}</span>
                <span className="text-[10px] font-bold text-[var(--positive)] ml-auto shrink-0 tnum">{formatPercent(pw.best.pnlPercent, 1)}</span>
              </div>
            )}
            {pw.worst && (
              <div className="flex items-center gap-1.5 bg-[var(--negative-soft)] rounded-[var(--radius-medium)] px-2 py-1.5 min-w-0">
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

type InsightFilter = 'all' | 'health' | 'stocks' | 'fds' | 'insurance' | 'due_soon';

const FILTERS: { id: InsightFilter; label: string }[] = [
  { id: 'all', label: 'All Insights' },
  { id: 'health', label: '🛡️ Health Check' },
  { id: 'stocks', label: 'Stocks' },
  { id: 'fds', label: 'Deposits' },
  { id: 'insurance', label: 'Insurance' },
  { id: 'due_soon', label: 'Upcoming' },
];

export default React.memo(function InsightsPanel({
  insights,
  portfolios = [],
  onNavigateAsset,
  onRefreshPrices,
  isLoadingPrices = false,
  isPriceStale = false,
  priceStatus = 'idle',
}: InsightsPanelProps) {
  const [activeFilter, setActiveFilter] = useState<InsightFilter>('all');
  const [showHealthModal, setShowHealthModal] = useState(false);

  const handleFilterClick = useCallback((id: InsightFilter) => {
    setActiveFilter(id);
  }, []);

  const healthSummary = useMemo(() => {
    return analyzePortfolioHealth(portfolios, { isPriceStale, priceStatus });
  }, [portfolios, isPriceStale, priceStatus]);

  const realEstateMetrics = useMemo(() => {
    let totalVal = 0;
    let totalMonthlyRental = 0;
    let propertyCount = 0;
    for (const p of portfolios) {
      for (const re of p.realEstate ?? []) {
        totalVal += Number(re.current_valuation) || 0;
        totalMonthlyRental += Number(re.monthly_rent) || 0;
        propertyCount++;
      }
    }
    const annualRental = totalMonthlyRental * 12;
    const grossYield = totalVal > 0 ? (annualRental / totalVal) * 100 : 0;
    return { totalVal, totalMonthlyRental, annualRental, grossYield, propertyCount };
  }, [portfolios]);

  const totalStockValue = useMemo(() => {
    let sum = 0;
    for (let i = 0; i < portfolios.length; i++) {
      const holdings = portfolios[i]?.holdings;
      if (holdings) {
        for (let j = 0; j < holdings.length; j++) {
          sum += Number(holdings[j]?.currentValue) || 0;
        }
      }
    }
    return sum;
  }, [portfolios]);

  const f = activeFilter;
  const showHealth = f === 'all' || f === 'health';
  const showStocks = f === 'all' || f === 'stocks';
  const showFDs = f === 'all' || f === 'fds' || f === 'due_soon';
  const showInsurance = f === 'all' || f === 'insurance' || f === 'due_soon';

  const hasPerformanceCards = showStocks;
  const hasUpcomingCards = showFDs || showInsurance;

  if (portfolios.length === 0) {
    return <InsightsSkeleton />;
  }

  const getHealthBadge = (score: number) => {
    if (score >= 90) return { label: 'A+ (Optimal)', color: 'text-[var(--positive)] bg-[var(--positive-soft)] border-[var(--positive)]/30' };
    if (score >= 70) return { label: 'B (Good)', color: 'text-[var(--warning)] bg-[var(--warning-soft)] border-[var(--warning)]/30' };
    return { label: 'Action Needed', color: 'text-[var(--negative)] bg-[var(--negative-soft)] border-[var(--negative)]/30' };
  };

  const healthBadge = getHealthBadge(healthSummary.score);

  return (
    <div role="region" aria-label="Portfolio Insights" className="space-y-6">
      
      {/* Header and Filter pills */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--border-subtle)] pb-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-[var(--radius-medium)] bg-[var(--accent-blue-soft)] text-[var(--accent-blue)] flex items-center justify-center">
            <BarChart3 size={13} aria-hidden="true" />
          </div>
          <h3 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-wider">Portfolio Insights & Health</h3>
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
                    ? 'bg-[var(--accent-blue)] text-[var(--surface)] shadow-xs'
                    : 'bg-[var(--surface)] text-[var(--text-secondary)] border border-[var(--border-subtle)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-secondary)]'
                }`}
              >
                {filter.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 0. Data Quality & Health Check Strip */}
      {showHealth && (
        <div className="apple-card p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-[var(--border-subtle)] hover:border-[var(--accent-blue)]/50 transition-all">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-12 h-12 rounded-[var(--radius-medium)] bg-[var(--accent-blue-soft)] text-[var(--accent-blue)] flex flex-col items-center justify-center shrink-0 border border-[var(--accent-blue)]/30">
              <span className="text-base font-black leading-none tnum">{healthSummary.score}</span>
              <span className="text-[8px] font-bold opacity-80 uppercase">Score</span>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-[var(--text-primary)]">Data Quality & Completeness</span>
                <span className={`px-2 py-0.5 rounded-[var(--radius-small)] text-[10px] font-bold border ${healthBadge.color}`}>
                  {healthBadge.label}
                </span>
              </div>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                {healthSummary.issues.length === 0
                  ? 'All records, valuations, maturity dates, and attached vault documents are complete.'
                  : `${healthSummary.criticalCount} critical, ${healthSummary.warningCount} warnings, and ${healthSummary.infoCount} missing documents found.`}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowHealthModal(true)}
            className="shrink-0 w-full sm:w-auto px-3.5 py-2 bg-[var(--accent-blue)] hover:opacity-90 text-white rounded-[var(--radius-medium)] text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs ios-press transition-opacity"
          >
            <span>{healthSummary.issues.length > 0 ? 'Run Health Audit' : 'View Audit Details'}</span>
            <ChevronRight size={14} />
          </button>
        </div>
      )}

      {/* Real Estate Rental Yield Banner if properties exist */}
      {realEstateMetrics.propertyCount > 0 && (
        <div className="apple-card p-3.5 flex items-center justify-between gap-3 bg-[var(--surface-secondary)]/50 border border-[var(--border-subtle)]">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-[var(--radius-small)] bg-[var(--accent-blue-soft)] text-[var(--accent-blue)] flex items-center justify-center shrink-0">
              <Home size={16} />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-[var(--text-primary)]">
                Real Estate Yield: <span className="text-[var(--accent-blue)] font-extrabold tnum">{realEstateMetrics.grossYield.toFixed(2)}% p.a.</span>
              </p>
              <p className="text-[11px] text-[var(--text-tertiary)] truncate">
                {realEstateMetrics.propertyCount} propert{realEstateMetrics.propertyCount > 1 ? 'ies' : 'y'} · {formatINR(realEstateMetrics.totalVal)} val · {formatINR(realEstateMetrics.totalMonthlyRental)}/mo rental
              </p>
            </div>
          </div>
          {onNavigateAsset && (
            <button
              onClick={() => onNavigateAsset('real_estate')}
              className="text-xs font-semibold text-[var(--accent-blue)] hover:underline shrink-0 ios-press"
            >
              View &rarr;
            </button>
          )}
        </div>
      )}

      {/* 1. Performance Overview Section */}
      {hasPerformanceCards && (
        <div className="space-y-3">
          <h4 className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">Performance Overview</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <Card title="Today's Movers" icon={<Activity size={13} className="text-[var(--warning)]" aria-hidden="true" />}>
              <BiggestMovers movers={insights.biggestMovers} />
            </Card>
            <Card title="Top Holdings by Value" icon={<Crown size={13} className="text-[var(--accent-blue)]" aria-hidden="true" />}>
              <TopHoldings items={insights.topByValue} totalStockValue={totalStockValue} />
            </Card>
            <Card title="Best / Worst performers" icon={<Target size={13} className="text-[var(--accent-blue)]" aria-hidden="true" />}>
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

      {/* Modal Dialog */}
      {showHealthModal && (
        <Suspense fallback={null}>
          <DataQualityHealthModal
            isOpen={showHealthModal}
            onClose={() => setShowHealthModal(false)}
            healthSummary={healthSummary}
            onNavigateAsset={onNavigateAsset}
            onRefreshPrices={onRefreshPrices}
            isLoadingPrices={isLoadingPrices}
          />
        </Suspense>
      )}

    </div>
  );
});
