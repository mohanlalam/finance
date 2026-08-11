import { memo, useMemo } from 'react';
import { TrendingUp, TrendingDown, Landmark, Coins, Building2, Shield, FolderOpen, AlertCircle, RefreshCw, ChevronRight } from './icons/AppIcons';
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
  netWorthHistory = [],
}: MobileHomeSummaryProps) {
  const { isBalancesHidden } = usePrivacy();

  const renderValue = (val: number, formatter = formatINR) => {
    if (isBalancesHidden) return '••••••';
    return <AnimatedNumber value={val} formatter={formatter} />;
  };

  const sparklineData = useMemo(() => {
    if (!netWorthHistory || netWorthHistory.length === 0) return [];
    return netWorthHistory.slice(-7).map((snap) => snap.total_value);
  }, [netWorthHistory]);

  const sparklineColor = useMemo(() => {
    if (sparklineData.length < 2) return '#16a34a';
    return sparklineData[sparklineData.length - 1] >= sparklineData[0] ? '#16a34a' : '#dc2626';
  }, [sparklineData]);

  const isTotalGain = summaryData.totalPnL >= 0;
  const isTodayGain = todayPnL >= 0;

  // Counts for each asset type
  const stockCount = useMemo(() => {
    if (activePortfolio) return activePortfolio.holdings?.length || 0;
    return portfolios.reduce((sum, p) => sum + (p.holdings?.length || 0), 0);
  }, [activePortfolio, portfolios]);

  const fdCount = useMemo(() => {
    if (activePortfolio) return activePortfolio.fixedDeposits?.length || 0;
    return portfolios.reduce((sum, p) => sum + (p.fixedDeposits?.length || 0), 0);
  }, [activePortfolio, portfolios]);

  const rdCount = useMemo(() => {
    if (activePortfolio) return activePortfolio.rdAccounts?.length || 0;
    return portfolios.reduce((sum, p) => sum + (p.rdAccounts?.length || 0), 0);
  }, [activePortfolio, portfolios]);

  const sipCount = useMemo(() => {
    if (activePortfolio) return activePortfolio.sipAccounts?.length || 0;
    return portfolios.reduce((sum, p) => sum + (p.sipAccounts?.length || 0), 0);
  }, [activePortfolio, portfolios]);

  const goldCount = useMemo(() => {
    if (activePortfolio) return activePortfolio.goldHoldings?.length || 0;
    return portfolios.reduce((sum, p) => sum + (p.goldHoldings?.length || 0), 0);
  }, [activePortfolio, portfolios]);

  const propertyCount = useMemo(() => {
    if (activePortfolio) return activePortfolio.realEstate?.length || 0;
    return portfolios.reduce((sum, p) => sum + (p.realEstate?.length || 0), 0);
  }, [activePortfolio, portfolios]);

  const insuranceCount = useMemo(() => {
    if (activePortfolio) return activePortfolio.insurances?.length || 0;
    return portfolios.reduce((sum, p) => sum + (p.insurances?.length || 0), 0);
  }, [activePortfolio, portfolios]);

  const docCount = useMemo(() => {
    if (activePortfolio) return activePortfolio.documents?.length || 0;
    return portfolios.reduce((sum, p) => sum + (p.documents?.length || 0), 0);
  }, [activePortfolio, portfolios]);

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
      icon: <TrendingUp size={16} />,
      accentColor: 'bg-blue-600',
    },
    {
      id: 'fd' as const,
      label: 'Fixed Deposits',
      value: breakdown.fd,
      subtext: `${fdCount} FDs`,
      returnBadge: breakdown.fd > 0 ? `${getPercent(breakdown.fd).toFixed(0)}% Share` : null,
      icon: <Landmark size={16} />,
      accentColor: 'bg-indigo-600',
    },
    {
      id: 'rd' as const,
      label: 'Recurring Deposits',
      value: breakdown.rd,
      subtext: `${rdCount} Accounts`,
      returnBadge: breakdown.rd > 0 ? `${getPercent(breakdown.rd).toFixed(0)}% Share` : null,
      icon: <Landmark size={16} />,
      accentColor: 'bg-pink-600',
    },
    {
      id: 'sip' as const,
      label: 'SIP Mutual Funds',
      value: breakdown.sip,
      subtext: `${sipCount} Active SIPs`,
      returnBadge: breakdown.sip > 0 ? `${getPercent(breakdown.sip).toFixed(0)}% Share` : null,
      icon: <TrendingUp size={16} />,
      accentColor: 'bg-sky-600',
    },
    {
      id: 'gold' as const,
      label: 'Gold Holdings',
      value: breakdown.gold,
      subtext: `${goldCount} Items`,
      returnBadge: breakdown.gold > 0 ? `${getPercent(breakdown.gold).toFixed(0)}% Share` : null,
      icon: <Coins size={16} />,
      accentColor: 'bg-amber-600',
    },
    {
      id: 'real_estate' as const,
      label: 'Real Estate',
      value: breakdown.realEstate,
      subtext: `${propertyCount} Properties`,
      returnBadge: breakdown.realEstate > 0 ? `${getPercent(breakdown.realEstate).toFixed(0)}% Share` : null,
      icon: <Building2 size={16} />,
      accentColor: 'bg-emerald-600',
    },
    {
      id: 'insurance' as const,
      label: 'Insurance Cover',
      value: breakdown.insuranceCover,
      subtext: `${insuranceCount} Policies`,
      returnBadge: null,
      icon: <Shield size={16} />,
      accentColor: 'bg-rose-600',
    },
    {
      id: 'documents' as const,
      label: 'Document Vault',
      value: null,
      subtext: `${docCount} Documents`,
      returnBadge: null,
      icon: <FolderOpen size={16} />,
      accentColor: 'bg-slate-600',
    },
  ];

  return (
    <div className="space-y-3.5 md:hidden">

      {/* ── Flat Hero Summary Card ── */}
      <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)] p-4 shadow-xs space-y-4">
        {/* Header row */}
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">
            {summaryData.label} Net Worth
          </span>
          <button
            onClick={onRefresh}
            disabled={isLoadingPrices}
            className="flex items-center gap-1.5 px-3 py-1.5 min-h-[36px] rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold transition-all ios-press border border-slate-200/60 dark:border-slate-700/60"
          >
            <RefreshCw size={13} className={isLoadingPrices ? 'animate-spin text-blue-600' : ''} />
            <span>{isLoadingPrices ? 'Syncing' : 'Sync'}</span>
          </button>
        </div>

        {/* Hero Valuation */}
        <div className="flex items-end justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h2 className="text-[26px] font-extrabold text-[var(--text-primary)] tnum leading-tight tracking-tight truncate">
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

        {/* Total & Today Returns Row */}
        <div className="grid grid-cols-2 gap-2 pt-3 border-t border-[var(--border-subtle)]">
          {/* Total Return */}
          <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/50 dark:border-slate-700/40 min-w-0">
            <span className="text-[11px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider block mb-0.5 truncate">Total Return</span>
            <div className={`flex items-center gap-1 text-xs font-extrabold tnum min-w-0 ${isTotalGain ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
              {isTotalGain ? <TrendingUp size={13} className="shrink-0" /> : <TrendingDown size={13} className="shrink-0" />}
              <span className="truncate">{isBalancesHidden ? '••••••' : <>{isTotalGain ? '+' : ''}{formatINR(summaryData.totalPnL)}</>}</span>
              <span className="text-[10px] font-extrabold ml-auto shrink-0">({formatPercent(summaryData.totalPnLPercent, 1)})</span>
            </div>
          </div>

          {/* Today's Return */}
          <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/50 dark:border-slate-700/40 min-w-0">
            <span className="text-[11px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider block mb-0.5 truncate">Today's Return</span>
            <div className={`flex items-center gap-1 text-xs font-extrabold tnum min-w-0 ${isTodayGain ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
              {isTodayGain ? <TrendingUp size={13} className="shrink-0" /> : <TrendingDown size={13} className="shrink-0" />}
              <span className="truncate">{isBalancesHidden ? '••••••' : <>{isTodayGain ? '+' : ''}{formatINR(todayPnL)}</>}</span>
              <span className="text-[10px] font-extrabold ml-auto shrink-0">({formatPercent(todayPnLPercent, 1)})</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Portfolio Member Breakdown ── */}
      {activePortfolio === null && portfolios && portfolios.length > 0 && (
        <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)] p-3.5 shadow-xs space-y-2.5">
          <span className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider block">
            Family Breakdown
          </span>
          <div className="space-y-2">
            {portfolios.map((p) => {
              const pTodayPnL = estimateTodayPnL(p, [p]);
              const isGain = p.totalPnL >= 0;
              const isTodayGain = pTodayPnL >= 0;
              return (
                <div key={p.id} className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/40 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-[var(--text-primary)] truncate">{p.label} Portfolio</span>
                    <span className="text-xs font-extrabold text-[var(--text-primary)] tnum shrink-0">{renderValue(p.totalCurrentValue)}</span>
                  </div>

                  <div className="grid grid-cols-3 gap-1 pt-2 border-t border-slate-200/60 dark:border-slate-700/40 text-xs">
                    <div className="min-w-0">
                      <span className="text-[10px] text-[var(--text-tertiary)] uppercase font-semibold block truncate">Invested</span>
                      <span className="font-extrabold tnum text-[var(--text-secondary)] block truncate">{renderValue(p.totalInvested)}</span>
                    </div>
                    <div className="min-w-0">
                      <span className="text-[10px] text-[var(--text-tertiary)] uppercase font-semibold block truncate">Total Return</span>
                      <span className={`font-extrabold tnum block truncate ${isGain ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                        {isBalancesHidden ? '••••••' : formatPercent(p.totalPnLPercent, 1)}
                      </span>
                    </div>
                    <div className="text-right min-w-0">
                      <span className="text-[10px] text-[var(--text-tertiary)] uppercase font-semibold block truncate">Today's P&amp;L</span>
                      <span className={`font-extrabold tnum block truncate ${isTodayGain ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
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
          className="w-full flex items-center justify-between p-3.5 rounded-xl text-left border bg-rose-50/90 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/40 active:scale-[0.98] transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-rose-600 text-white flex items-center justify-center shrink-0">
              <AlertCircle size={16} />
            </div>
            <div>
              <h4 className="text-xs font-extrabold text-rose-900 dark:text-rose-200">{alertCount} Portfolio Alerts</h4>
              <p className="text-[11px] text-rose-700 dark:text-rose-300">Tap to review warnings</p>
            </div>
          </div>
          <ChevronRight size={16} className="text-rose-500 shrink-0" />
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
            className="w-full flex items-center justify-between p-3.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)] hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-all text-left active:scale-[0.98]"
          >
            <div className="flex items-center gap-3 min-w-0">
              {/* Left Accent Indicator Pill */}
              <div className={`w-1.5 h-7 rounded-full ${item.accentColor} shrink-0`} />
              <div className="min-w-0">
                <h4 className="text-xs font-bold text-[var(--text-primary)] truncate">{item.label}</h4>
                <p className="text-[11px] font-medium text-[var(--text-tertiary)] mt-0.5 truncate">{item.subtext}</p>
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
                  <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 block mt-0.5">
                    {item.returnBadge}
                  </span>
                )}
              </div>
              <ChevronRight size={14} className="text-slate-400 dark:text-slate-600" />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

export default memo(MobileHomeSummary);
