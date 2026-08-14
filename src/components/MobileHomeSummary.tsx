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
  onNavigateAsset: (asset: 'stocks' | 'fd' | 'rd' | 'sip' | 'gold' | 'real_estate' | 'insurance' | 'documents' | 'what_if') => void;
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
      pTodayPnL: estimateTodayPnL(p, [p]),
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

  const totalAllocated = useMemo(() => {
    return breakdown.stocks + breakdown.fd + breakdown.rd + breakdown.sip + breakdown.gold + breakdown.realEstate;
  }, [breakdown]);

  const getPercent = (val: number) => {
    if (totalAllocated <= 0) return 0;
    return (val / totalAllocated) * 100;
  };

  const assetList = [
    {
      id: 'stocks' as const,
      label: 'Stocks & ETFs',
      value: breakdown.stocks,
      subtext: `${stockCount} Tickers`,
      returnBadge: breakdown.stocks > 0 ? `${getPercent(breakdown.stocks).toFixed(0)}% Share` : null,
      icon: <TrendingUp size={16} aria-hidden="true" />,
      accentColor: 'bg-[var(--accent-blue)]',
    },
    {
      id: 'fd' as const,
      label: 'Fixed Deposits',
      value: breakdown.fd,
      subtext: `${fdCount} FDs`,
      returnBadge: breakdown.fd > 0 ? `${getPercent(breakdown.fd).toFixed(0)}% Share` : null,
      icon: <Landmark size={16} aria-hidden="true" />,
      accentColor: 'bg-[var(--warning)]',
    },
    {
      id: 'rd' as const,
      label: 'Recurring Deposits',
      value: breakdown.rd,
      subtext: `${rdCount} Accounts`,
      returnBadge: breakdown.rd > 0 ? `${getPercent(breakdown.rd).toFixed(0)}% Share` : null,
      icon: <Clock size={16} aria-hidden="true" />,
      accentColor: 'bg-indigo-500 dark:bg-indigo-400',
    },
    {
      id: 'sip' as const,
      label: 'SIP Mutual Funds',
      value: breakdown.sip,
      subtext: `${sipCount} Active SIPs`,
      returnBadge: breakdown.sip > 0 ? `${getPercent(breakdown.sip).toFixed(0)}% Share` : null,
      icon: <TrendingUp size={16} aria-hidden="true" />,
      accentColor: 'bg-emerald-500 dark:bg-emerald-400',
    },
    {
      id: 'gold' as const,
      label: 'Gold Holdings',
      value: breakdown.gold,
      subtext: `${goldCount} Items`,
      returnBadge: breakdown.gold > 0 ? `${getPercent(breakdown.gold).toFixed(0)}% Share` : null,
      icon: <Coins size={16} aria-hidden="true" />,
      accentColor: 'bg-yellow-500 dark:bg-yellow-400',
    },
    {
      id: 'real_estate' as const,
      label: 'Real Estate',
      value: breakdown.realEstate,
      subtext: `${propertyCount} Properties`,
      returnBadge: breakdown.realEstate > 0 ? `${getPercent(breakdown.realEstate).toFixed(0)}% Share` : null,
      icon: <Building2 size={16} aria-hidden="true" />,
      accentColor: 'bg-purple-500 dark:bg-purple-400',
    },
    {
      id: 'insurance' as const,
      label: 'Insurance Cover',
      value: breakdown.insuranceCover,
      subtext: `${insuranceCount} Policies`,
      returnBadge: null,
      icon: <Shield size={16} aria-hidden="true" />,
      accentColor: 'bg-[var(--negative)]',
    },
    {
      id: 'documents' as const,
      label: 'Document Vault',
      value: null,
      subtext: `${docCount} Documents`,
      returnBadge: null,
      icon: <FolderOpen size={16} aria-hidden="true" />,
      accentColor: 'bg-[var(--text-tertiary)]',
    },
  ];

  return (
    <div className="space-y-3.5 md:hidden">

      {/* ── Flat Hero Summary Card ── */}
      <div className="rounded-[var(--radius-large)] border border-[var(--border-subtle)] bg-[var(--surface)] p-4 shadow-xs space-y-4 apple-card">
        {/* Header row */}
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">
            {summaryData.label} Net Worth
          </span>
          <button
            onClick={onRefresh}
            disabled={isLoadingPrices}
            className="flex items-center gap-1.5 px-3 py-1.5 min-h-[36px] rounded-[var(--radius-medium)] bg-[var(--surface-secondary)] text-[var(--text-secondary)] text-xs font-bold transition-all ios-press border border-[var(--border-subtle)]"
          >
            <RefreshCw size={13} className={isLoadingPrices ? 'animate-spin text-[var(--accent-blue)]' : ''} aria-hidden="true" />
            <span>{isLoadingPrices ? 'Syncing' : 'Sync'}</span>
          </button>
        </div>

        {/* Hero Valuation */}
        <div className="flex items-end justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h2 className="text-2xl font-extrabold text-[var(--text-primary)] tnum leading-tight tracking-tight truncate">
              {renderValue(summaryData.totalCurrentValue)}
            </h2>
            <p className="text-xs text-[var(--text-tertiary)] mt-0.5 truncate">
              Invested: <span className="font-extrabold text-[var(--text-secondary)] tnum">{renderValue(summaryData.totalInvested)}</span>
            </p>
          </div>
          {sparklineData.length > 1 && (
            <div className="shrink-0 mb-1">
              <Sparkline data={sparklineData} color={sparklineColor} width={72} height={28} />
            </div>
          )}
        </div>

        {/* Net Worth Big Number */}
        <div className="flex items-baseline justify-between gap-2 pt-0.5">
          <div className="flex items-baseline gap-1 text-2xl font-extrabold text-[var(--text-primary)] tnum tracking-tight">
            <span className="text-[var(--text-tertiary)] font-medium text-lg">₹</span>
            {isBalancesHidden ? (
              <span aria-label="Amount hidden">••••••</span>
            ) : (
              <AnimatedNumber value={summaryData.totalCurrentValue} formatter={formatINR} />
            )}
          </div>
          <div className={`flex items-center gap-1 px-2.5 py-1 rounded-[var(--radius-pill)] text-xs font-bold tnum shrink-0 ${
            isTodayGain ? 'bg-[var(--positive-soft)] text-[var(--positive)]' : 'bg-[var(--negative-soft)] text-[var(--negative)]'
          }`}>
            {isTodayGain ? <TrendingUp size={13} className="shrink-0" aria-hidden="true" /> : <TrendingDown size={13} className="shrink-0" aria-hidden="true" />}
            <span>{isTodayGain ? '+' : ''}{formatPercent(todayPnLPercent, 1)} Today</span>
          </div>
        </div>

        {/* Metric Grid: Invested | Total Return | Today's Return */}
        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[var(--border-subtle)]">
          {/* Invested */}
          <div className="p-2.5 rounded-[var(--radius-medium)] bg-[var(--surface-secondary)] border border-[var(--border-subtle)] min-w-0">
            <span className="text-xs font-bold text-[var(--text-tertiary)] uppercase tracking-wider block mb-0.5 truncate">Invested</span>
            <span className="text-xs font-extrabold text-[var(--text-primary)] tnum block truncate">
              {isBalancesHidden ? <span aria-label="Amount hidden">••••••</span> : formatINR(summaryData.totalInvested)}
            </span>
          </div>

          {/* Total Return */}
          <div className="p-2.5 rounded-[var(--radius-medium)] bg-[var(--surface-secondary)] border border-[var(--border-subtle)] min-w-0">
            <span className="text-xs font-bold text-[var(--text-tertiary)] uppercase tracking-wider block mb-0.5 truncate">Total Return</span>
            <div className={`flex items-center gap-1 text-xs font-extrabold tnum min-w-0 ${isTotalGain ? 'text-[var(--positive)]' : 'text-[var(--negative)]'}`}>
              {isTotalGain ? <TrendingUp size={13} className="shrink-0" aria-hidden="true" /> : <TrendingDown size={13} className="shrink-0" aria-hidden="true" />}
              <span className="truncate">{isBalancesHidden ? <span aria-label="Amount hidden">••••••</span> : <>{isTotalGain ? '+' : ''}{formatINR(summaryData.totalPnL)}</>}</span>
              <span className="text-xs font-extrabold ml-auto shrink-0">({formatPercent(summaryData.totalPnLPercent, 1)})</span>
            </div>
          </div>

          {/* Today's Return */}
          <div className="p-2.5 rounded-[var(--radius-medium)] bg-[var(--surface-secondary)] border border-[var(--border-subtle)] min-w-0">
            <span className="text-xs font-bold text-[var(--text-tertiary)] uppercase tracking-wider block mb-0.5 truncate">Today's Return</span>
            <div className={`flex items-center gap-1 text-xs font-extrabold tnum min-w-0 ${isTodayGain ? 'text-[var(--positive)]' : 'text-[var(--negative)]'}`}>
              {isTodayGain ? <TrendingUp size={13} className="shrink-0" aria-hidden="true" /> : <TrendingDown size={13} className="shrink-0" aria-hidden="true" />}
              <span className="truncate">{isBalancesHidden ? <span aria-label="Amount hidden">••••••</span> : <>{isTodayGain ? '+' : ''}{formatINR(todayPnL)}</>}</span>
              <span className="text-xs font-extrabold ml-auto shrink-0">({formatPercent(todayPnLPercent, 1)})</span>
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
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-[var(--text-primary)] truncate">{p.label} Portfolio</span>
                    <span className="text-xs font-extrabold text-[var(--text-primary)] tnum shrink-0">{renderValue(p.totalCurrentValue)}</span>
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
            className="w-full flex items-center justify-between p-3.5 rounded-[var(--radius-large)] border border-[var(--border-subtle)] bg-[var(--surface)] hover:bg-[var(--surface-secondary)] transition-all text-left ios-press apple-card"
          >
            <div className="flex items-center gap-3 min-w-0">
              {/* Left Accent Indicator Pill */}
              <div className={`w-1.5 h-7 rounded-full ${item.accentColor} shrink-0`} />
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
