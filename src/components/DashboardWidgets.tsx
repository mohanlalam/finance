import { useMemo } from 'react';
import { Portfolio } from '../types/portfolio';
import { formatINR, formatPercent, getFDEffectiveValue } from '../utils/formatters';
import { Landmark, TrendingUp, ShieldAlert, Award } from 'lucide-react';

interface DashboardWidgetsProps {
  portfolios: Portfolio[];
  activePortfolio: Portfolio | null;
}

export default function DashboardWidgets({ portfolios, activePortfolio }: DashboardWidgetsProps) {
  
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
    const totalCurrentStocks = holdings.reduce((sum, h) => sum + h.currentValue, 0);
    const prevCurrentStocks = totalCurrentStocks - todayPnL;
    return prevCurrentStocks > 0 ? (todayPnL / prevCurrentStocks) * 100 : 0;
  }, [holdings, todayPnL]);

  // Find FDs maturing in next 30 days
  const maturingFDs = useMemo(() => {
    const now = new Date();
    const limit = new Date(now.getTime() + 30 * 24 * 3600 * 1000);
    const list = activePortfolio ? activePortfolio.fixedDeposits : portfolios.flatMap((p) => p.fixedDeposits);

    return list
      .filter((fd) => {
        if (!fd.maturity_date || fd.status === 'matured') return false;
        const mat = new Date(fd.maturity_date);
        return mat.getTime() >= now.getTime() && mat.getTime() <= limit.getTime();
      })
      .sort((a, b) => new Date(a.maturity_date!).getTime() - new Date(b.maturity_date!).getTime());
  }, [portfolios, activePortfolio]);

  return (
    <div className="bg-slate-900 text-slate-100 min-h-screen p-6 space-y-6 flex flex-col items-center justify-center">
      <div className="text-center">
        <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest">Android Home Widgets</h2>
        <p className="text-[10px] text-slate-400 mt-0.5">Capacitor Native Webview Ports</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-sm w-full">
        {/* Widget 1: Net Worth Widget */}
        <div className="bg-slate-800 border border-slate-700/60 rounded-3xl p-5 shadow-2xl relative overflow-hidden flex flex-col justify-between aspect-square">
          <div className="absolute top-0 right-0 p-4">
            <Award className="text-blue-400" size={20} />
          </div>
          <div>
            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Net Worth</p>
            <h3 className="text-2xl font-extrabold text-slate-100 mt-1.5 truncate">
              {formatINR(totalCurrentValue)}
            </h3>
          </div>
          <div>
            <p className="text-[10px] text-slate-400">Total Invested: {formatINR(totalInvested)}</p>
            <p className={`text-[11px] font-bold mt-1 ${totalPnL >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {formatPercent(totalPnLPercent, 2)} total return
            </p>
          </div>
        </div>

        {/* Widget 2: Today's Gain Widget */}
        <div className="bg-slate-800 border border-slate-700/60 rounded-3xl p-5 shadow-2xl relative overflow-hidden flex flex-col justify-between aspect-square">
          <div className="absolute top-0 right-0 p-4">
            <TrendingUp className="text-emerald-400" size={20} />
          </div>
          <div>
            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Today's P&L</p>
            <h3 className={`text-2xl font-extrabold mt-1.5 truncate ${todayPnL >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {todayPnL >= 0 ? '+' : ''}{formatINR(todayPnL)}
            </h3>
          </div>
          <div>
            <p className="text-[10px] text-slate-400">Market Movement Today</p>
            <p className={`text-[11px] font-bold mt-1 ${todayPnL >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {todayPnL >= 0 ? '▲' : '▼'} {todayPnLPercent.toFixed(2)}%
            </p>
          </div>
        </div>

        {/* Widget 3: Upcoming FD Maturity Widget */}
        <div className="bg-slate-800 border border-slate-700/60 rounded-3xl p-5 shadow-2xl relative overflow-hidden flex flex-col justify-between aspect-square">
          <div className="absolute top-0 right-0 p-4">
            <Landmark className="text-purple-400" size={20} />
          </div>
          <div>
            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">FD Maturity</p>
            {maturingFDs.length > 0 ? (
              <div className="mt-2 space-y-1">
                <h4 className="text-xs font-bold text-slate-100 truncate">{maturingFDs[0].bank_name}</h4>
                <p className="text-[10px] text-slate-400">Due {new Date(maturingFDs[0].maturity_date!).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                <p className="text-[11px] font-extrabold text-purple-400">{formatINR(getFDEffectiveValue(maturingFDs[0]))}</p>
              </div>
            ) : (
              <div className="mt-3 text-center py-2 bg-slate-900/30 rounded-xl">
                <p className="text-[10px] text-slate-500 italic">No upcoming maturities</p>
                <p className="text-[9px] text-slate-600 mt-0.5">within 30 days</p>
              </div>
            )}
          </div>
          <div className="pt-2 border-t border-slate-750/50 flex justify-between items-center text-[8.5px] text-slate-500">
            <span>Maturing soon: {maturingFDs.length} FDs</span>
            {maturingFDs.length > 0 && <ShieldAlert size={10} className="text-amber-500 animate-pulse" />}
          </div>
        </div>
      </div>
    </div>
  );
}
