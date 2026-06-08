import React from 'react';
import { TrendingUp, TrendingDown, IndianRupee, BarChart2, Activity } from './icons/AppIcons';
import { formatINR, formatPercent, pnlColor } from '../utils/formatters';

interface SummaryCardsProps {
  totalInvested: number;
  totalCurrentValue: number;
  totalPnL: number;
  totalPnLPercent: number;
  todayPnL?: number;
  label?: string;
  isLoading?: boolean;
}

function SummaryCards({
  totalInvested,
  totalCurrentValue,
  totalPnL,
  totalPnLPercent,
  todayPnL,
  label = 'Family',
  isLoading = false,
}: SummaryCardsProps) {
  const isGain = totalPnL >= 0;
  const isTodayGain = todayPnL !== undefined ? todayPnL >= 0 : true;

  return (
    <div
      role="region"
      aria-label="Portfolio summary"
      className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4"
    >
      {/* 1. Net Worth Card (Premium Dark Gradient) */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl border border-slate-800 dark:border-slate-800/80 shadow-md p-3 sm:p-5 flex flex-col gap-1.5 sm:gap-2 premium-card glow-indigo">
        <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-20 h-20 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
        
        <div className="flex items-center justify-between relative z-10">
          <span className="text-[10px] sm:text-xs font-semibold text-slate-400 uppercase tracking-widest">{label} Net Worth</span>
          <span className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-white/10 border border-white/5 flex items-center justify-center">
            <IndianRupee size={15} className="text-blue-400" />
          </span>
        </div>
        <p className={`text-lg sm:text-2xl font-black bg-gradient-to-r from-white to-slate-200 bg-clip-text text-transparent transition-opacity relative z-10 ${isLoading ? 'opacity-40' : ''}`}>
          {formatINR(totalCurrentValue)}
        </p>
        <p className="text-[10px] sm:text-xs text-slate-500 relative z-10">
          {isLoading ? 'Fetching live prices...' : 'Based on latest prices'}
        </p>
      </div>

      {/* 2. Invested Card (Clean Slate Glass) */}
      <div className="glass-panel premium-card rounded-2xl shadow-sm p-3 sm:p-5 flex flex-col gap-1.5 sm:gap-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] sm:text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Invested</span>
          <span className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-slate-100 dark:bg-slate-750 flex items-center justify-center">
            <BarChart2 size={14} className="text-slate-500 dark:text-slate-400 sm:hidden" />
            <BarChart2 size={16} className="text-slate-500 dark:text-slate-400 hidden sm:block" />
          </span>
        </div>
        <p className="text-lg sm:text-2xl font-extrabold text-slate-800 dark:text-slate-100">{formatINR(totalInvested)}</p>
        <p className="text-[10px] sm:text-xs text-slate-400 dark:text-slate-500 hidden sm:block">Cost basis across all holdings</p>
      </div>

      {/* 3. Total P&L Card (Color-coded Border & Soft BG) */}
      <div className={`rounded-2xl border shadow-sm p-3 sm:p-5 flex flex-col gap-1.5 sm:gap-2 premium-card ${
        isGain
          ? 'bg-emerald-500/[0.04] dark:bg-emerald-500/[0.03] border-emerald-500/25 dark:border-emerald-500/15 glow-emerald'
          : 'bg-red-500/[0.04] dark:bg-red-500/[0.03] border-red-500/25 dark:border-red-500/15'
      }`}>
        <div className="flex items-center justify-between">
          <span className={`text-[10px] sm:text-xs font-semibold uppercase tracking-widest ${isGain ? 'text-emerald-500' : 'text-red-400'}`}>Total P&amp;L</span>
          <span className={`w-6 h-6 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl flex items-center justify-center ${
            isGain
              ? 'bg-emerald-100/50 dark:bg-emerald-900/30'
              : 'bg-red-100/50 dark:bg-red-900/30'
          }`}>
            {isGain ? <TrendingUp size={14} className="text-emerald-600 dark:text-emerald-400" /> : <TrendingDown size={14} className="text-red-500 dark:text-red-400" />}
          </span>
        </div>
        <p className={`text-lg sm:text-2xl font-extrabold ${isGain ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
          {isGain ? '+' : ''}{formatINR(totalPnL)}
        </p>
        <p className={`text-[10px] sm:text-xs font-bold ${pnlColor(totalPnL)}`}>
          {formatPercent(totalPnLPercent)} return (annualized)
        </p>
      </div>

      {/* 4. Today's P&L Card (Color-coded daily returns) */}
      {todayPnL !== undefined ? (
        <div className={`rounded-2xl border shadow-sm p-3 sm:p-5 flex flex-col gap-1.5 sm:gap-2 premium-card ${
          isTodayGain
            ? 'bg-emerald-500/[0.04] dark:bg-emerald-500/[0.03] border-emerald-500/25 dark:border-emerald-500/15 glow-emerald'
            : 'bg-red-500/[0.04] dark:bg-red-500/[0.03] border-red-500/25 dark:border-red-500/15'
        }`}>
          <div className="flex items-center justify-between">
            <span className={`text-[10px] sm:text-xs font-semibold uppercase tracking-widest ${isTodayGain ? 'text-emerald-500' : 'text-red-400'}`}>Today's P&amp;L</span>
            <span className={`w-6 h-6 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl flex items-center justify-center ${
              isTodayGain
                ? 'bg-emerald-100/50 dark:bg-emerald-900/30'
                : 'bg-red-100/50 dark:bg-red-900/30'
            }`}>
              {isTodayGain ? <TrendingUp size={14} className="text-emerald-600 dark:text-emerald-400" /> : <TrendingDown size={14} className="text-red-500 dark:text-red-400" />}
            </span>
          </div>
          <p className={`text-lg sm:text-2xl font-extrabold ${isTodayGain ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-650 dark:text-red-400'}`}>
            {isTodayGain ? '+' : ''}{formatINR(todayPnL)}
          </p>
          <p className={`text-[10px] sm:text-xs font-bold ${pnlColor(todayPnL)}`}>
            Daily change
          </p>
        </div>
      ) : (
        <div className="glass-panel premium-card rounded-2xl shadow-sm p-3 sm:p-5 flex flex-col gap-1.5 sm:gap-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Today</span>
            <span className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
              <Activity size={14} className="text-slate-400" />
            </span>
          </div>
          <p className="text-base font-semibold text-slate-450 dark:text-slate-500 mt-1.5">No live data</p>
          <p className="text-[10px] text-slate-400 dark:text-slate-500">Intraday quotes unavailable</p>
        </div>
      )}
    </div>
  );
}

export default React.memo(SummaryCards);
