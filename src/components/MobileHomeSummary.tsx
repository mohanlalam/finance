import { memo, useMemo, useCallback } from 'react';
import { TrendingUp, TrendingDown, Landmark, Coins, Building2, Shield, FolderOpen, AlertCircle, RefreshCw, ChevronRight, Clock } from './icons/AppIcons';
import { formatINR, formatPercent } from '../utils/formatters';
import { Portfolio } from '../types/portfolio';
import { Alert } from '../hooks/useAlerts';
import { estimateTodayPnL } from '../utils/portfolioCalcs';
import { NetWorthSnapshot } from '../hooks/usePortfolioData';
import { Sparkline } from './ui/Sparkline';
import { AnimatedNumber } from './ui/AnimatedNumber';
import { usePrivacy } from '../contexts/PrivacyContext';

// Hoist static icon elements at module level — prevents new React element
// objects from being allocated on every component render cycle.
const ICON_STOCKS    = <TrendingUp size={16} aria-hidden="true" />;
const ICON_FD        = <Landmark size={16} aria-hidden="true" />;
const ICON_RD        = <Clock size={16} aria-hidden="true" />;
const ICON_SIP       = <TrendingUp size={16} aria-hidden="true" />;
const ICON_GOLD      = <Coins size={16} aria-hidden="true" />;
const ICON_REALTY    = <Building2 size={16} aria-hidden="true" />;
const ICON_INSURANCE = <Shield size={16} aria-hidden="true" />;
const ICON_DOCS      = <FolderOpen size={16} aria-hidden="true" />;

interface MobileHomeSummaryProps {
  summaryData: {
    totalCurrentValue: number;
    totalInvested: number;
    totalPnL: number;
    totalPnLPercent: number;
    label: string;
  };
  todayPnL: number;
  todayPnLPercent: number;
  breakdown: {
    stocks: number;
    fd: number;
    rd: number;
    sip: number;
    gold: number;
    realEstate: number;
    insuranceCover: number;
    insurancePremium: number;
  };
  alertCount: number;
  alerts: Alert[];
  lastUpdated: Date | null;
  priceStatus: string;
  onRefresh: () => void;
  isLoadingPrices: boolean;
  onNavigateAsset: (asset: 'stocks' | 'fd' | 'rd' | 'sip' | 'gold' | 'real_estate' | 'insurance' | 'documents') => void;
  onOpenAlerts: () => void;
  portfolios: Portfolio[];
  activePortfolio: Portfolio | null;
  netWorthHistory?: NetWorthSnapshot[];
}

const EMPTY_HISTORY: NetWorthSnapshot[] = [];

