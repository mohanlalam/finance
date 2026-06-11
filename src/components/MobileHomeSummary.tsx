import { memo, useMemo } from 'react';
import { TrendingUp, TrendingDown, Landmark, Coins, Building2, Shield, FolderOpen, AlertCircle, RefreshCw, ChevronRight, Clock, Calculator } from './icons/AppIcons';
import { formatINR, formatPercent } from '../utils/formatters';
import { Portfolio } from '../types/portfolio';
import { Alert } from '../hooks/useAlerts';

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
}: MobileHomeSummaryProps) {
  // Single-pass count computation — avoids 9 separate reduce() calls on every render
  const {
    stockCount, fdCount, rdCount, sipCount,
    goldCount, propertyCount, insuranceCount, docCount
  } = useMemo(() => {
    let stockCount = 0, fdCount = 0, rdCount = 0, sipCount = 0,
        goldCount = 0, propertyCount = 0, insuranceCount = 0, docCount = 0;
    const ps = activePortfolio ? [activePortfolio] : portfolios;
    for (const p of ps) {
      stockCount += p.holdings.length;
      for (const f of p.fixedDeposits) {
        if (!f.fd_type || f.fd_type === 'regular') fdCount++;
        else if (f.fd_type === 'recurring') rdCount++;
        else if (f.fd_type === 'sip') sipCount++;
      }
      goldCount      += p.goldHoldings.length;
      propertyCount  += p.realEstate.length;
      insuranceCount += p.insurances.length;
      docCount       += p.documents.length;
    }
    return { stockCount, fdCount, rdCount, sipCount, goldCount, propertyCount, insuranceCount, docCount };
  }, [activePortfolio, portfolios]);

  const totalValue =
    breakdown.stocks +
    breakdown.fd +
    breakdown.rd +
    breakdown.sip +
    breakdown.gold +
    breakdown.realEstate;

  const getPercent = (val: number) => {
    return totalValue > 0 ? (val / totalValue) * 100 : 0;
  };

  const assetCards = [
    {
      id: 'stocks' as const,
      label: 'Stocks & ETFs',
      value: breakdown.stocks,
      subtext: `${stockCount} Holdings`,
      icon: <TrendingUp size={20} className="text-blue-500" />,
      bg: 'from-blue-50/50 to-indigo-50/20 dark:from-blue-950/20 dark:to-indigo-950/5 border-blue-100/50 dark:border-blue-900/30',
    },
    {
      id: 'fd' as const,
      label: 'Fixed Deposits',
      value: breakdown.fd,
      subtext: `${fdCount} Active FDs`,
      icon: <Landmark size={20} className="text-indigo-500" />,
      bg: 'from-indigo-50/50 to-purple-50/20 dark:from-indigo-950/20 dark:to-purple-950/5 border-indigo-100/50 dark:border-indigo-900/30',
    },
    {
      id: 'rd' as const,
      label: 'Recurring Deposits',
      value: breakdown.rd,
      subtext: `${rdCount} Active RDs`,
      icon: <Clock size={20} className="text-pink-500" />,
      bg: 'from-pink-50/50 to-rose-50/20 dark:from-pink-950/20 dark:to-rose-950/5 border-pink-100/50 dark:border-pink-900/30',
    },
    {
      id: 'sip' as const,
      label: 'SIP Mutual Funds',
      value: breakdown.sip,
      subtext: `${sipCount} SIPs`,
      icon: <TrendingUp size={20} className="text-sky-500" />,
      bg: 'from-sky-50/50 to-cyan-50/20 dark:from-sky-950/20 dark:to-cyan-950/5 border-sky-100/50 dark:border-sky-900/30',
    },
    {
      id: 'gold' as const,
      label: 'Gold Holdings',
      value: breakdown.gold,
      subtext: `${goldCount} Items`,
      icon: <Coins size={20} className="text-amber-500" />,
      bg: 'from-amber-50/50 to-orange-50/20 dark:from-amber-950/20 dark:to-orange-950/5 border-amber-100/50 dark:border-amber-900/30',
    },
    {
      id: 'real_estate' as const,
      label: 'Real Estate',
      value: breakdown.realEstate,
      subtext: `${propertyCount} Properties`,
      icon: <Building2 size={20} className="text-emerald-500" />,
      bg: 'from-emerald-50/50 to-teal-50/20 dark:from-emerald-950/20 dark:to-teal-950/5 border-emerald-100/50 dark:border-emerald-900/30',
    },
    {
      id: 'insurance' as const,
      label: 'Insurance Cover',
      value: breakdown.insuranceCover,
      subtext: `${insuranceCount} Policies`,
      icon: <Shield size={20} className="text-rose-500" />,
      bg: 'from-rose-50/50 to-pink-50/20 dark:from-rose-950/20 dark:to-pink-950/5 border-rose-100/50 dark:border-rose-900/30',
    },
    {
      id: 'documents' as const,
      label: 'Documents',
      value: null,
      subtext: `${docCount} Documents`,
      icon: <FolderOpen size={20} className="text-slate-500 dark:text-slate-400" />,
      bg: 'from-slate-50/50 to-slate-100/20 dark:from-slate-800/30 dark:to-slate-900/10 border-slate-200/50 dark:border-slate-700/50',
    },
  ];

  return (
    <div className="space-y-5 md:hidden">
      {/* Net Worth Summary Card */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 text-white rounded-3xl p-6 border border-slate-800 dark:border-slate-800/80 shadow-xl">
        {/* Glowing background accent elements */}
        <div className="absolute top-0 right-0 w-36 h-36 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center justify-between relative z-10">
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
            {summaryData.label} Net Worth
          </span>
          <span className="text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-0.5 rounded-full flex items-center gap-1.5 shadow-sm">
            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
            Intraday Live
          </span>
        </div>

        <h2 className="text-4xl font-extrabold tracking-tight mt-3 bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent relative z-10">
          {formatINR(summaryData.totalCurrentValue)}
        </h2>

        {/* PNL Grid */}
        <div className="grid grid-cols-2 gap-4 mt-5 pt-5 border-t border-white/10 relative z-10">
          <div className="space-y-1">
            <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Today's P&amp;L</p>
            <div className={`flex items-start gap-1.5 ${todayPnL >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {todayPnL >= 0 ? (
                <TrendingUp size={16} className="shrink-0 mt-0.5" />
              ) : (
                <TrendingDown size={16} className="shrink-0 mt-0.5" />
              )}
              <div className="flex flex-col">
                <span className="text-base font-bold whitespace-nowrap leading-tight">
                  {todayPnL >= 0 ? '+' : ''}{formatINR(todayPnL)}
                </span>
                <span className="text-[11px] font-semibold whitespace-nowrap opacity-90 leading-none mt-0.5">
                  ({todayPnL >= 0 ? '+' : ''}{formatPercent(todayPnLPercent)})
                </span>
              </div>
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Total P&amp;L</p>
            <div className={`flex items-start gap-1.5 ${summaryData.totalPnL >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {summaryData.totalPnL >= 0 ? (
                <TrendingUp size={16} className="shrink-0 mt-0.5" />
              ) : (
                <TrendingDown size={16} className="shrink-0 mt-0.5" />
              )}
              <div className="flex flex-col">
                <span className="text-base font-bold whitespace-nowrap leading-tight">
                  {summaryData.totalPnL >= 0 ? '+' : ''}{formatINR(summaryData.totalPnL)}
                </span>
                <span className="text-[11px] font-semibold whitespace-nowrap opacity-90 leading-none mt-0.5">
                  ({summaryData.totalPnL >= 0 ? '+' : ''}{formatPercent(summaryData.totalPnLPercent)})
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Mini Refresh Status Bar */}
      <div className="flex items-center justify-between px-3.5 py-2.5 bg-white/70 dark:bg-slate-800/70 border border-slate-200/50 dark:border-slate-700/30 rounded-2xl text-[11px] text-slate-500 dark:text-slate-400 backdrop-blur shadow-sm">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className={`w-2 h-2 rounded-full shrink-0 ${priceStatus === 'success' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
          <span className="font-semibold shrink-0">{priceStatus === 'success' ? 'Live Prices' : 'Snapshot'}</span>
          <span className="text-slate-300 dark:text-slate-700 shrink-0">•</span>
          <span className="truncate">Updated {lastUpdated ? lastUpdated.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : 'Never'}</span>
        </div>
        <button
          onClick={onRefresh}
          disabled={isLoadingPrices}
          className="flex items-center gap-1 font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 active:scale-95 transition-all shrink-0 ml-2"
        >
          <RefreshCw size={11} className={isLoadingPrices ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Asset Allocation Section */}
      {totalValue > 0 && (
        <div className="bg-white dark:bg-slate-800 border border-slate-200/50 dark:border-slate-800/80 rounded-2xl p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">Asset Allocation</span>
            <span className="text-xs font-bold text-slate-600 dark:text-slate-300">{formatINR(totalValue)}</span>
          </div>
          
          <div className="w-full h-3.5 bg-slate-100 dark:bg-slate-700 rounded-full flex overflow-hidden shadow-inner">
            {breakdown.stocks > 0 && <div className="h-full bg-blue-500 transition-all duration-500" style={{ width: `${getPercent(breakdown.stocks)}%` }} />}
            {breakdown.fd > 0 && <div className="h-full bg-indigo-500 transition-all duration-500" style={{ width: `${getPercent(breakdown.fd)}%` }} />}
            {breakdown.rd > 0 && <div className="h-full bg-pink-500 transition-all duration-500" style={{ width: `${getPercent(breakdown.rd)}%` }} />}
            {breakdown.sip > 0 && <div className="h-full bg-sky-500 transition-all duration-500" style={{ width: `${getPercent(breakdown.sip)}%` }} />}
            {breakdown.gold > 0 && <div className="h-full bg-amber-500 transition-all duration-500" style={{ width: `${getPercent(breakdown.gold)}%` }} />}
            {breakdown.realEstate > 0 && <div className="h-full bg-emerald-500 transition-all duration-500" style={{ width: `${getPercent(breakdown.realEstate)}%` }} />}
          </div>

          <div className="grid grid-cols-3 gap-y-2 gap-x-2 pt-1 text-[9.5px] font-bold text-slate-500 dark:text-slate-400">
            {breakdown.stocks > 0 && (
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="w-2.5 h-2.5 rounded bg-blue-500 shrink-0" />
                <span className="truncate">Stocks ({getPercent(breakdown.stocks).toFixed(0)}%)</span>
              </div>
            )}
            {breakdown.fd > 0 && (
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="w-2.5 h-2.5 rounded bg-indigo-500 shrink-0" />
                <span className="truncate">FD ({getPercent(breakdown.fd).toFixed(0)}%)</span>
              </div>
            )}
            {breakdown.rd > 0 && (
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="w-2.5 h-2.5 rounded bg-pink-500 shrink-0" />
                <span className="truncate">RD ({getPercent(breakdown.rd).toFixed(0)}%)</span>
              </div>
            )}
            {breakdown.sip > 0 && (
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="w-2.5 h-2.5 rounded bg-sky-500 shrink-0" />
                <span className="truncate">SIP ({getPercent(breakdown.sip).toFixed(0)}%)</span>
              </div>
            )}
            {breakdown.gold > 0 && (
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="w-2.5 h-2.5 rounded bg-amber-500 shrink-0" />
                <span className="truncate">Gold ({getPercent(breakdown.gold).toFixed(0)}%)</span>
              </div>
            )}
            {breakdown.realEstate > 0 && (
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="w-2.5 h-2.5 rounded bg-emerald-500 shrink-0" />
                <span className="truncate">RE ({getPercent(breakdown.realEstate).toFixed(0)}%)</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Alerts Indicator Widget */}
      <button
        onClick={onOpenAlerts}
        className="w-full flex items-center justify-between p-4 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm hover:shadow active:scale-98 transition-all text-left"
      >
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${alertCount > 0 ? 'bg-rose-50 dark:bg-rose-950/20 text-rose-500' : 'bg-slate-50 dark:bg-slate-900 text-slate-400'}`}>
            <AlertCircle size={20} className={alertCount > 0 ? 'animate-bounce' : ''} />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-700 dark:text-slate-200">Portfolio Alerts</h4>
            <p className="text-[10.5px] text-slate-400 dark:text-slate-500 mt-0.5">
              {alertCount > 0 ? `You have ${alertCount} active alerts requiring review` : 'All assets are healthy'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 text-slate-400">
          {alertCount > 0 && (
            <span className="bg-rose-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full mr-1">
              {alertCount}
            </span>
          )}
          <ChevronRight size={14} />
        </div>
      </button>

      {/* Quick Alert Strips */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between pl-1">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
              Critical Alerts
            </span>
            <button onClick={onOpenAlerts} className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
              View All ({alerts.length})
            </button>
          </div>
          <div className="space-y-2">
            {alerts.slice(0, 2).map((alert) => (
              <div
                key={alert.id}
                onClick={onOpenAlerts}
                className={`p-3 border rounded-2xl shadow-sm hover:shadow flex items-start gap-3 active:scale-98 transition-all cursor-pointer ${
                  alert.severity === 'critical'
                    ? 'bg-red-50/70 border-red-100 dark:bg-red-950/20 dark:border-red-900/30'
                    : alert.severity === 'warning'
                    ? 'bg-amber-50/70 border-amber-100 dark:bg-amber-950/20 dark:border-amber-900/30'
                    : 'bg-blue-50/70 border-blue-100 dark:bg-blue-950/20 dark:border-blue-900/30'
                }`}
              >
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                  alert.severity === 'critical'
                    ? 'bg-red-500/10 text-red-500'
                    : alert.severity === 'warning'
                    ? 'bg-amber-500/10 text-amber-500'
                    : 'bg-blue-500/10 text-blue-500'
                }`}>
                  <AlertCircle size={16} className={alert.severity === 'critical' ? 'animate-pulse' : ''} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 justify-between">
                    <h5 className={`text-xs font-bold truncate ${
                      alert.severity === 'critical'
                        ? 'text-red-800 dark:text-red-300'
                        : alert.severity === 'warning'
                        ? 'text-amber-800 dark:text-amber-300'
                        : 'text-blue-800 dark:text-blue-300'
                    }`}>
                      {alert.title}
                    </h5>
                    {alert.portfolioLabel && (
                      <span className="text-[8.5px] font-extrabold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-1.5 py-0.5 rounded-md uppercase tracking-wider shrink-0">
                        {alert.portfolioLabel}
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5 leading-tight">
                    {alert.message}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Asset Grid */}
      <div className="space-y-2.5">
        <h3 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest pl-1">
          Quick Asset Summary
        </h3>
        <div className="grid grid-cols-2 gap-3">
          {assetCards.map((card) => (
            <button
              key={card.id}
              onClick={() => onNavigateAsset(card.id)}
              className="relative overflow-hidden bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-4 text-left shadow-sm hover:shadow active:scale-98 transition-all flex flex-col justify-between h-28"
            >
              <div className="flex items-center justify-between w-full">
                <div className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex items-center justify-center">
                  {card.icon}
                </div>
                <ChevronRight size={13} className="text-slate-300 dark:text-slate-600" />
              </div>
              <div className="mt-2">
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 truncate uppercase tracking-wide">
                  {card.label}
                </p>
                <p className="text-[14px] font-extrabold text-slate-800 dark:text-slate-100 mt-0.5">
                  {card.value !== null ? formatINR(card.value) : 'Vault'}
                </p>
                <p className="text-[9.5px] text-slate-400 dark:text-slate-500 font-semibold mt-0.5 leading-none">
                  {card.subtext}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Tools & Calculators Section */}
      <div className="space-y-2.5 pt-2">
        <h3 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest pl-1">
          Tools &amp; Calculators
        </h3>
        <div className="grid grid-cols-1 gap-3">
          <button
            onClick={() => onNavigateAsset('what_if')}
            className="relative overflow-hidden bg-gradient-to-br from-indigo-50/40 to-blue-50/20 dark:from-indigo-950/10 dark:to-blue-950/5 border border-indigo-100/40 dark:border-indigo-900/20 rounded-2xl p-4 text-left shadow-sm hover:shadow active:scale-98 transition-all flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center animate-pulse">
                <Calculator size={20} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-700 dark:text-slate-200">What-If Investment Calculator</h4>
                <p className="text-[10.5px] text-slate-400 dark:text-slate-500 mt-0.5">
                  Project future portfolio growth with compound interest and returns
                </p>
              </div>
            </div>
            <ChevronRight size={14} className="text-slate-400" />
          </button>
        </div>
      </div>
    </div>
  );
}

// React.memo prevents re-renders when parent state (e.g. lastUpdated) changes
// but none of MobileHomeSummary's own props have changed
export default memo(MobileHomeSummary);
