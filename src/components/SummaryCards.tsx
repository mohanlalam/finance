import React from 'react';
import { IndianRupee, BarChart2, TrendingUp, TrendingDown, Activity } from './icons/AppIcons';
import { formatINR, formatPercent } from '../utils/formatters';
import { Portfolio } from '../types/portfolio';
import { estimateTodayPnL } from '../utils/portfolioCalcs';
import { Card } from './ui/Card';
import { NetWorthSnapshot } from '../hooks/usePortfolioData';
import { Sparkline } from './ui/Sparkline';
import { AnimatedNumber } from './ui/AnimatedNumber';
import { usePrivacy } from '../contexts/PrivacyContext';

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
  netWorthHistory?: NetWorthSnapshot[];
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
  netWorthHistory = [],
}: SummaryCardsProps) {
  const isGain = totalPnL >= 0;
  const isTodayGain = todayPnL !== undefined ? todayPnL >= 0 : true;

  const sparklineData = React.useMemo(() => {
    if (!netWorthHistory || netWorthHistory.length === 0) return [];
    return netWorthHistory.slice(-7).map((snap) => snap.total_value);
  }, [netWorthHistory]);

  const sparklineColor = React.useMemo(() => {
    if (sparklineData.length < 2) return '#10b981';
    return sparklineData[sparklineData.length - 1] >= sparklineData[0] ? '#10b981' : '#ef4444';
  }, [sparklineData]);

  const { isBalancesHidden } = usePrivacy();

  const renderValue = (val: number, formatter = formatINR) => {
    if (isBalancesHidden) return '••••••';
    return <AnimatedNumber value={val} formatter={formatter} />;
  };

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
        <div className="flex items-end justify-between">
          <div>
            <p className={`text-financial tnum transition-opacity ${isLoading ? 'opacity-40' : ''}`}>
              {renderValue(totalCurrentValue)}
            </p>
            <p className="text-supporting">
              {isLoading ? 'Syncing prices...' : 'Current valuation'}
            </p>
          </div>
          {sparklineData.length > 1 && (
            <div className="mb-1 ml-2 shrink-0">
              <Sparkline data={sparklineData} color={sparklineColor} />
            </div>
          )}
        </div>

        {activePortfolio === null && portfolios && portfolios.length > 0 && (
          <div className="mt-2.5 pt-2.5 border-t border-[var(--border-subtle)] flex flex-wrap gap-x-2.5 gap-y-1 text-[10px] font-medium text-[var(--text-secondary)]">
            {portfolios.map((p, idx) => {
              const val = p.totalCurrentValue;
              return (
                <span key={p.id} className="flex items-center gap-0.5">
                  <span>{p.label}:</span>
                  <span className="text-[var(--text-primary)] font-bold tnum">
                    {renderValue(val)}
                  </span>
                  {idx < portfolios.length - 1 && <span className="text-slate-300 dark:text-slate-700 ml-1.5">|</span>}
                </span>
              );
            })}
          </div>
        )}
      </Card>

      {/* Remaining Cards: Horizontal scroll on mobile, normal grid columns on desktop */}
      <div className="relative block lg:contents">
        <div className="absolute -left-4 top-0 bottom-2 w-8 bg-gradient-to-r from-slate-50 dark:from-slate-950 to-transparent pointer-events-none sm:hidden z-10" />
        <div className="absolute -right-4 top-0 bottom-2 w-12 bg-gradient-to-l from-slate-50 dark:from-slate-950 to-transparent pointer-events-none sm:hidden z-10" />
        <div className="flex gap-4 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-none lg:contents">
        
        {/* 2. Invested Card (Neutral) */}
        <Card padding="md" className="shrink-0 w-[240px] sm:w-auto sm:shrink flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <span className="text-label-small">Invested</span>
            <span className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-zinc-800 flex items-center justify-center">
              <BarChart2 size={13} className="text-[var(--text-secondary)]" />
            </span>
          </div>
          <p className="text-financial tnum">{renderValue(totalInvested)}</p>
          <p className="text-supporting">Total capital deployed</p>

          {activePortfolio === null && portfolios && portfolios.length > 0 && (
            <div className="mt-2.5 pt-2.5 border-t border-[var(--border-subtle)] flex flex-wrap gap-x-2.5 gap-y-1 text-[10px] font-medium text-[var(--text-secondary)]">
              {portfolios.map((p, idx) => {
                const val = p.totalInvested;
                return (
                  <span key={p.id} className="flex items-center gap-0.5">
                    <span>{p.label}:</span>
                    <span className="text-[var(--text-primary)] font-bold tnum">
                      {renderValue(val)}
                    </span>
                    {idx < portfolios.length - 1 && <span className="text-slate-300 dark:text-slate-700 ml-1.5">|</span>}
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
              isGain ? 'bg-[#34C759]/10' : 'bg-[#ff3b30]/10'
            }`}>
              {isGain ? <TrendingUp size={13} className="text-[#34C759]" /> : <TrendingDown size={13} className="text-[#ff3b30]" />}
            </span>
          </div>
          <p className={`text-financial tnum ${isGain ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'}`}>
            {isBalancesHidden ? '••••••' : <>{isGain ? '+' : ''}<AnimatedNumber value={totalPnL} formatter={formatINR} /></>}
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
                      {isBalancesHidden ? '••••••' : <>{localGain ? '+' : ''}<AnimatedNumber value={pnl} formatter={formatINR} /></>}
                    </span>
                    {idx < portfolios.length - 1 && <span className="text-slate-300 dark:text-slate-700 ml-1.5">|</span>}
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
                isTodayGain ? 'bg-[#34C759]/10' : 'bg-[#ff3b30]/10'
              }`}>
                {isTodayGain ? <TrendingUp size={13} className="text-[#34C759]" /> : <TrendingDown size={13} className="text-[#ff3b30]" />}
              </span>
            </div>
            <p className={`text-financial tnum ${isTodayGain ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'}`}>
              {isBalancesHidden ? '••••••' : <>{isTodayGain ? '+' : ''}<AnimatedNumber value={todayPnL} formatter={formatINR} /></>}
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
                      <span className={`font-bold tnum ${localTodayGain ? 'text-[#34C759]' : 'text-[#ff3b30]'}`}>
                        {isBalancesHidden ? '••••••' : <>{localTodayGain ? '+' : ''}<AnimatedNumber value={pnl} formatter={formatINR} /></>}
                      </span>
                      {idx < portfolios.length - 1 && <span className="text-slate-300 dark:text-slate-700 ml-1.5">|</span>}
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
    </div>
  );
}

export default React.memo(SummaryCards);