function MobileHomeSummary({
  summaryData,
  todayPnL,
  todayPnLPercent,
  breakdown,
  alertCount,
  lastUpdated,
  onRefresh,
  isLoadingPrices,
  onNavigateAsset,
  onOpenAlerts,
  portfolios,
  activePortfolio,
  netWorthHistory = EMPTY_HISTORY,
}: MobileHomeSummaryProps) {
  const { isBalancesHidden } = usePrivacy();

  const renderValue = useCallback((val: number, formatter = formatINR) => {
    if (isBalancesHidden) return <span aria-label="Amount hidden">••••••</span>;
    return <AnimatedNumber value={val} formatter={formatter} />;
  }, [isBalancesHidden]);

  const sparklineData = useMemo(() => {
    if (!netWorthHistory || netWorthHistory.length === 0) return [];
    return netWorthHistory.slice(-7).map((snap) => snap.total_value);
  }, [netWorthHistory]);

  const sparklineColor = useMemo(() => {
    if (sparklineData.length < 2) return 'var(--positive)';
    return sparklineData[sparklineData.length - 1] >= sparklineData[0] ? 'var(--positive)' : 'var(--negative)';
  }, [sparklineData]);

  // Precalculate family member summaries to avoid un-memoized estimateTodayPnL in render loop
  const memberSummaries = useMemo(() => {
    if (!portfolios || portfolios.length === 0) return [];
    return portfolios.map((p) => ({
      ...p,
      pTodayPnL: p.todayPnL ?? estimateTodayPnL(p, [p]),
    }));
  }, [portfolios]);

  const isTotalGain = summaryData.totalPnL >= 0;
  const isTodayGain = todayPnL >= 0;

  // Counts for each asset type
  const assetCounts = useMemo(() => {
    if (activePortfolio) {
      return {
        stocks: activePortfolio.holdings?.length || 0,
        fd: activePortfolio.fixedDeposits?.length || 0,
        rd: activePortfolio.rdAccounts?.length || 0,
        sip: activePortfolio.sipAccounts?.length || 0,
        gold: activePortfolio.goldHoldings?.length || 0,
        realEstate: activePortfolio.realEstate?.length || 0,
        insurance: activePortfolio.insurances?.length || 0,
        doc: activePortfolio.documents?.length || 0,
      };
    }
    let stocks = 0, fd = 0, rd = 0, sip = 0, gold = 0, realEstate = 0, insurance = 0, doc = 0;
    for (let i = 0; i < portfolios.length; i++) {
      const p = portfolios[i];
      stocks += p.holdings?.length || 0;
      fd += p.fixedDeposits?.length || 0;
      rd += p.rdAccounts?.length || 0;
      sip += p.sipAccounts?.length || 0;
      gold += p.goldHoldings?.length || 0;
      realEstate += p.realEstate?.length || 0;
      insurance += p.insurances?.length || 0;
      doc += p.documents?.length || 0;
    }
    return { stocks, fd, rd, sip, gold, realEstate, insurance, doc };
  }, [activePortfolio, portfolios]);

  const stockCount = assetCounts.stocks;
  const fdCount = assetCounts.fd;
  const rdCount = assetCounts.rd;
  const sipCount = assetCounts.sip;
  const goldCount = assetCounts.gold;
  const propertyCount = assetCounts.realEstate;
  const insuranceCount = assetCounts.insurance;
  const docCount = assetCounts.doc;

  // Memoized: only recomputes when breakdown values or counts change.
  // Using module-level icon constants prevents new JSX elements per render.
  const assetList = useMemo(() => {
    const totalAllocated = breakdown.stocks + breakdown.fd + breakdown.rd + breakdown.sip + breakdown.gold + breakdown.realEstate;
    const calcShare = (val: number) => (totalAllocated > 0 ? `${((val / totalAllocated) * 100).toFixed(0)}% Share` : null);

    return [
      {
        id: 'stocks' as const,
        label: 'Stocks & ETFs',
        value: breakdown.stocks,
        subtext: `${stockCount} Tickers`,
        returnBadge: breakdown.stocks > 0 ? calcShare(breakdown.stocks) : null,
        icon: ICON_STOCKS,
        accentColor: 'bg-[var(--accent-blue)]',
      },
      {
        id: 'fd' as const,
        label: 'Fixed Deposits',
        value: breakdown.fd,
        subtext: `${fdCount} FDs`,
        returnBadge: breakdown.fd > 0 ? calcShare(breakdown.fd) : null,
        icon: ICON_FD,
        accentColor: 'bg-[var(--warning)]',
      },
      {
        id: 'rd' as const,
        label: 'Recurring Deposits',
        value: breakdown.rd,
        subtext: `${rdCount} Accounts`,
        returnBadge: breakdown.rd > 0 ? calcShare(breakdown.rd) : null,
        icon: ICON_RD,
        accentColor: 'bg-indigo-500 dark:bg-indigo-400',
      },
      {
        id: 'sip' as const,
        label: 'SIP Mutual Funds',
        value: breakdown.sip,
        subtext: `${sipCount} Active SIPs`,
        returnBadge: breakdown.sip > 0 ? calcShare(breakdown.sip) : null,
        icon: ICON_SIP,
        accentColor: 'bg-emerald-500 dark:bg-emerald-400',
      },
      {
        id: 'gold' as const,
        label: 'Gold Holdings',
        value: breakdown.gold,
        subtext: `${goldCount} Items`,
        returnBadge: breakdown.gold > 0 ? calcShare(breakdown.gold) : null,
        icon: ICON_GOLD,
        accentColor: 'bg-yellow-500 dark:bg-yellow-400',
      },
      {
        id: 'real_estate' as const,
        label: 'Real Estate',
        value: breakdown.realEstate,
        subtext: `${propertyCount} Properties`,
        returnBadge: breakdown.realEstate > 0 ? calcShare(breakdown.realEstate) : null,
        icon: ICON_REALTY,
        accentColor: 'bg-purple-500 dark:bg-purple-400',
      },
      {
        id: 'insurance' as const,
        label: 'Insurance Cover',
        value: breakdown.insuranceCover,
        subtext: `${insuranceCount} Policies`,
        returnBadge: null,
        icon: ICON_INSURANCE,
        accentColor: 'bg-[var(--negative)]',
      },
      {
        id: 'documents' as const,
        label: 'Document Vault',
        value: null,
        subtext: `${docCount} Documents`,
        returnBadge: null,
        icon: ICON_DOCS,
        accentColor: 'bg-[var(--text-tertiary)]',
      },
    ];
  }, [breakdown, stockCount, fdCount, rdCount, sipCount, goldCount, propertyCount, insuranceCount, docCount]);

  return (
    <div className="space-y-3.5 md:hidden">

      {/* ── Unified Single Top Net Worth Card ── */}
      <div className="rounded-[var(--radius-large)] border border-[var(--border-subtle)] bg-[var(--surface)] p-4 shadow-xs space-y-3.5 apple-card">
        {/* Header row: Label & Refresh/Sync Button */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider truncate">
              {summaryData.label} Net Worth
            </span>
            {lastUpdated && (
              <span className="text-[10px] text-[var(--text-tertiary)] flex items-center gap-1 truncate shrink-0">
                • {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
          </div>
          <button
            onClick={onRefresh}
            disabled={isLoadingPrices}
            className="flex items-center gap-1.5 px-3 py-1.5 min-h-[32px] rounded-[var(--radius-medium)] bg-[var(--surface-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-xs font-bold transition-all ios-press border border-[var(--border-subtle)] shrink-0"
            title="Refresh prices & valuations"
            aria-label="Refresh prices and valuations"
          >
            <RefreshCw size={12} className={isLoadingPrices ? 'animate-spin text-[var(--accent-blue)]' : ''} aria-hidden="true" />
            <span>{isLoadingPrices ? 'Syncing...' : 'Sync'}</span>
          </button>
        </div>

        {/* Primary Hero: Net Worth & Today's Gain/Loss Badge */}
        <div className="flex items-end justify-between gap-2 pt-0.5">
          <div className="min-w-0 flex-1">
            <div className="text-2xl font-extrabold text-[var(--text-primary)] tnum leading-none tracking-tight truncate">
              {renderValue(summaryData.totalCurrentValue)}
            </div>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <span className={`inline-flex items-center gap-1 text-xs font-bold tnum px-2 py-0.5 rounded-[var(--radius-pill)] ${
                isTodayGain ? 'bg-[var(--positive-soft)] text-[var(--positive)]' : 'bg-[var(--negative-soft)] text-[var(--negative)]'
              }`}>
                {isTodayGain ? <TrendingUp size={12} className="shrink-0" /> : <TrendingDown size={12} className="shrink-0" />}
                <span>
                  {isTodayGain ? '+' : ''}{isBalancesHidden ? '••••' : formatINR(todayPnL)} ({formatPercent(todayPnLPercent, 1)}) Today
                </span>
              </span>
            </div>
          </div>
          {sparklineData.length > 1 && (
            <div className="shrink-0 mb-0.5">
              <Sparkline data={sparklineData} color={sparklineColor} width={68} height={26} />
            </div>
          )}
        </div>

        {/* Metrics Row: Invested | Total Return */}
        <div className="grid grid-cols-2 gap-2.5 pt-3 border-t border-[var(--border-subtle)]">
          {/* Invested */}
          <div className="p-2.5 rounded-[var(--radius-medium)] bg-[var(--surface-secondary)] border border-[var(--border-subtle)] min-w-0">
            <span className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider block mb-0.5 truncate">
              Invested Capital
            </span>
            <span className="text-xs font-extrabold text-[var(--text-primary)] tnum block truncate">
              {renderValue(summaryData.totalInvested)}
            </span>
          </div>

          {/* Total Return */}
          <div className="p-2.5 rounded-[var(--radius-medium)] bg-[var(--surface-secondary)] border border-[var(--border-subtle)] min-w-0">
            <span className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider block mb-0.5 truncate">
              Total Overall Return
            </span>
            <div className={`flex items-center gap-1 text-xs font-extrabold tnum truncate ${
              isTotalGain ? 'text-[var(--positive)]' : 'text-[var(--negative)]'
            }`}>
              {isTotalGain ? <TrendingUp size={12} className="shrink-0" /> : <TrendingDown size={12} className="shrink-0" />}
              <span className="truncate">
                {isBalancesHidden ? '••••••' : <>{isTotalGain ? '+' : ''}{formatINR(summaryData.totalPnL)}</>}
              </span>
              <span className="text-[11px] opacity-90 shrink-0 font-bold">
                ({formatPercent(summaryData.totalPnLPercent, 1)})
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Portfolio Member Breakdown ── */}
      {activePortfolio === null && memberSummaries.length > 0 && (
        <div className="rounded-[var(--radius-large)] border border-[var(--border-subtle)] bg-[var(--surface)] p-3.5 shadow-xs space-y-2.5 apple-card">
          <span className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider block">
            Family Breakdown
          </span>
          <div className="space-y-2">
            {memberSummaries.map((p) => {
              const pTodayPnL = p.pTodayPnL;
              const isGain = p.totalPnL >= 0;
              const isTodayGain = pTodayPnL >= 0;
              return (
                <div key={p.id} className="p-3 rounded-[var(--radius-medium)] bg-[var(--surface-secondary)] border border-[var(--border-subtle)] space-y-2">
                  <div className="flex items-center justify-between gap-2 min-w-0">
                    <span className="text-xs font-bold text-[var(--text-primary)] truncate min-w-0 flex-1">{p.label} Portfolio</span>
                    <span className="text-xs font-extrabold text-[var(--text-primary)] tnum shrink-0 ml-2">{renderValue(p.totalCurrentValue)}</span>
                  </div>

                  <div className="grid grid-cols-3 gap-1 pt-2 border-t border-[var(--border-subtle)] text-xs">
                    <div className="min-w-0">
                      <span className="text-xs text-[var(--text-tertiary)] uppercase font-semibold block truncate">Invested</span>
                      <span className="font-extrabold tnum text-[var(--text-secondary)] block truncate">{renderValue(p.totalInvested)}</span>
                    </div>
                    <div className="min-w-0">
                      <span className="text-xs text-[var(--text-tertiary)] uppercase font-semibold block truncate">Total Return</span>
                      <span className={`font-extrabold tnum block truncate ${isGain ? 'text-[var(--positive)]' : 'text-[var(--negative)]'}`}>
                        {isBalancesHidden ? '••••••' : formatPercent(p.totalPnLPercent, 1)}
                      </span>
                    </div>
                    <div className="text-right min-w-0">
                      <span className="text-xs text-[var(--text-tertiary)] uppercase font-semibold block truncate">Today's P&amp;L</span>
                      <span className={`font-extrabold tnum block truncate ${isTodayGain ? 'text-[var(--positive)]' : 'text-[var(--negative)]'}`}>
                        {isBalancesHidden ? '••••••' : <>{isTodayGain ? '+' : ''}{formatINR(pTodayPnL)}</>}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Portfolio Alerts Banner ── */}
      {alertCount > 0 && (
        <button
          onClick={onOpenAlerts}
          className="w-full flex items-center justify-between p-3.5 rounded-[var(--radius-large)] text-left border bg-[var(--negative-soft)] border-[var(--border-subtle)] text-[var(--negative)] ios-press transition-all apple-card"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-[var(--radius-medium)] bg-[var(--negative)] text-[var(--surface)] flex items-center justify-center shrink-0">
              <AlertCircle size={16} aria-hidden="true" />
            </div>
            <div>
              <h4 className="text-xs font-extrabold text-[var(--text-primary)]">{alertCount} Portfolio Alerts</h4>
              <p className="text-xs font-semibold text-[var(--text-secondary)] opacity-85">Tap to review warnings</p>
            </div>
          </div>
          <ChevronRight size={16} className="text-[var(--negative)] shrink-0" aria-hidden="true" />
        </button>
      )}

      {/* ── Flatter Asset Summary Cards List ── */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Asset Classes</span>
          <span className="text-xs font-semibold text-[var(--text-tertiary)]">{assetList.length} Categories</span>
        </div>

        {assetList.map((item) => (
          <button
            key={item.id}
            onClick={() => onNavigateAsset(item.id)}
            className="mobile-asset-card w-full flex items-center justify-between p-3.5 rounded-[var(--radius-large)] border border-[var(--border-subtle)] bg-[var(--surface)] hover:bg-[var(--surface-secondary)] transition-all text-left ios-press apple-card"
          >
            <div className="flex items-center gap-3 min-w-0">
              {/* Category Icon Badge */}
              <div className="w-8 h-8 rounded-[var(--radius-small)] bg-[var(--surface-secondary)] text-[var(--text-secondary)] flex items-center justify-center shrink-0 border border-[var(--border-subtle)]">
                {item.icon}
              </div>
              <div className="min-w-0">
                <h4 className="text-xs font-bold text-[var(--text-primary)] truncate">{item.label}</h4>
                <p className="text-xs font-medium text-[var(--text-tertiary)] mt-0.5 truncate">{item.subtext}</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 shrink-0 text-right">
              <div>
                {item.value !== null ? (
                  <p className="text-xs font-extrabold text-[var(--text-primary)] tnum">{renderValue(item.value)}</p>
                ) : (
                  <p className="text-xs font-extrabold text-[var(--text-tertiary)]">--</p>
                )}
                {item.returnBadge && (
                  <span className="text-xs font-bold text-[var(--accent-blue)] block mt-0.5">
                    {item.returnBadge}
                  </span>
                )}
              </div>
              <ChevronRight size={14} className="text-[var(--text-tertiary)]" aria-hidden="true" />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

export default memo(MobileHomeSummary);
