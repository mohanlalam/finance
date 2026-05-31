import { TrendingUp, RefreshCw } from 'lucide-react';
import { formatINR, formatPercent } from '../utils/formatters';
import { FetchStatus } from '../hooks/useMarketData';
import { Portfolio } from '../types/portfolio';
import ExportPanel, { ImportRow } from './ExportPanel';

interface HeaderProps {
  totalCurrentValue: number;
  totalPnL: number;
  totalPnLPercent: number;
  status: FetchStatus;
  lastUpdated: Date | null;
  onRefresh: () => void;
  portfolios: Portfolio[];
  onImportCSV: (rows: ImportRow[], portfolioName: string) => Promise<void>;
  portfolioOptions: { name: string; label: string }[];
}

export default function Header({
  totalCurrentValue,
  totalPnL,
  totalPnLPercent,
  status,
  lastUpdated,
  onRefresh,
  portfolios,
  onImportCSV,
  portfolioOptions,
}: HeaderProps) {
  const isGain = totalPnL >= 0;
  const isLoading = status === 'loading';

  return (
    <header className="bg-slate-900 text-white">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-500 flex items-center justify-center shadow-lg shadow-blue-500/30">
              <TrendingUp size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-base font-bold leading-tight">Family Portfolio</h1>
              <p className="text-xs text-slate-400">Investment Dashboard</p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-4">
            <div className="text-right">
              <p className="text-xs text-slate-400 mb-0.5">Family Net Worth</p>
              <p className={`text-lg font-bold transition-opacity ${isLoading ? 'opacity-40' : ''}`}>
                {formatINR(totalCurrentValue)}
              </p>
            </div>
            <div className={`text-right px-3 py-1.5 rounded-xl ${isGain ? 'bg-emerald-500/20' : 'bg-red-500/20'}`}>
              <p className="text-xs text-slate-400 mb-0.5">Total P&amp;L</p>
              <p className={`text-base font-bold ${isGain ? 'text-emerald-400' : 'text-red-400'}`}>
                {formatPercent(totalPnLPercent)}
              </p>
            </div>
            <button
              onClick={onRefresh}
              disabled={isLoading}
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-blue-400 transition-colors border border-slate-700 rounded-lg px-3 py-1.5 disabled:opacity-40"
            >
              <RefreshCw size={12} className={isLoading ? 'animate-spin' : ''} />
              {isLoading ? 'Fetching...' : lastUpdated ? lastUpdated.toLocaleTimeString('en-IN') : 'Fetch live prices'}
            </button>
            <ExportPanel
              portfolios={portfolios}
              onImportCSV={onImportCSV}
              portfolioOptions={portfolioOptions}
            />
          </div>
        </div>
      </div>
    </header>
  );
}
