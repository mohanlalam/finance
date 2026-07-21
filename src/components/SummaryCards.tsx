import React from 'react';
import { TrendingUp, TrendingDown, IndianRupee, BarChart2, Activity } from './icons/AppIcons';
import { formatINR, formatPercent, pnlColor } from '../utils/formatters';
import { Portfolio } from '../types/portfolio';
import { estimateTodayPnL } from '../utils/portfolioCalcs';

interface SummaryCardsProps {
  totalInvested: number;
  totalCurrentValue: number;
  totalPnL: number;
  totalPnLPercent: number;
  todayPnL?: number;
  label?: string;
  isLoading?: boolean;
  portfolios?: Portfolio[];
  activePortfolio?: Portfolio | null;
}

function SummaryCards({
  totalInvested,
  totalCurrentValue,
  totalPnL,
  totalPnLPercent,
  todayPnL,
  label = 'Family',
  isLoading = false,
  portfolios = [],
  activePortfolio = null,
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
      <div className="relative overflow-hidden bg-gradient-to-br from-[#080d1a] via-[#0e1628] to-[#0a1535] text-white rounded-2xl border border-white/[0.08] shadow-lg p-3 sm:p-5 flex flex-col gap-1.5 sm:gap-2 premium-card glow-indigo">
        {/* Floating orb decorations */}
        <div className="absolute top-0 right-0 w-28 h-28 bg-blue-500/15 rounded-full blur-2xl pointer-events-none animate-float-pulse" />
        <div className="absolute bottom-0 left-0 w-20 h-20 bg-indigo-500/12 rounded-full blur-xl pointer-events-none" />
        {/* Mesh grid overlay */}
        <div className="absolute inset-0 mesh-grid opacity-40 pointer-events-none rounded-2xl" />
        {/* Accent line at top */}
        <div className="absolute top-0 left-4 right-4 h-[1px] bg-gradient-to-r from-transparent via-blue-400/40 to-transparent" />
        
        <div className="flex items-center justify-between relative z-10">
          <span className="text-[10px] sm:text-xs font-semibold text-slate-400 uppercase tracking-widest">{label} Net Worth</span>
          <span className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-gradient-to-br from-blue-500/30 to-indigo-500/20 border border-white/10 flex items-center justify-center">
            <IndianRupee size={15} className="text-blue-400" />
          </span>
        </div>
        <p className={`text-lg sm:text-2xl font-black bg-gradient-to-r from-white via-blue-50 to-slate-200 bg-clip-text text-transparent tnum transition-opacity relative z-10 ${isLoading ? 'opacity-40' : ''}`}>
          {formatINR(totalCurrentValue)}
        </p>
        <p className="text-[10px] sm:text-xs text-slate-500 relative z-10">
          {isLoading ? 'Fetching live prices...' : 'Based on latest prices'}
        </p>
        {activePortfolio === null && portfolios && portfolios.length > 0 && (
          <div className="mt-1.5 pt-1.5 border-t border-white/[0.06] flex flex-wrap gap-x-2 gap-y-1 text-[10px] font-medium text-slate-400 relative z-10">
            {portfolios.map((p, idx) => {
              const val = p.totalCurrentValue;
              return (
                <span key={p.id} className="flex items-center gap-0.5">
                  <span>{p.label}:</span>
                  <span className="text-slate-200 font-bold tnum">
                    {formatINR(val)}
                  </span>
                  {idx < portfolios.length - 1 && <span className="text-slate-700 ml-1.5">|</span>}
                </span>
              );
            })}
          </div>
        )}
      </div>

      {/* 2. Invested Card (Clean Glass with gradient border) */}
      <div className="gradient-border-card premium-card rounded-2xl shadow-sm p-3 sm:p-5 flex flex-col gap-1.5 sm:gap-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Invested</span>
          <span className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-slate-100/80 dark:bg-white/[0.06] border border-slate-200/60 dark:border-white/[0.04] flex items-center justify-center">
            <BarChart2 size={14} className="text-slate-500 dark:text-slate-400 sm:hidden" />
            <BarChart2 size={16} className="text-slate-500 dark:text-slate-400 hidden sm:block" />
          </span>
        </div>
        <p className="text-lg sm:text-2xl font-extrabold text-slate-800 dark:text-slate-100 tnum">{formatINR(totalInvested)}</p>
        <p className="text-[10px] sm:text-xs text-slate-400 dark:text-slate-500 hidden sm:block">Cost basis across all holdings</p>
        {activePortfolio === null && portfolios && portfolios.length > 0 && (
          <div className="mt-1.5 pt-1.5 border-t border-slate-200/50 dark:border-white/[0.05] flex flex-wrap gap-x-2 gap-y-1 text-[10px] font-medium text-slate-500 dark:text-slate-400">
            {portfolios.map((p, idx) => {
              const val = p.totalInvested;
              return (
                <span key={p.id} className="flex items-center gap-0.5">
                  <span>{p.label}:</span>
                  <span className="text-slate-700 dark:text-slate-300 font-bold tnum">
                    {formatINR(val)}
                  </span>
                  {idx < portfolios.length - 1 && <span className="text-slate-300 dark:text-slate-700 ml-1.5">|</span>}
                </span>
              );
            })}
          </div>
        )}
      </div>

      {/* 3. Total P&L Card (Left accent strip) */}
      <div className={`relative overflow-hidden rounded-2xl border shadow-sm p-3 sm:p-5 flex flex-col gap-1.5 sm:gap-2 premium-card ${
        isGain
          ? 'bg-emerald-500/[0.04] dark:bg-emerald-500/[0.04] border-emerald-500/20 dark:border-emerald-500/12 glow-emerald'
          : 'bg-red-500/[0.04] dark:bg-red-500/[0.04] border-red-500/20 dark:border-red-500/12'
      }`}>
        {/* Left accent strip */}
        <div className={`absolute left-0 top-3 bottom-3 w-[3px] rounded-full ${isGain ? 'bg-gradient-to-b from-emerald-400 to-emerald-600' : 'bg-gradient-to-b from-red-400 to-red-600'}`} />
        <div className="flex items-center justify-between">
          <span className={`text-[10px] sm:text-xs font-semibold uppercase tracking-widest ${isGain ? 'text-emerald-500 dark:text-emerald-400' : 'text-red-400'}`}>Total P&amp;L</span>
          <span className={`w-6 h-6 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl flex items-center justify-center ${
            isGain
              ? 'bg-emerald-100/60 dark:bg-emerald-900/25'
              : 'bg-red-100/60 dark:bg-red-900/25'
          }`}>
            {isGain ? <TrendingUp size={14} className="text-emerald-600 dark:text-emerald-400" /> : <TrendingDown size={14} className="text-red-500 dark:text-red-400" />}
          </span>
        </div>
        <p className={`text-lg sm:text-2xl font-extrabold tnum ${isGain ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
          {isGain ? '+' : ''}{formatINR(totalPnL)}
        </p>
        <p className={`text-[10px] sm:text-xs font-bold tnum ${pnlColor(totalPnL)}`}>
          {formatPercent(totalPnLPercent)} total return
        </p>
        {activePortfolio === null && portfolios && portfolios.length > 0 && (
          <div className="mt-1.5 pt-1.5 border-t border-slate-200/50 dark:border-white/[0.05] flex flex-wrap gap-x-2 gap-y-1 text-[10px] font-medium text-slate-500 dark:text-slate-400">
            {portfolios.map((p, idx) => {
              const pnl = p.totalPnL;
              return (
                <span key={p.id} className="flex items-center gap-0.5">
                  <span>{p.label}:</span>
                  <span className={pnl >= 0 ? 'text-emerald-600 dark:text-emerald-400 font-bold tnum' : 'text-red-500 dark:text-red-400 font-bold tnum'}>
                    {pnl >= 0 ? '+' : ''}{formatINR(pnl)}
                  </span>
                  {idx < portfolios.length - 1 && <span className="text-slate-300 dark:text-slate-700 ml-1.5">|</span>}
                </span>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. Today's P&L Card */}
      {todayPnL !== undefined ? (
        <div className={`relative overflow-hidden rounded-2xl border shadow-sm p-3 sm:p-5 flex flex-col gap-1.5 sm:gap-2 premium-card ${
          isTodayGain
            ? 'bg-emerald-500/[0.04] dark:bg-emerald-500/[0.04] border-emerald-500/20 dark:border-emerald-500/12 glow-emerald'
            : 'bg-red-500/[0.04] dark:bg-red-500/[0.04] border-red-500/20 dark:border-red-500/12'
        }`}>
          {/* Left accent strip */}
          <div className={`absolute left-0 top-3 bottom-3 w-[3px] rounded-full ${isTodayGain ? 'bg-gradient-to-b from-emerald-400 to-emerald-600' : 'bg-gradient-to-b from-red-400 to-red-600'}`} />
          <div className="flex items-center justify-between">
            <span className={`text-[10px] sm:text-xs font-semibold uppercase tracking-widest ${isTodayGain ? 'text-emerald-500 dark:text-emerald-400' : 'text-red-400'}`}>Today's P&amp;L</span>
            <span className={`w-6 h-6 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl flex items-center justify-center ${
              isTodayGain
                ? 'bg-emerald-100/60 dark:bg-emerald-900/25'
                : 'bg-red-100/60 dark:bg-red-900/25'
            }`}>
              {isTodayGain ? <TrendingUp size={14} className="text-emerald-600 dark:text-emerald-400" /> : <TrendingDown size={14} className="text-red-500 dark:text-red-400" />}
            </span>
          </div>
          <p className={`text-lg sm:text-2xl font-extrabold tnum ${isTodayGain ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-650 dark:text-red-400'}`}>
            {isTodayGain ? '+' : ''}{formatINR(todayPnL)}
          </p>
          <p className={`text-[10px] sm:text-xs font-bold tnum ${pnlColor(todayPnL)}`}>
            Daily change
          </p>
          {activePortfolio === null && portfolios && portfolios.length > 0 && (
            <div className="mt-1.5 pt-1.5 border-t border-slate-200/50 dark:border-white/[0.05] flex flex-wrap gap-x-2 gap-y-1 text-[10px] font-medium text-slate-500 dark:text-slate-400">
              {portfolios.map((p, idx) => {
                const pnl = estimateTodayPnL(p, [p]);
                return (
                  <span key={p.id} className="flex items-center gap-0.5">
                    <span>{p.label}:</span>
                    <span className={pnl >= 0 ? 'text-emerald-600 dark:text-emerald-400 font-bold tnum' : 'text-red-500 dark:text-red-400 font-bold tnum'}>
                      {pnl >= 0 ? '+' : ''}{formatINR(pnl)}
                    </span>
                    {idx < portfolios.length - 1 && <span className="text-slate-300 dark:text-slate-700 ml-1.5">|</span>}
                  </span>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        <div className="glass-panel premium-card rounded-2xl shadow-sm p-3 sm:p-5 flex flex-col gap-1.5 sm:gap-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Today</span>
            <span className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
              <Activity size={14} className="text-slate-400" />
            </span>
          </div>
          <p className="text-base font-semibold text-slate-400 dark:text-slate-500 mt-1.5">No live data</p>
          <p className="text-[10px] text-slate-400 dark:text-slate-500">Intraday quotes unavailable</p>
        </div>
      )}
    </div>
  );
}

export default React.memo(SummaryCards);
