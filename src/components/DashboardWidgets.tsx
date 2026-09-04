import { useMemo, memo } from 'react';
import { Portfolio } from '../types/portfolio';
import { formatINR, formatPercent, getFDEffectiveValue } from '../utils/formatters';
import { Landmark, TrendingUp, TrendingDown, ShieldAlert, Award } from './icons/AppIcons';

interface DashboardWidgetsProps {
  portfolios: Portfolio[];
  activePortfolio: Portfolio | null;
}

function DashboardWidgets({ portfolios, activePortfolio }: DashboardWidgetsProps) {
  
  const totalInvested = activePortfolio 
    ? activePortfolio.totalInvested 
    : portfolios.reduce((s, p) => s + p.totalInvested, 0);

  const totalCurrentValue = activePortfolio 
    ? activePortfolio.totalCurrentValue 
    : portfolios.reduce((s, p) => s + p.totalCurrentValue, 0);

  const totalPnL = totalCurrentValue - totalInvested;

  const totalPnLPercent = useMemo(() => {
    return totalInvested > 0 ? (totalPnL / totalInvested) * 100 : 0;
  }, [totalInvested, totalPnL]);

  // Calculate today's gain
  const holdings = activePortfolio ? activePortfolio.holdings : portfolios.flatMap((p) => p.holdings);
  const todayPnL = useMemo(() => {
    return holdings.reduce((sum, h) => {
      const factor = 1 + h.todayPnLPercent / 100;
      const yesterdayValue = factor !== 0 ? h.currentValue / factor : h.currentValue;
      return sum + (h.currentValue - yesterdayValue);
    }, 0);
  }, [holdings]);

  const todayPnLPercent = useMemo(() => {
    const prevTotal = totalCurrentValue - todayPnL;
    return prevTotal > 0 ? (todayPnL / prevTotal) * 100 : 0;
  }, [totalCurrentValue, todayPnL]);

  // Get maturing FDs (within 30 days)
  const maturingFDs = useMemo(() => {
    const allFDs = activePortfolio 
      ? activePortfolio.fixedDeposits 
      : portfolios.flatMap((p) => p.fixedDeposits);

    const now = new Date();
    const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    return allFDs
      .filter((fd) => {
        if (!fd.maturity_date) return false;
        const matDate = new Date(fd.maturity_date);
        return matDate >= now && matDate <= in30Days;
      })
      .sort((a, b) => new Date(a.maturity_date!).getTime() - new Date(b.maturity_date!).getTime());
  }, [portfolios, activePortfolio]);

  return (
    <div className="flex justify-center mb-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:max-w-4xl w-full">
        {/* Widget 1: Net Worth Widget */}
        <div className="apple-card p-5 relative overflow-hidden flex flex-col justify-between aspect-square ios-press select-none">
          <div className="absolute top-0 right-0 p-4">
            <Award className="text-[var(--accent-blue)]" size={20} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider">Net Worth</p>
            <h3 className="text-2xl font-bold text-[var(--text-primary)] tnum mt-1.5 truncate">
              {formatINR(totalCurrentValue)}
            </h3>
          </div>
          <div>
            <p className="text-xs text-[var(--text-secondary)]">Total Invested: <span className="tnum font-medium">{formatINR(totalInvested)}</span></p>
            <p className={`text-xs font-bold mt-1 tnum ${totalPnL >= 0 ? 'text-[var(--positive)]' : 'text-[var(--negative)]'}`}>
              {totalPnL >= 0 ? '+' : ''}{formatPercent(totalPnLPercent, 2)} total return
            </p>
          </div>
        </div>

        {/* Widget 2: Today's Gain Widget */}
        <div className="apple-card p-5 relative overflow-hidden flex flex-col justify-between aspect-square ios-press select-none">
          <div className="absolute top-0 right-0 p-4">
            {todayPnL >= 0 ? (
              <TrendingUp className="text-[var(--positive)]" size={20} />
            ) : (
              <TrendingDown className="text-[var(--negative)]" size={20} />
            )}
          </div>
          <div>
            <p className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider">Today's P&L</p>
            <h3 className={`text-2xl font-bold tnum mt-1.5 truncate ${todayPnL >= 0 ? 'text-[var(--positive)]' : 'text-[var(--negative)]'}`}>
              {todayPnL >= 0 ? '+' : ''}{formatINR(todayPnL)}
            </h3>
          </div>
          <div>
            <p className="text-xs text-[var(--text-secondary)]">Market Movement Today</p>
            <p className={`text-xs font-bold mt-1 tnum flex items-center gap-1 ${todayPnL >= 0 ? 'text-[var(--positive)]' : 'text-[var(--negative)]'}`}>
              <span>{todayPnL >= 0 ? '▲' : '▼'}</span>
              <span>{todayPnL >= 0 ? '+' : ''}{todayPnLPercent.toFixed(2)}%</span>
            </p>
          </div>
        </div>

        {/* Widget 3: Upcoming FD Maturity Widget */}
        <div className="apple-card p-5 relative overflow-hidden flex flex-col justify-between aspect-square ios-press select-none">
          <div className="absolute top-0 right-0 p-4">
            <Landmark className="text-[var(--warning)]" size={20} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider">FD Maturity</p>
            {maturingFDs.length > 0 ? (
              <div className="mt-2 space-y-1">
                <h4 className="text-xs font-bold text-[var(--text-primary)] truncate">{maturingFDs[0].bank_name}</h4>
                <p className="text-[10px] text-[var(--text-secondary)]">Due {new Date(maturingFDs[0].maturity_date!).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                <p className="text-[11px] font-bold text-[var(--warning)] tnum">{formatINR(getFDEffectiveValue(maturingFDs[0]))}</p>
              </div>
            ) : (
              <div className="mt-3 text-center py-2 bg-[var(--surface-secondary)] rounded-[var(--radius-medium)] border border-[var(--border-subtle)]">
                <p className="text-[10px] text-[var(--text-secondary)] italic">No upcoming maturities</p>
                <p className="text-[9px] text-[var(--text-tertiary)] mt-0.5">within 30 days</p>
              </div>
            )}
          </div>
          <div className="pt-2 border-t border-[var(--border-subtle)] flex justify-between items-center text-[10px] text-[var(--text-secondary)]">
            <span>Maturing soon: {maturingFDs.length} FDs</span>
            {maturingFDs.length > 0 && <ShieldAlert size={12} className="text-[var(--warning)] animate-pulse" />}
          </div>
        </div>
      </div>
    </div>
  );
}

export default memo(DashboardWidgets);
