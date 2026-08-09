import { memo, useMemo } from 'react';
import { TrendingUp, TrendingDown, Landmark, Coins, Building2, Shield, FolderOpen, AlertCircle, RefreshCw, ChevronRight, Clock, Calculator, IndianRupee, PieChart } from './icons/AppIcons';
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
  alerts,
  lastUpdated,
  priceStatus,
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
    if (sparklineData.length < 2) return '#10b981';
    return sparklineData[sparklineData.length - 1] >= sparklineData[0] ? '#10b981' : '#ef4444';
  }, [sparklineData]);

  const {
    stockCount, fdCount, rdCount, sipCount,
    goldCount, propertyCount, insuranceCount, docCount,
    stocksInvested, sipInvested
  } = useMemo(() => {
    let stockCount = 0, fdCount = 0, rdCount = 0, sipCount = 0,
        goldCount = 0, propertyCount = 0, insuranceCount = 0, docCount = 0,
        stocksInvested = 0, sipInvested = 0;
    const ps = activePortfolio ? [activePortfolio] : portfolios;
    for (const p of ps) {
      stockCount += p.holdings?.length || 0;
      fdCount += p.fixedDeposits?.length || 0;
      rdCount += p.rdAccounts?.length || 0;
      sipCount += p.sipAccounts?.length || 0;
      goldCount += p.goldHoldings?.length || 0;
      propertyCount += p.realEstate?.length || 0;
      insuranceCount += p.insurances?.length || 0;
      docCount += p.documents?.length || 0;

      for (const h of p.holdings || []) {
        stocksInvested += h.amountInvested || 0;
      }
      for (const s of p.sipAccounts || []) {
        sipInvested += s.fallback_valuation || 0;
      }
    }
    return { stockCount, fdCount, rdCount, sipCount, goldCount, propertyCount, insuranceCount, docCount, stocksInvested, sipInvested };
  }, [activePortfolio, portfolios]);

  const stocksPnL = breakdown.stocks - stocksInvested;
  const stocksPnLPercent = stocksInvested > 0 ? (stocksPnL / stocksInvested) * 100 : 0;

  const totalValue =
    breakdown.stocks + breakdown.fd + breakdown.rd +
    breakdown.sip + breakdown.gold + breakdown.realEstate;
  const getPercent = (val: number) => (totalValue > 0 ? (val / totalValue) * 100 : 0);

  // Member identity badge colors
  const memberColors = [
    { bg: 'bg-blue-500', text: 'text-blue-400', border: 'border-blue-500/30' },
    { bg: 'bg-rose-500', text: 'text-rose-400', border: 'border-rose-500/30' },
    { bg: 'bg-purple-500', text: 'text-purple-400', border: 'border-purple-500/30' },
    { bg: 'bg-emerald-500', text: 'text-emerald-400', border: 'border-emerald-500/30' },
    { bg: 'bg-amber-500', text: 'text-amber-400', border: 'border-amber-500/30' },
  ];

  const isTodayGain = todayPnL >= 0;
  const isTotalGain = summaryData.totalPnL >= 0;

  // Asset card definitions with accent colors and returns
  const assetCardDefs = [
    {
      id: 'stocks' as const,
      label: 'Stocks & ETFs',
      value: breakdown.stocks,
      subtext: `${stockCount} Holdings`,
      returnBadge: stocksInvested > 0 ? formatPercent(stocksPnLPercent, 1) : null,
      isReturnGain: stocksPnL >= 0,
      icon: <TrendingUp size={18} />,
      iconBg: 'bg-blue-500',
      grad: 'from-blue-50 to-indigo-50/30 dark:from-blue-950/30 dark:to-indigo-950/10',
      border: 'border-blue-100/60 dark:border-blue-900/30',
      bar: 'bg-blue-500'
    },
    {
      id: 'fd' as const,
      label: 'Fixed Deposits',
      value: breakdown.fd,
      subtext: `${fdCount} Active FDs`,
      returnBadge: breakdown.fd > 0 ? `${getPercent(breakdown.fd).toFixed(0)}% Share` : null,
      isReturnGain: true,
      icon: <Landmark size={18} />,
      iconBg: 'bg-indigo-500',
      grad: 'from-indigo-50 to-purple-50/30 dark:from-indigo-950/30 dark:to-purple-950/10',
      border: 'border-indigo-100/60 dark:border-indigo-900/30',
      bar: 'bg-indigo-500'
    },
    {
      id: 'rd' as const,
      label: 'Recurring Dep.',
      value: breakdown.rd,
      subtext: `${rdCount} Active RDs`,
      returnBadge: breakdown.rd > 0 ? `${getPercent(breakdown.rd).toFixed(0)}% Share` : null,
      isReturnGain: true,
      icon: <Clock size={18} />,
      iconBg: 'bg-pink-500',
      grad: 'from-pink-50 to-rose-50/30 dark:from-pink-950/30 dark:to-rose-950/10',
      border: 'border-pink-100/60 dark:border-pink-900/30',
      bar: 'bg-pink-500'
    },
    {
      id: 'sip' as const,
      label: 'SIP Mutual Funds',
      value: breakdown.sip,
      subtext: `${sipCount} SIPs`,
      returnBadge: breakdown.sip > 0 ? `${getPercent(breakdown.sip).toFixed(0)}% Share` : null,
      isReturnGain: true,
      icon: <TrendingUp size={18} />,
      iconBg: 'bg-sky-500',
      grad: 'from-sky-50 to-cyan-50/30 dark:from-sky-950/30 dark:to-cyan-950/10',
      border: 'border-sky-100/60 dark:border-sky-900/30',
      bar: 'bg-sky-500'
    },
    {
      id: 'gold' as const,
      label: 'Gold Holdings',
      value: breakdown.gold,
      subtext: `${goldCount} Items`,
      returnBadge: breakdown.gold > 0 ? `${getPercent(breakdown.gold).toFixed(0)}% Share` : null,
      isReturnGain: true,
      icon: <Coins size={18} />,
      iconBg: 'bg-amber-500',
      grad: 'from-amber-50 to-orange-50/30 dark:from-amber-950/30 dark:to-orange-950/10',
      border: 'border-amber-100/60 dark:border-amber-900/30',
      bar: 'bg-amber-500'
    },
    {
      id: 'real_estate' as const,
      label: 'Real Estate',
      value: breakdown.realEstate,
      subtext: `${propertyCount} Properties`,
      returnBadge: breakdown.realEstate > 0 ? `${getPercent(breakdown.realEstate).toFixed(0)}% Share` : null,
      isReturnGain: true,
      icon: <Building2 size={18} />,
      iconBg: 'bg-emerald-500',
      grad: 'from-emerald-50 to-teal-50/30 dark:from-emerald-950/30 dark:to-teal-950/10',
      border: 'border-emerald-100/60 dark:border-emerald-900/30',
      bar: 'bg-emerald-500'
    },
    {
      id: 'insurance' as const,
      label: 'Insurance Cover',
      value: breakdown.insuranceCover,
      subtext: `${insuranceCount} Policies`,
      returnBadge: null,
      isReturnGain: true,
      icon: <Shield size={18} />,
      iconBg: 'bg-rose-500',
      grad: 'from-rose-50 to-pink-50/30 dark:from-rose-950/30 dark:to-pink-950/10',
      border: 'border-rose-100/60 dark:border-rose-900/30',
      bar: 'bg-rose-500'
    },
    {
      id: 'documents' as const,
      label: 'Document Vault',
      value: null,
      subtext: `${docCount} Documents`,
      returnBadge: null,
      isReturnGain: true,
      icon: <FolderOpen size={18} />,
      iconBg: 'bg-slate-500 dark:bg-slate-600',
      grad: 'from-slate-50 to-slate-100/30 dark:from-slate-800/40 dark:to-slate-900/10',
      border: 'border-slate-200/60 dark:border-slate-700/40',
      bar: 'bg-slate-400'
    },
  ];

  return (
    <div className="space-y-3 md:hidden">

      {/* ── Hero Net Worth & Investment Card ── */}
      <div className="relative overflow-hidden rounded-[24px] bg-gradient-to-br from-[#1a1f3c] via-[#0f172a] to-[#1e1b4b] dark:from-[#0a0f1f] dark:via-[#080d1a] dark:to-[#12103a] shadow-xl animate-glow-pulse">
        {/* Ambient background blur orbs */}
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-blue-500/10 blur-2xl pointer-events-none" />
        <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full bg-indigo-500/10 blur-2xl pointer-events-none" />

        <div className="relative z-10 p-5 pb-4">
          {/* Header row */}
          <div className="flex items-center justify-between mb-3.5">
            <span className="text-[11px] font-bold text-slate-300 uppercase tracking-widest">{summaryData.label} Portfolio Summary</span>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-400/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] font-bold text-emerald-400 tracking-wide">Live Sync</span>
            </div>
          </div>

          {/* Primary Valuation & Investment Grid */}
          <div className="grid grid-cols-2 gap-3 mb-4 p-3.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
            {/* Current Net Worth */}
            <div className="space-y-0.5">
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Current Net Worth</p>
              <h2 className="text-[22px] font-extrabold text-white tnum leading-tight tracking-tight">
                {renderValue(summaryData.totalCurrentValue)}
              </h2>
            </div>
            {/* Total Invested */}
            <div className="space-y-0.5 border-l border-white/10 pl-3">
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Total Invested</p>
              <h3 className="text-[22px] font-extrabold text-slate-200 tnum leading-tight tracking-tight">
                {renderValue(summaryData.totalInvested)}
              </h3>
            </div>
          </div>

          {/* Key P&L Chips Row (Amount + Return % Badge) */}
          <div className="flex gap-3">
            {/* Total Profit / Return chip */}
            <div className={`flex-1 rounded-2xl p-3 ${isTotalGain ? 'bg-emerald-500/15 border border-emerald-400/25' : 'bg-red-500/15 border border-red-400/25'}`}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[9.5px] text-slate-300 font-bold uppercase tracking-wider">Total Profit</span>
                <span className={`text-[9.5px] font-extrabold px-1.5 py-0.5 rounded-md tnum ${isTotalGain ? 'bg-emerald-400/20 text-emerald-300' : 'bg-red-400/20 text-red-300'}`}>
                  {formatPercent(summaryData.totalPnLPercent, 1)}
                </span>
              </div>
              <div className={`flex items-center gap-1 ${isTotalGain ? 'text-emerald-400' : 'text-red-400'}`}>
                {isTotalGain ? <TrendingUp size={14} className="shrink-0" /> : <TrendingDown size={14} className="shrink-0" />}
                <span className="text-[15px] font-extrabold tnum leading-tight">
                  {isBalancesHidden ? '••••••' : <>{summaryData.totalPnL >= 0 ? '+' : ''}<AnimatedNumber value={summaryData.totalPnL} formatter={formatINR} /></>}
                </span>
              </div>
            </div>

            {/* Today's Return chip */}
            <div className={`flex-1 rounded-2xl p-3 ${isTodayGain ? 'bg-emerald-500/15 border border-emerald-400/25' : 'bg-red-500/15 border border-red-400/25'}`}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[9.5px] text-slate-300 font-bold uppercase tracking-wider">Today's Return</span>
                <span className={`text-[9.5px] font-extrabold px-1.5 py-0.5 rounded-md tnum ${isTodayGain ? 'bg-emerald-400/20 text-emerald-300' : 'bg-red-400/20 text-red-300'}`}>
                  {formatPercent(todayPnLPercent, 1)}
                </span>
              </div>
              <div className={`flex items-center gap-1 ${isTodayGain ? 'text-emerald-400' : 'text-red-400'}`}>
                {isTodayGain ? <TrendingUp size={14} className="shrink-0" /> : <TrendingDown size={14} className="shrink-0" />}
                <span className="text-[15px] font-extrabold tnum leading-tight">
                  {isBalancesHidden ? '••••••' : <>{todayPnL >= 0 ? '+' : ''}<AnimatedNumber value={todayPnL} formatter={formatINR} /></>}
                </span>
              </div>
            </div>
          </div>

          {/* Member Detailed Breakdown (Net Worth, Invested, Profit & % Return per Member) */}
          {activePortfolio === null && portfolios && portfolios.length > 0 && (
            <div className="mt-4 pt-3.5 border-t border-white/10 space-y-2.5">
              <div className="flex items-center justify-between">
                <p className="text-[9.5px] font-extrabold uppercase tracking-widest text-slate-400">Family Members Overview</p>
                <span className="text-[9.5px] font-semibold text-slate-400">{portfolios.length} Members</span>
              </div>

              <div className="space-y-2">
                {portfolios.map((p, i) => {
                  const mColor = memberColors[i % memberColors.length];
                  const pnl = p.totalPnL;
                  const pnlPct = p.totalPnLPercent;
                  const isMemGain = pnl >= 0;

                  return (
                    <div
                      key={p.id}
                      className="p-3 rounded-xl bg-white/5 border border-white/10 flex flex-col gap-1.5 transition-colors"
                    >
                      {/* Top row: Member name + Return % badge */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={`w-2.5 h-2.5 rounded-full ${mColor.bg} shrink-0`} />
                          <span className="text-[13px] text-white font-bold">{p.label}</span>
                        </div>
                        <div className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-[10.5px] font-extrabold tnum ${isMemGain ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-400/30' : 'bg-red-500/20 text-red-400 border border-red-400/30'}`}>
                          {isMemGain ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                          <span>{formatPercent(pnlPct, 1)} Return</span>
                        </div>
                      </div>

                      {/* Bottom row: Net Worth | Invested | Profit */}
                      <div className="grid grid-cols-3 gap-1 pt-1 border-t border-white/10 text-[11px]">
                        <div>
                          <p className="text-[9px] font-medium text-slate-400 uppercase">Net Worth</p>
                          <p className="text-[11.5px] font-extrabold text-white tnum leading-tight">{renderValue(p.totalCurrentValue)}</p>
                        </div>
                        <div>
                          <p className="text-[9px] font-medium text-slate-400 uppercase">Invested</p>
                          <p className="text-[11.5px] font-bold text-slate-300 tnum leading-tight">{renderValue(p.totalInvested)}</p>
                        </div>
                        <div>
                          <p className="text-[9px] font-medium text-slate-400 uppercase">Profit / Loss</p>
                          <p className={`text-[11.5px] font-extrabold tnum leading-tight ${isMemGain ? 'text-emerald-400' : 'text-red-400'}`}>
                            {isBalancesHidden ? '••••' : <>{pnl >= 0 ? '+' : ''}<AnimatedNumber value={pnl} formatter={formatINR} /></>}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Refresh Status Bar ── */}
      <div className="flex items-center justify-between px-4 py-2.5 rounded-2xl text-[11px] bg-white/80 dark:bg-zinc-900/80 backdrop-blur border border-[var(--border-subtle)] shadow-sm">
        <div className="flex items-center gap-2 min-w-0">
          <span className={`w-2 h-2 rounded-full shrink-0 ${priceStatus === 'success' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
          <span className="font-semibold text-slate-600 dark:text-slate-300 shrink-0">{priceStatus === 'success' ? 'Live Prices' : 'Snapshot'}</span>
          <span className="text-slate-300 dark:text-slate-700 shrink-0">·</span>
          <span className="truncate text-slate-400 dark:text-slate-500">{lastUpdated ? lastUpdated.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : 'Never'}</span>
        </div>
        <button onClick={onRefresh} disabled={isLoadingPrices} className="flex items-center gap-1.5 font-bold text-[#007aff] dark:text-[#60a5fa] active:opacity-60 transition-opacity shrink-0 ml-2 disabled:opacity-40">
          <RefreshCw size={11} className={isLoadingPrices ? 'animate-spin' : ''} />
          Sync
        </button>
      </div>

      {/* ── Asset Allocation Bar ── */}
      {totalValue > 0 && (
        <div className="apple-card p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">Asset Allocation</span>
            <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{renderValue(totalValue)}</span>
          </div>
          <div className="w-full h-3 bg-slate-100 dark:bg-zinc-800 rounded-full flex overflow-hidden shadow-inner gap-px">
            {breakdown.stocks > 0 && <div className="h-full bg-blue-500 animate-bar-fill" style={{ width: `${getPercent(breakdown.stocks)}%` }} />}
            {breakdown.fd > 0 && <div className="h-full bg-indigo-500 animate-bar-fill" style={{ width: `${getPercent(breakdown.fd)}%`, animationDelay: '80ms' }} />}
            {breakdown.rd > 0 && <div className="h-full bg-pink-500 animate-bar-fill" style={{ width: `${getPercent(breakdown.rd)}%`, animationDelay: '150ms' }} />}
            {breakdown.sip > 0 && <div className="h-full bg-sky-500 animate-bar-fill" style={{ width: `${getPercent(breakdown.sip)}%`, animationDelay: '220ms' }} />}
            {breakdown.gold > 0 && <div className="h-full bg-amber-400 animate-bar-fill" style={{ width: `${getPercent(breakdown.gold)}%`, animationDelay: '280ms' }} />}
            {breakdown.realEstate > 0 && <div className="h-full bg-emerald-500 animate-bar-fill" style={{ width: `${getPercent(breakdown.realEstate)}%`, animationDelay: '330ms' }} />}
          </div>
          <div className="grid grid-cols-3 gap-x-2 gap-y-1.5 pt-0.5">
            {[
              { k: 'stocks', label: 'Stocks', color: 'bg-blue-500', val: breakdown.stocks },
              { k: 'fd', label: 'Fixed D.', color: 'bg-indigo-500', val: breakdown.fd },
              { k: 'rd', label: 'Recurring', color: 'bg-pink-500', val: breakdown.rd },
              { k: 'sip', label: 'SIP MF', color: 'bg-sky-500', val: breakdown.sip },
              { k: 'gold', label: 'Gold', color: 'bg-amber-400', val: breakdown.gold },
              { k: 'realty', label: 'Realty', color: 'bg-emerald-500', val: breakdown.realEstate },
            ].filter(i => i.val > 0).map(item => (
              <div key={item.k} className="flex items-center gap-1.5 min-w-0">
                <span className={`w-2 h-2 rounded-full ${item.color} shrink-0`} />
                <span className="text-[9.5px] font-semibold text-slate-500 dark:text-slate-400 truncate">{item.label} ({getPercent(item.val).toFixed(0)}%)</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Portfolio Alerts Widget ── */}
      <button
        onClick={onOpenAlerts}
        className={`w-full flex items-center justify-between p-4 rounded-2xl mobile-asset-card text-left border ${
          alertCount > 0
            ? 'bg-rose-50/80 dark:bg-rose-950/20 border-rose-200/60 dark:border-rose-900/30'
            : 'bg-white dark:bg-zinc-900 border-[var(--border-subtle)]'
        }`}
      >
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
            alertCount > 0 ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/30' : 'bg-slate-100 dark:bg-zinc-800 text-slate-400'
          }`}>
            <AlertCircle size={18} />
          </div>
          <div>
            <h4 className="text-[12.5px] font-bold text-slate-800 dark:text-slate-100">Portfolio Alerts</h4>
            <p className="text-[10.5px] text-slate-400 dark:text-slate-500 mt-0.5">
              {alertCount > 0 ? `${alertCount} alerts need your attention` : 'All assets are looking healthy'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {alertCount > 0 && (
            <span className="bg-rose-500 text-white text-[9px] font-bold min-w-[20px] h-5 flex items-center justify-center rounded-full px-1">
              {alertCount > 9 ? '9+' : alertCount}
            </span>
          )}
          <ChevronRight size={15} className="text-slate-300 dark:text-slate-600" />
        </div>
      </button>

      {/* ── Alert Strips ── */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between px-0.5">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Critical Alerts</span>
            <button onClick={onOpenAlerts} className="text-[10px] font-bold text-[#007aff] dark:text-[#60a5fa]">View All ({alerts.length})</button>
          </div>
          <div className="space-y-2">
            {alerts.slice(0, 2).map((alert) => (
              <div
                key={alert.id}
                onClick={onOpenAlerts}
                className={`p-3.5 border rounded-2xl mobile-asset-card cursor-pointer flex items-start gap-3 ${
                  alert.severity === 'critical' ? 'bg-red-50/80 border-red-100 dark:bg-red-950/20 dark:border-red-900/30'
                    : alert.severity === 'warning' ? 'bg-amber-50/80 border-amber-100 dark:bg-amber-950/20 dark:border-amber-900/30'
                    : 'bg-blue-50/80 border-blue-100 dark:bg-blue-950/20 dark:border-blue-900/30'
                }`}
              >
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-white ${
                  alert.severity === 'critical' ? 'bg-red-500' : alert.severity === 'warning' ? 'bg-amber-500' : 'bg-blue-500'
                }`}>
                  <AlertCircle size={16} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 justify-between">
                    <h5 className={`text-xs font-bold truncate ${
                      alert.severity === 'critical' ? 'text-red-800 dark:text-red-300'
                        : alert.severity === 'warning' ? 'text-amber-800 dark:text-amber-300'
                        : 'text-blue-800 dark:text-blue-300'
                    }`}>{alert.title}</h5>
                    {alert.portfolioLabel && (
                      <span className="text-[8.5px] font-extrabold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-1.5 py-0.5 rounded-md uppercase tracking-wider shrink-0">{alert.portfolioLabel}</span>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5 leading-tight">{alert.message}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Quick Asset Summary Grid ── */}
      <div className="space-y-2.5">
        <h3 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest px-0.5">Asset Summary</h3>
        <div className="grid grid-cols-2 gap-2.5">
          {assetCardDefs.map((card, idx) => (
            <button
              key={card.id}
              onClick={() => onNavigateAsset(card.id)}
              className={`mobile-card-enter mobile-asset-card relative overflow-hidden bg-gradient-to-br ${card.grad} border ${card.border} rounded-[18px] p-3.5 text-left flex flex-col justify-between h-[116px]`}
              style={{ animationDelay: `${idx * 40}ms` }}
            >
              <div className={`absolute left-0 top-3 bottom-3 w-[3px] rounded-r-full ${card.bar}`} />
              <div className="flex items-center justify-between w-full">
                <div className={`w-8 h-8 rounded-xl ${card.iconBg} text-white flex items-center justify-center shadow-sm`}>{card.icon}</div>
                {card.returnBadge ? (
                  <span className={`text-[9.5px] font-extrabold px-1.5 py-0.5 rounded-md tnum ${card.isReturnGain ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' : 'bg-red-500/15 text-red-600 dark:text-red-400'}`}>
                    {card.returnBadge}
                  </span>
                ) : (
                  <ChevronRight size={13} className="text-slate-300 dark:text-slate-600" />
                )}
              </div>
              <div className="mt-1">
                <p className="text-[9.5px] font-bold text-slate-400 dark:text-slate-500 truncate uppercase tracking-wide leading-none mb-1">{card.label}</p>
                <p className="text-[14.5px] font-extrabold text-slate-800 dark:text-slate-100 tnum truncate leading-tight">{card.value !== null ? renderValue(card.value) : 'Vault'}</p>
                <p className="text-[9.5px] text-slate-400 dark:text-slate-500 font-semibold mt-0.5 leading-none">{card.subtext}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* ── Tools & Calculators ── */}
      <div className="space-y-2.5 pb-2">
        <h3 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest px-0.5">Tools & Calculators</h3>
        <button onClick={() => onNavigateAsset('what_if')} className="mobile-asset-card w-full relative overflow-hidden bg-gradient-to-br from-indigo-600 via-blue-600 to-violet-700 rounded-[18px] p-4 text-left shadow-lg shadow-indigo-500/20 flex items-center justify-between">
          <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-white/10 blur-lg pointer-events-none" />
          <div className="flex items-center gap-3 relative z-10">
            <div className="w-11 h-11 rounded-2xl bg-white/20 text-white flex items-center justify-center border border-white/10">
              <Calculator size={20} />
            </div>
            <div>
              <h4 className="text-[13px] font-bold text-white">What-If Calculator</h4>
              <p className="text-[10.5px] text-blue-200/80 mt-0.5">Project future portfolio growth</p>
            </div>
          </div>
          <ChevronRight size={16} className="text-white/60 relative z-10 shrink-0" />
        </button>
      </div>
    </div>
  );
}

// React.memo prevents re-renders when parent state (e.g. lastUpdated) changes
// but none of MobileHomeSummary's own props have changed
export default memo(MobileHomeSummary);
