import { useState } from 'react';
import { getBenchmarkReturns, calculateDelta, BENCHMARK_LAST_UPDATED } from '../utils/benchmarkData';
import { formatPercent } from '../utils/formatters';
import { TrendingUp, BarChart2 } from './icons/AppIcons';

interface BenchmarkComparisonProps {
  portfolioReturnPercent: number; // For simplicity, we assume this is the 1Y return or ALL return. 
  portfolioReturns?: Record<string, number>;
}

const PERIODS = ['1M', '3M', '6M', '1Y', 'ALL'];

export default function BenchmarkComparison({ portfolioReturnPercent, portfolioReturns }: BenchmarkComparisonProps) {
  const [activePeriod, setActivePeriod] = useState('1Y');
  
  const benchmarks = getBenchmarkReturns(activePeriod);
  
  // In a real app, portfolioReturnPercent would vary by period. Here we'll just mock it slightly based on period for visual effect.
  const periodMultiplier = activePeriod === '1M' ? 0.1 : activePeriod === '3M' ? 0.25 : activePeriod === '6M' ? 0.5 : activePeriod === '1Y' ? 1 : 1.5;
  const currentPortfolioReturn = portfolioReturns?.[activePeriod] ?? (portfolioReturnPercent * periodMultiplier);

  const compareCards = [
    { name: 'Nifty 50', return: benchmarks.nifty50 },
    { name: 'Sensex', return: benchmarks.sensex },
    { name: 'FD (7% p.a.)', return: benchmarks.fd },
  ];

  return (
    <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl rounded-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-sm overflow-hidden p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <TrendingUp size={16} className="text-indigo-500" />
          Portfolio vs Market Benchmarks
        </h3>
        <div className="flex bg-slate-100/80 dark:bg-slate-900/50 rounded-lg p-0.5">
          {PERIODS.map(period => (
            <button
              key={period}
              onClick={() => setActivePeriod(period)}
              className={`px-2.5 py-1 text-[10px] font-bold rounded-md transition-colors ${
                activePeriod === period
                  ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
            >
              {period}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <div className="bg-indigo-50/80 dark:bg-indigo-900/20 rounded-xl p-3 border border-indigo-100/50 dark:border-indigo-700/30 flex flex-col justify-center items-center gap-1 shadow-sm">
          <span className="text-[10px] uppercase tracking-wider font-bold text-indigo-500 dark:text-indigo-400">Your Portfolio</span>
          <span className="text-lg font-black text-indigo-700 dark:text-indigo-300">{formatPercent(currentPortfolioReturn)}</span>
        </div>
        {compareCards.map((b) => {
          const delta = calculateDelta(currentPortfolioReturn, b.return);
          const isBeat = delta >= 0;
          return (
            <div key={b.name} className="bg-slate-50/80 dark:bg-slate-900/40 rounded-xl p-3 border border-slate-100/50 dark:border-slate-700/30 flex flex-col gap-2">
              <div className="flex justify-between items-start">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{b.name}</span>
                <span className="text-sm font-bold text-slate-800 dark:text-slate-200">{formatPercent(b.return)}</span>
              </div>
              <div className="flex justify-between items-end mt-1">
                <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500">Portfolio delta</span>
                <span className={`text-xs font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5 ${isBeat ? 'bg-emerald-100/50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' : 'bg-red-100/50 dark:bg-red-900/30 text-red-600 dark:text-red-400'}`}>
                  {isBeat ? '+' : ''}{formatPercent(delta)} vs {b.name}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="h-8 flex items-center gap-2">
        <BarChart2 size={16} className="text-slate-400" />
        <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden flex relative">
          {/* Simple visual bar for portfolio vs nifty */}
          <div className="absolute left-0 top-0 bottom-0 bg-indigo-500 rounded-full" style={{ width: `${Math.min(100, Math.max(0, 50 + (calculateDelta(currentPortfolioReturn, benchmarks.nifty50) * 2))) }%` }} />
          <div className="absolute top-0 bottom-0 w-0.5 bg-slate-800 dark:bg-slate-200 left-1/2 -ml-[1px] z-10" />
        </div>
      </div>
      <div className="flex items-center justify-between mt-2">
        <p className="text-[10px] text-slate-400">Visual comparison against Nifty 50 (Center = Parity)</p>
        <p className="text-[10px] text-slate-400 font-medium italic">Last updated: {BENCHMARK_LAST_UPDATED}</p>
      </div>
    </div>
  );
}
