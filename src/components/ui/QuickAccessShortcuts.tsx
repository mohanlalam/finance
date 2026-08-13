import React from 'react';
import { 
  TrendingUp, Landmark, Clock, Coins, Home, 
  Shield, FolderOpen, Calculator, TrendingDown 
} from '../icons/AppIcons';
export type AssetTab = string;

interface QuickAccessShortcutsProps {
  activeAsset: AssetTab;
  onSelectAsset: (asset: any) => void;
}

const SHORTCUTS: {
  id: AssetTab;
  label: string;
  shortLabel: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  color: string;
  bgLight: string;
  bgDark: string;
}[] = [
  { id: 'stocks', label: 'Stocks & ETFs', shortLabel: 'Stocks', icon: TrendingUp, color: 'text-blue-600 dark:text-blue-400', bgLight: 'bg-blue-500/10', bgDark: 'dark:bg-blue-400/10' },
  { id: 'fd', label: 'Fixed Deposits', shortLabel: 'FDs', icon: Landmark, color: 'text-amber-600 dark:text-amber-400', bgLight: 'bg-amber-500/10', bgDark: 'dark:bg-amber-400/10' },
  { id: 'rd', label: 'Recurring Deposits', shortLabel: 'RDs', icon: Clock, color: 'text-indigo-600 dark:text-indigo-400', bgLight: 'bg-indigo-500/10', bgDark: 'dark:bg-indigo-400/10' },
  { id: 'sip', label: 'SIP Mutual Funds', shortLabel: 'SIPs', icon: TrendingUp, color: 'text-emerald-600 dark:text-emerald-400', bgLight: 'bg-emerald-500/10', bgDark: 'dark:bg-emerald-400/10' },
  { id: 'gold', label: 'Gold Holdings', shortLabel: 'Gold', icon: Coins, color: 'text-yellow-600 dark:text-yellow-400', bgLight: 'bg-yellow-500/10', bgDark: 'dark:bg-yellow-400/10' },
  { id: 'real_estate', label: 'Real Estate', shortLabel: 'Real Estate', icon: Home, color: 'text-purple-600 dark:text-purple-400', bgLight: 'bg-purple-500/10', bgDark: 'dark:bg-purple-400/10' },
  { id: 'insurance', label: 'Insurance Cover', shortLabel: 'Insurance', icon: Shield, color: 'text-rose-600 dark:text-rose-400', bgLight: 'bg-rose-500/10', bgDark: 'dark:bg-rose-400/10' },
  { id: 'documents', label: 'Document Vault', shortLabel: 'Vault', icon: FolderOpen, color: 'text-cyan-600 dark:text-cyan-400', bgLight: 'bg-cyan-500/10', bgDark: 'dark:bg-cyan-400/10' },
  { id: 'what_if', label: 'What-If Calculator', shortLabel: 'Calculator', icon: Calculator, color: 'text-sky-600 dark:text-sky-400', bgLight: 'bg-sky-500/10', bgDark: 'dark:bg-sky-400/10' },
  { id: 'tax', label: 'Tax Harvesting', shortLabel: 'Tax', icon: TrendingDown, color: 'text-teal-600 dark:text-teal-400', bgLight: 'bg-teal-500/10', bgDark: 'dark:bg-teal-400/10' },
];

export function QuickAccessShortcuts({ activeAsset, onSelectAsset }: QuickAccessShortcutsProps) {
  return (
    <div className="apple-card p-4 sm:p-5 transition-all mt-5">
      <div className="flex items-center justify-between mb-3.5">
        <div>
          <h3 className="text-sm font-extrabold text-[var(--text-primary)] tracking-tight">
            Quick Asset Navigation
          </h3>
          <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">
            Click any icon to jump directly to its detailed registry &amp; holdings
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 lg:grid-cols-10 gap-2.5">
        {SHORTCUTS.map((item) => {
          const Icon = item.icon;
          const isActive = activeAsset === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectAsset(item.id)}
              className={`flex flex-col items-center justify-center p-2.5 rounded-xl border transition-all duration-200 ios-press group text-center ${
                isActive
                  ? 'border-blue-500 bg-blue-50/90 dark:bg-blue-950/60 ring-2 ring-blue-500/20 shadow-xs'
                  : 'border-slate-200/60 dark:border-slate-800/80 bg-white/60 dark:bg-slate-900/40 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-xs'
              }`}
              title={item.label}
              aria-label={`Jump to ${item.label}`}
            >
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center transition-transform group-hover:scale-110 mb-1.5 ${item.bgLight} ${item.bgDark} ${item.color}`}>
                <Icon size={18} />
              </div>
              <span className={`text-[11px] font-bold tracking-tight line-clamp-1 ${isActive ? 'text-blue-700 dark:text-blue-300' : 'text-slate-700 dark:text-slate-300'}`}>
                {item.shortLabel}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default React.memo(QuickAccessShortcuts);
