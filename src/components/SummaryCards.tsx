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

export default function SummaryCards({
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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">{label} Net Worth</span>
          <span className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center">
            <IndianRupee size={16} className="text-blue-500" />
          </span>
        </div>
        <p className={`text-2xl font-bold text-slate-800 transition-opacity ${isLoading ? 'opacity-40' : ''}`}>{formatINR(totalCurrentValue)}</p>
        <p className="text-xs text-slate-400">{isLoading ? 'Fetching live prices...' : 'Based on latest prices'}</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Total Invested</span>
          <span className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center">
            <BarChart2 size={16} className="text-slate-500" />
          </span>
        </div>
        <p className="text-2xl font-bold text-slate-800">{formatINR(totalInvested)}</p>
        <p className="text-xs text-slate-400">Cost basis across all holdings</p>
      </div>

      <div className={`rounded-2xl border shadow-sm p-5 flex flex-col gap-2 ${isGain ? 'bg-emerald-50 border-emerald-100' : 'bg-red-50 border-red-100'}`}>
        <div className="flex items-center justify-between">
          <span className={`text-xs font-semibold uppercase tracking-widest ${isGain ? 'text-emerald-500' : 'text-red-400'}`}>Unrealized P&amp;L</span>
          <span className={`w-8 h-8 rounded-xl flex items-center justify-center ${isGain ? 'bg-emerald-100' : 'bg-red-100'}`}>
            {isGain ? <TrendingUp size={16} className="text-emerald-600" /> : <TrendingDown size={16} className="text-red-500" />}
          </span>
        </div>
        <p className={`text-2xl font-bold ${isGain ? 'text-emerald-700' : 'text-red-600'}`}>{formatINR(totalPnL)}</p>
        <p className={`text-xs font-semibold ${pnlColor(totalPnL)}`}>{formatPercent(totalPnLPercent)} overall return</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Today's Movement</span>
          <span className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center">
            <Activity size={16} className="text-amber-500" />
          </span>
        </div>
        {todayPnL !== undefined ? (
          <>
            <p className={`text-2xl font-bold ${pnlColor(todayPnL)}`}>{formatINR(todayPnL)}</p>
            <p className={`text-xs font-semibold ${pnlColor(todayPnL)}`}>Daily P&amp;L estimate</p>
          </>
        ) : (
          <p className="text-sm text-slate-400 mt-1">Live data not connected</p>
        )}
      </div>
    </div>
  );
}
