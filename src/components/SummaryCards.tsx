import React from 'react';
import { TrendingUp, TrendingDown, IndianRupee, BarChart2, Activity } from 'lucide-react';
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

  return (
    <div
      role="region"
      aria-label="Portfolio summary"
      className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4"
    >
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm p-3 sm:p-5 flex flex-col gap-1.5 sm:gap-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] sm:text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{label} Net Worth</span>
          <span className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
            <IndianRupee size={14} className="text-blue-500 sm:hidden" />
            <IndianRupee size={16} className="text-blue-500 hidden sm:block" />
          </span>
        </div>
        <p className={`text-lg sm:text-2xl font-bold text-slate-800 dark:text-slate-100 transition-opacity ${isLoading ? 'opacity-40' : ''}`}>{formatINR(totalCurrentValue)}</p>
        <p className="text-[10px] sm:text-xs text-slate-400 dark:text-slate-500 hidden sm:block">{isLoading ? 'Fetching live prices...' : 'Based on latest prices'}</p>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm p-3 sm:p-5 flex flex-col gap-1.5 sm:gap-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] sm:text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Invested</span>
          <span className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
            <BarChart2 size={14} className="text-slate-500 dark:text-slate-400 sm:hidden" />
            <BarChart2 size={16} className="text-slate-500 dark:text-slate-400 hidden sm:block" />
          </span>
        </div>
        <p className="text-lg sm:text-2xl font-bold text-slate-800 dark:text-slate-100">{formatINR(totalInvested)}</p>
        <p className="text-[10px] sm:text-xs text-slate-400 dark:text-slate-500 hidden sm:block">Cost basis across all holdings</p>
      </div>

      <div className={`rounded-2xl border shadow-sm p-3 sm:p-5 flex flex-col gap-1.5 sm:gap-2 ${
        isGain
          ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-800'
          : 'bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-800'
      }`}>
        <div className="flex items-center justify-between">
          <span className={`text-[10px] sm:text-xs font-semibold uppercase tracking-widest ${isGain ? 'text-emerald-500' : 'text-red-400'}`}>P&amp;L</span>
          <span className={`w-6 h-6 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl flex items-center justify-center ${
            isGain
              ? 'bg-emerald-100 dark:bg-emerald-900/30'
              : 'bg-red-100 dark:bg-red-900/30'
          }`}>
            {isGain ? <TrendingUp size={14} className="text-emerald-600 dark:text-emerald-400" /> : <TrendingDown size={14} className="text-red-500 dark:text-red-400" />}
          </span>
        </div>
        <p className={`text-lg sm:text-2xl font-bold ${isGain ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>{formatINR(totalPnL)}</p>
        <p className={`text-[10px] sm:text-xs font-semibold ${pnlColor(totalPnL)}`}>{formatPercent(totalPnLPercent)} return</p>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm p-3 sm:p-5 flex flex-col gap-1.5 sm:gap-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] sm:text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Today</span>
          <span className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center">
            <Activity size={14} className="text-amber-500" />
          </span>
        </div>
        {todayPnL !== undefined ? (
          <>
            <p className={`text-lg sm:text-2xl font-bold ${pnlColor(todayPnL)}`}>{formatINR(todayPnL)}</p>
            <p className={`text-[10px] sm:text-xs font-semibold ${pnlColor(todayPnL)}`}>Daily P&amp;L</p>
          </>
        ) : (
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">No live data</p>
        )}
      </div>
    </div>
  );
}

export default React.memo(SummaryCards);
