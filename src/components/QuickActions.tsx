import React from 'react';
import { Landmark, Coins, RefreshCw, TrendingUp } from 'lucide-react';

interface QuickActionsProps {
  onAddStock: () => void;
  onAddFD: () => void;
  onAddGold: () => void;
  onRefresh: () => void;
  isRefreshing: boolean;
}

const actions = [
  { id: 'stock', label: 'Add Stock', icon: <TrendingUp size={13} />, color: 'bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/40' },
  { id: 'fd', label: 'Add FD', icon: <Landmark size={13} />, color: 'bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 dark:hover:bg-indigo-900/40' },
  { id: 'gold', label: 'Add Gold', icon: <Coins size={13} />, color: 'bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800 hover:bg-amber-100 dark:hover:bg-amber-900/40' },
] as const;

function QuickActions({ onAddStock, onAddFD, onAddGold, onRefresh, isRefreshing }: QuickActionsProps) {
  const handlers: Record<string, () => void> = {
    stock: onAddStock,
    fd: onAddFD,
    gold: onAddGold,
  };

  return (
    <div data-quick-actions className="flex items-center gap-2 overflow-x-auto pb-0.5 print:hidden">
      <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider shrink-0 hidden sm:inline">
        Quick
      </span>

      {actions.map((action) => (
        <button
          key={action.id}
          onClick={handlers[action.id]}
          className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all duration-150 ${action.color}`}
        >
          {action.icon}
          {action.label}
        </button>
      ))}

      <button
        onClick={onRefresh}
        disabled={isRefreshing}
        className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all duration-150 disabled:opacity-40"
      >
        <RefreshCw size={13} className={isRefreshing ? 'animate-spin' : ''} />
        {isRefreshing ? 'Refreshing...' : 'Refresh'}
      </button>
    </div>
  );
}

export default React.memo(QuickActions);
