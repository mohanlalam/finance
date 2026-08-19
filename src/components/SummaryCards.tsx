import React from 'react';
import { IndianRupee, BarChart2, TrendingUp, TrendingDown, Activity, Share2 } from './icons/AppIcons';
import { formatINR, formatPercent } from '../utils/formatters';
import { Portfolio } from '../types/portfolio';
import { estimateTodayPnL } from '../utils/portfolioCalcs';
import { NetWorthSnapshot } from '../hooks/usePortfolioData';
import { Sparkline } from './ui/Sparkline';
import { AnimatedNumber } from './ui/AnimatedNumber';
import { usePrivacy } from '../contexts/PrivacyContext';
import { sharePortfolioSummary } from '../utils/shareUtils';
import { useToastActions } from '../contexts/ToastContext';

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

const EMPTY_PORTFOLIOS: Portfolio[] = [];
const EMPTY_HISTORY: NetWorthSnapshot[] = [];

function SummaryCards({
  totalInvested,
  totalCurrentValue,
  totalPnL,
  totalPnLPercent,
  todayPnL,
  label = 'Family',
  isLoading = false,
  portfolios = EMPTY_PORTFOLIOS,
  activePortfolio = null,
  netWorthHistory = EMPTY_HISTORY,
}: SummaryCardsProps) {
  const isGain = totalPnL >= 0;
  const isTodayGain = todayPnL !== undefined ? todayPnL >= 0 : true;

  const memberBreakdowns = React.useMemo(() => {
    if (!portfolios || portfolios.length === 0) return [];
    return portfolios.map((p) => ({
      id: p.id,
      label: p.label,
      todayPnL: estimateTodayPnL(p, [p]),
    }));
  }, [portfolios]);

  const sparklineData = React.useMemo(() => {
    if (!netWorthHistory || netWorthHistory.length === 0) return [];
    return netWorthHistory.slice(-7).map((snap) => snap.total_value);
  }, [netWorthHistory]);

  const sparklineColor = React.useMemo(() => {
    if (sparklineData.length < 2) return '#00b074';
    return sparklineData[sparklineData.length - 1] >= sparklineData[0] ? '#00b074' : '#df514c';
  }, [sparklineData]);

  const { isBalancesHidden } = usePrivacy();
  const { addToast } = useToastActions();

  const renderValue = (val: number, formatter = formatINR) => {
    if (isBalancesHidden) return <span aria-label="Amount hidden">••••••</span>;
    return <AnimatedNumber value={val} formatter={formatter} />;
  };

  return (
    <div className="w-full bg-[var(--surface)] border border-[var(--border-subtle)] rounded-[var(--radius-large)] shadow-[var(--shadow-card)] p-5 sm:p-6 transition-all duration-200">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-0 lg:divide-x divide-[var(--border-subtle)]">
        
        {/* 1. Net Worth */}
        <div className="flex flex-col justify-between gap-1 lg:pr-6">
          <div className="flex items-center justify-between">
            <span className="text-label-small text-[var(--text-secondary)] font-semibold">{label} Net Worth</span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => sharePortfolioSummary({ name: label, totalValue: totalCurrentValue, totalPnL, totalPnLPercent }, addToast)}
                className="w-6 h-6 rounded-[var(--radius-small)] bg-[var(--accent-blue-soft)] text-[var(--accent-blue)] flex items-center justify-center hover:opacity-80 transition-opacity ios-press"
                title="Share Summary"
                aria-label="Share Portfolio Summary"
              >
                <Share2 size={13} />
              </button>
              <span className="w-6 h-6 rounded-[var(--radius-small)] bg-[var(--surface-secondary)] flex items-center justify-center">
                <IndianRupee size={13} className="text-[var(--text-secondary)]" />
              </span>
            </div>
          </div>

          <div className="flex items-end justify-between mt-1">
            <div>
              <p className={`text-2xl sm:text-3xl font-extrabold text-[var(--text-primary)] text-financial tnum tracking-tight transition-opacity ${isLoading ? 'opacity-40' : ''}`}>
                {renderValue(totalCurrentValue)}
              </p>
              <p className="text-supporting text-[11px] text-[var(--text-tertiary)] mt-0.5">
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
            <div className="mt-3 pt-3 border-t border-[var(--border-subtle)] flex flex-wrap gap-x-2 gap-y-1 text-label-micro font-medium text-[var(--text-secondary)]">
              {portfolios.map((p, idx) => {
                const val = p.totalCurrentValue;
                return (
                  <span key={p.id} className="flex items-center gap-1">
                    <span>{p.label}:</span>
                    <span className="text-[var(--text-primary)] font-bold tnum">
                      {renderValue(val)}
                    </span>
                    {idx < portfolios.length - 1 && <span className="text-[var(--border-subtle)] ml-1">|</span>}
                  </span>
                );
              })}
            </div>
          )}
        </div>

        {/* 2. Invested */}
        <div className="flex flex-col justify-between gap-1 lg:px-6">
          <div className="flex items-center justify-between">
            <span className="text-label-small text-[var(--text-secondary)] font-semibold">Invested</span>
            <span className="w-6 h-6 rounded-[var(--radius-small)] bg-[var(--surface-secondary)] flex items-center justify-center">
              <BarChart2 size={13} className="text-[var(--text-secondary)]" />
            </span>
          </div>

          <div className="mt-1">
            <p className="text-2xl sm:text-3xl font-extrabold text-[var(--text-primary)] text-financial tnum tracking-tight">
              {renderValue(totalInvested)}
            </p>
            <p className="text-supporting text-[11px] text-[var(--text-tertiary)] mt-0.5">Total capital deployed</p>
          </div>

          {activePortfolio === null && portfolios && portfolios.length > 0 && (
            <div className="mt-3 pt-3 border-t border-[var(--border-subtle)] flex flex-wrap gap-x-2 gap-y-1 text-label-micro font-medium text-[var(--text-secondary)]">
              {portfolios.map((p, idx) => {
                const val = p.totalInvested;
                return (
                  <span key={p.id} className="flex items-center gap-1">
                    <span>{p.label}:</span>
                    <span className="text-[var(--text-primary)] font-bold tnum">
                      {renderValue(val)}
                    </span>
                    {idx < portfolios.length - 1 && <span className="text-[var(--border-subtle)] ml-1">|</span>}
                  </span>
                );
              })}
            </div>
          )}
        </div>

        {/* 3. Total Return */}
        <div className="flex flex-col justify-between gap-1 lg:px-6">
          <div className="flex items-center justify-between">
            <span className="text-label-small text-[var(--text-secondary)] font-semibold">Total Return</span>
            <span className={`w-6 h-6 rounded-[var(--radius-small)] flex items-center justify-center ${
              isGain ? 'bg-[var(--positive-soft)]' : 'bg-[var(--negative-soft)]'
            }`}>
              {isGain ? <TrendingUp size={13} className="text-[var(--positive)]" /> : <TrendingDown size={13} className="text-[var(--negative)]" />}
            </span>
          </div>

          <div className="mt-1">
            <p className={`text-2xl sm:text-3xl font-extrabold text-financial tnum tracking-tight ${isGain ? 'text-[var(--positive)]' : 'text-[var(--negative)]'}`}>
              {isBalancesHidden ? '••••••' : <>{isGain ? '+' : ''}<AnimatedNumber value={totalPnL} formatter={formatINR} /></>}
            </p>
            <p className="text-supporting text-[11px] text-[var(--text-tertiary)] mt-0.5">
              {formatPercent(totalPnLPercent)} gain
            </p>
          </div>

          {activePortfolio === null && portfolios && portfolios.length > 0 && (
            <div className="mt-3 pt-3 border-t border-[var(--border-subtle)] flex flex-wrap gap-x-2 gap-y-1 text-label-micro font-medium text-[var(--text-secondary)]">
              {portfolios.map((p, idx) => {
                const pnl = p.totalPnL;
                const localGain = pnl >= 0;
                return (
                  <span key={p.id} className="flex items-center gap-1">
                    <span>{p.label}:</span>
                    <span className={`font-bold tnum ${localGain ? 'text-[var(--positive)]' : 'text-[var(--negative)]'}`}>
                      {isBalancesHidden ? '••••••' : <>{localGain ? '+' : ''}<AnimatedNumber value={pnl} formatter={formatINR} /></>}
                    </span>
                    {idx < portfolios.length - 1 && <span className="text-[var(--border-subtle)] ml-1">|</span>}
                  </span>
                );
              })}
            </div>
          )}
        </div>

        {/* 4. Today's Return */}
        <div className="flex flex-col justify-between gap-1 lg:pl-6">
          <div className="flex items-center justify-between">
            <span className="text-label-small text-[var(--text-secondary)] font-semibold">Today's Return</span>
            <span className={`w-6 h-6 rounded-[var(--radius-small)] flex items-center justify-center ${
              isTodayGain ? 'bg-[var(--positive-soft)]' : 'bg-[var(--negative-soft)]'
            }`}>
              {isTodayGain ? <TrendingUp size={13} className="text-[var(--positive)]" /> : <TrendingDown size={13} className="text-[var(--negative)]" />}
            </span>
          </div>

          <div className="mt-1">
            {todayPnL !== undefined ? (
              <>
                <p className={`text-2xl sm:text-3xl font-extrabold text-financial tnum tracking-tight ${isTodayGain ? 'text-[var(--positive)]' : 'text-[var(--negative)]'}`}>
                  {isBalancesHidden ? '••••••' : <>{isTodayGain ? '+' : ''}<AnimatedNumber value={todayPnL} formatter={formatINR} /></>}
                </p>
                <p className="text-supporting text-[11px] text-[var(--text-tertiary)] mt-0.5">
                  Intraday delta
                </p>
              </>
            ) : (
              <>
                <p className="text-2xl sm:text-3xl font-extrabold text-financial tnum opacity-40">--</p>
                <p className="text-supporting text-[11px] text-[var(--text-tertiary)] mt-0.5">Delta unavailable</p>
              </>
            )}
          </div>

          {activePortfolio === null && portfolios && portfolios.length > 0 && (
            <div className="mt-3 pt-3 border-t border-[var(--border-subtle)] flex flex-wrap gap-x-2 gap-y-1 text-label-micro font-medium text-[var(--text-secondary)]">
              {memberBreakdowns.map((p, idx) => {
                const localTodayGain = p.todayPnL >= 0;
                return (
                  <span key={p.id} className="flex items-center gap-1">
                    <span>{p.label}:</span>
                    <span className={`font-bold tnum ${localTodayGain ? 'text-[var(--positive)]' : 'text-[var(--negative)]'}`}>
                      {isBalancesHidden ? '••••••' : <>{localTodayGain ? '+' : ''}<AnimatedNumber value={p.todayPnL} formatter={formatINR} /></>}
                    </span>
                    {idx < memberBreakdowns.length - 1 && <span className="text-[var(--border-subtle)] ml-1">|</span>}
                  </span>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

export default React.memo(SummaryCards);
