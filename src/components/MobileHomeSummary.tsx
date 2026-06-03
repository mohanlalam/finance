import { TrendingUp, TrendingDown, Landmark, Coins, Building2, Shield, FolderOpen, AlertCircle, RefreshCw, ChevronRight } from 'lucide-react';
import { formatINR, formatPercent } from '../utils/formatters';
import { Portfolio } from '../types/portfolio';

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
    gold: number;
    realEstate: number;
    insuranceCover: number;
    insurancePremium: number;
  };
  alertCount: number;
  lastUpdated: Date | null;
  priceStatus: string;
  onRefresh: () => void;
  isLoadingPrices: boolean;
  onNavigateAsset: (asset: 'stocks' | 'fd' | 'gold' | 'real_estate' | 'insurance' | 'documents') => void;
  onOpenAlerts: () => void;
  portfolios: Portfolio[];
  activePortfolio: Portfolio | null;
}

export default function MobileHomeSummary({
  summaryData,
  todayPnL,
  todayPnLPercent,
  breakdown,
  alertCount,
  lastUpdated,
  priceStatus,
  onRefresh,
  isLoadingPrices,
  onNavigateAsset,
  onOpenAlerts,
  portfolios,
  activePortfolio,
}: MobileHomeSummaryProps) {
  // Count items
  const currentPortfolios = activePortfolio ? [activePortfolio] : portfolios;
  const stockCount = currentPortfolios.reduce((s, p) => s + p.holdings.length, 0);
  const fdCount = currentPortfolios.reduce((s, p) => s + p.fixedDeposits.length, 0);
  const goldCount = currentPortfolios.reduce((s, p) => s + p.goldHoldings.length, 0);
  const propertyCount = currentPortfolios.reduce((s, p) => s + p.realEstate.length, 0);
  const insuranceCount = currentPortfolios.reduce((s, p) => s + p.insurances.length, 0);
  const docCount = currentPortfolios.reduce((s, p) => s + p.documents.length, 0);

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

        <h2 className="text-4xl font-extrabold tracking-tight mt-3 bg-gradient-to-r from-white via-slate-100 to-slate-350 bg-clip-text text-transparent relative z-10">
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
      <div className="flex items-center justify-between px-3.5 py-2.5 bg-white/70 dark:bg-slate-800/70 border border-slate-200/50 dark:border-slate-750/30 rounded-2xl text-[11px] text-slate-500 dark:text-slate-450 backdrop-blur shadow-sm">
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

      {/* Alerts Indicator Widget */}
      <button
        onClick={onOpenAlerts}
        className="w-full flex items-center justify-between p-4 bg-white dark:bg-slate-850 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm hover:shadow active:scale-98 transition-all text-left"
      >
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${alertCount > 0 ? 'bg-rose-50 dark:bg-rose-950/20 text-rose-500' : 'bg-slate-50 dark:bg-slate-900 text-slate-400'}`}>
            <AlertCircle size={20} className={alertCount > 0 ? 'animate-bounce' : ''} />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-700 dark:text-slate-200">Portfolio Alerts</h4>
            <p className="text-[10.5px] text-slate-450 dark:text-slate-500 mt-0.5">
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
              className={`bg-gradient-to-br ${card.bg} border rounded-2xl p-4 text-left shadow-sm hover:shadow hover:scale-[1.02] active:scale-98 transition-all flex flex-col justify-between h-28`}
            >
              <div className="flex items-center justify-between w-full">
                <div className="w-8 h-8 rounded-lg bg-white dark:bg-slate-800 shadow-xs flex items-center justify-center">
                  {card.icon}
                </div>
                <ChevronRight size={13} className="text-slate-350 dark:text-slate-650" />
              </div>
              <div>
                <p className="text-[10.5px] font-bold text-slate-450 dark:text-slate-400 truncate uppercase tracking-wide">
                  {card.label}
                </p>
                <p className="text-[14px] font-extrabold text-slate-850 dark:text-slate-100 mt-0.5">
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
    </div>
  );
}
