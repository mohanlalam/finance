import React from 'react';
import { IndianRupee, BarChart2, TrendingUp, TrendingDown, Activity } from './icons/AppIcons';
import { formatINR, formatPercent } from '../utils/formatters';
import { Portfolio } from '../types/portfolio';
import { estimateTodayPnL } from '../utils/portfolioCalcs';
import { Card } from './ui/Card';

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
    <div className="flex flex-col lg:grid lg:grid-cols-4 gap-4">
      
      {/* 1. Net Worth Card (Neutral featured card) */}
      <Card padding="md" className="relative overflow-hidden flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <span className="text-label-small">{label} Net Worth</span>
          <span className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-zinc-800 flex items-center justify-center">
            <IndianRupee size={13} className="text-[var(--text-secondary)]" />
          </span>
        </div>
        <p className={`text-financial tnum transition-opacity ${isLoading ? 'opacity-40' : ''}`}>
          {formatINR(totalCurrentValue)}
        </p>
        <p className="text-supporting">
          {isLoading ? 'Syncing prices...' : 'Current valuation'}
        </p>

        {activePortfolio === null && portfolios && portfolios.length > 0 && (
          <div className="mt-2.5 pt-2.5 border-t border-[var(--border-subtle)] flex flex-wrap gap-x-2.5 gap-y-1 text-[10px] font-medium text-[var(--text-secondary)]">
            {portfolios.map((p, idx) => {
              const val = p.totalCurrentValue;
              return (
                <span key={p.id} className="flex items-center gap-0.5">
                  <span>{p.label}:</span>
                  <span className="text-[var(--text-primary)] font-bold tnum">
                    {formatINR(val)}
                  </span>
                  {idx < portfolios.length - 1 && <span className="text-slate-300 dark:text-zinc-700 ml-1.5">|</span>}
                </span>
              );
            })}
          </div>
        )}
      </Card>

      {/* Remaining Cards: Horizontal scroll on mobile, normal grid columns on desktop */}
      <div className="flex gap-4 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-none lg:contents">
        
        {/* 2. Invested Card (Neutral) */}
        <Card padding="md" className="shrink-0 w-[240px] sm:w-auto sm:shrink flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <span className="text-label-small">Invested</span>
            <span className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-zinc-800 flex items-center justify-center">
              <BarChart2 size={13} className="text-[var(--text-secondary)]" />
            </span>
          </div>
          <p className="text-financial tnum">{formatINR(totalInvested)}</p>
          <p className="text-supporting">Total capital deployed</p>

          {activePortfolio === null && portfolios && portfolios.length > 0 && (
            <div className="mt-2.5 pt-2.5 border-t border-[var(--border-subtle)] flex flex-wrap gap-x-2.5 gap-y-1 text-[10px] font-medium text-[var(--text-secondary)]">
              {portfolios.map((p, idx) => {
                const val = p.totalInvested;
                return (
                  <span key={p.id} className="flex items-center gap-0.5">
                    <span>{p.label}:</span>
                    <span className="text-[var(--text-primary)] font-bold tnum">
                      {formatINR(val)}
                    </span>
                    {idx < portfolios.length - 1 && <span className="text-slate-300 dark:text-zinc-700 ml-1.5">|</span>}
                  </span>
                );
              })}
            </div>
          )}
        </Card>

        {/* 3. Total P&L Card (Soft colored feedback) */}
        <Card padding="md" className="shrink-0 w-[240px] sm:w-auto sm:shrink flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <span className="text-label-small">Total Return</span>
            <span className={`w-6 h-6 rounded-lg flex items-center justify-center ${
              isGain ? 'bg-[#16a765]/10' : 'bg-[#ff3b30]/10'
            }`}>
              {isGain ? <TrendingUp size={13} className="text-[#16a765]" /> : <TrendingDown size={13} className="text-[#ff3b30]" />}
            </span>
          </div>
          <p className={`text-financial tnum ${isGain ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'}`}>
            {isGain ? '+' : ''}{formatINR(totalPnL)}
          </p>
          <p className="text-supporting">
            {formatPercent(totalPnLPercent)} gain
          </p>

          {activePortfolio === null && portfolios && portfolios.length > 0 && (
            <div className="mt-2.5 pt-2.5 border-t border-[var(--border-subtle)] flex flex-wrap gap-x-2.5 gap-y-1 text-[10px] font-medium text-[var(--text-secondary)]">
              {portfolios.map((p, idx) => {
                const pnl = p.totalPnL;
                const localGain = pnl >= 0;
                return (
                  <span key={p.id} className="flex items-center gap-0.5">
                    <span>{p.label}:</span>
                    <span className={`font-bold tnum ${localGain ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'}`}>
                      {localGain ? '+' : ''}{formatINR(pnl)}
                    </span>
                    {idx < portfolios.length - 1 && <span className="text-slate-300 dark:text-zinc-700 ml-1.5">|</span>}
                  </span>
                );
              })}
            </div>
          )}
        </Card>

        {/* 4. Today's P&L Card (Soft colored daily changes) */}
        {todayPnL !== undefined ? (
          <Card padding="md" className="shrink-0 w-[240px] sm:w-auto sm:shrink flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="text-label-small">Today's Return</span>
              <span className={`w-6 h-6 rounded-lg flex items-center justify-center ${
                isTodayGain ? 'bg-[#16a765]/10' : 'bg-[#ff3b30]/10'
              }`}>
                {isTodayGain ? <TrendingUp size={13} className="text-[#16a765]" /> : <TrendingDown size={13} className="text-[#ff3b30]" />}
              </span>
            </div>
            <p className={`text-financial tnum ${isTodayGain ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'}`}>
              {isTodayGain ? '+' : ''}{formatINR(todayPnL)}
            </p>
            <p className="text-supporting">
              Intraday delta
            </p>

            {activePortfolio === null && portfolios && portfolios.length > 0 && (
              <div className="mt-2.5 pt-2.5 border-t border-[var(--border-subtle)] flex flex-wrap gap-x-2.5 gap-y-1 text-[10px] font-medium text-[var(--text-secondary)]">
                {portfolios.map((p, idx) => {
                  const pnl = estimateTodayPnL(p, [p]);
                  const localTodayGain = pnl >= 0;
                  return (
                    <span key={p.id} className="flex items-center gap-0.5">
                      <span>{p.label}:</span>
                      <span className={`font-bold tnum ${localTodayGain ? 'text-[#16a765]' : 'text-[#ff3b30]'}`}>
                        {localTodayGain ? '+' : ''}{formatINR(pnl)}
                      </span>
                      {idx < portfolios.length - 1 && <span className="text-slate-300 dark:text-zinc-700 ml-1.5">|</span>}
                    </span>
                  );
                })}
              </div>
            )}
          </Card>
        ) : (
          <Card padding="md" className="shrink-0 w-[240px] sm:w-auto sm:shrink flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="text-label-small">Today</span>
              <span className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-zinc-800 flex items-center justify-center">
                <Activity size={13} className="text-[var(--text-secondary)]" />
              </span>
            </div>
            <p className="text-financial tnum opacity-40">--</p>
            <p className="text-supporting">Delta unavailable</p>
          </Card>
        )}

      </div>
    </div>
  );
}

export default React.memo(SummaryCards);
