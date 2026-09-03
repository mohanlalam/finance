import React from 'react';
import { 
  TrendingUp, Landmark, Clock, Coins, Home, 
  Shield, FolderOpen, TrendingDown, Calendar 
} from '../icons/AppIcons';
export type AssetTab = 'home' | 'stocks' | 'fd' | 'rd' | 'sip' | 'gold' | 'real_estate' | 'insurance' | 'documents' | 'widgets' | 'tax' | 'cashflow';

interface QuickAccessShortcutsProps {
  activeAsset: AssetTab;
  onSelectAsset: (asset: AssetTab) => void;
}

const SHORTCUTS: {
  id: AssetTab;
  label: string;
  shortLabel: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  color: string;
  bg: string;
}[] = [
  { id: 'stocks', label: 'Stocks & ETFs', shortLabel: 'Stocks', icon: TrendingUp, color: 'text-[var(--accent-blue)]', bg: 'bg-[var(--accent-blue-soft)]' },
  { id: 'fd', label: 'Fixed Deposits', shortLabel: 'FDs', icon: Landmark, color: 'text-[var(--warning)]', bg: 'bg-[var(--warning-soft)]' },
  { id: 'rd', label: 'Recurring Deposits', shortLabel: 'RDs', icon: Clock, color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-500/10 dark:bg-indigo-400/10' },
  { id: 'sip', label: 'SIP Mutual Funds', shortLabel: 'SIPs', icon: TrendingUp, color: 'text-[var(--positive)]', bg: 'bg-[var(--positive-soft)]' },
  { id: 'gold', label: 'Gold Holdings', shortLabel: 'Gold', icon: Coins, color: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-500/10 dark:bg-yellow-400/10' },
  { id: 'real_estate', label: 'Real Estate', shortLabel: 'Real Estate', icon: Home, color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-500/10 dark:bg-purple-400/10' },
  { id: 'insurance', label: 'Insurance Cover', shortLabel: 'Insurance', icon: Shield, color: 'text-[var(--negative)]', bg: 'bg-[var(--negative-soft)]' },
  { id: 'documents', label: 'Document Vault', shortLabel: 'Vault', icon: FolderOpen, color: 'text-[var(--text-secondary)]', bg: 'bg-[var(--surface-secondary)]' },
  { id: 'tax', label: 'Tax Harvesting', shortLabel: 'Tax', icon: TrendingDown, color: 'text-teal-600 dark:text-teal-400', bg: 'bg-teal-500/10 dark:bg-teal-400/10' },
  { id: 'cashflow', label: 'Cash Flow & Reinvest', shortLabel: 'Cash Flow', icon: Calendar, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-500/10 dark:bg-blue-400/10' },
];

export function QuickAccessShortcuts({ activeAsset, onSelectAsset }: QuickAccessShortcutsProps) {
  return (
    <div className="apple-card p-4 sm:p-5 transition-all mt-5">
      <div className="flex items-center justify-between mb-3.5">
        <div>
          <h3 className="text-sm font-extrabold text-[var(--text-primary)] tracking-tight">
            Quick Asset Navigation
          </h3>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            Click any icon to jump directly to its detailed registry &amp; holdings
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 lg:grid-cols-10 gap-2">
        {SHORTCUTS.map((item) => {
          const Icon = item.icon;
          const isActive = activeAsset === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectAsset(item.id)}
              className={`flex flex-col items-center justify-center p-2.5 rounded-[var(--radius-medium)] border transition-all duration-200 ios-press group text-center ${
                isActive
                  ? 'border-[var(--accent-blue)] bg-[var(--accent-blue-soft)] ring-2 ring-[var(--accent-blue)]/20 shadow-xs animate-fade-in'
                  : 'border-[var(--border-subtle)] bg-[var(--surface-secondary)] hover:bg-[var(--surface-tertiary)] hover:border-[var(--text-tertiary)] hover:shadow-xs'
              }`}
              title={item.label}
              aria-label={`Jump to ${item.label}`}
            >
              <div className={`w-9 h-9 rounded-[var(--radius-small)] flex items-center justify-center transition-transform group-hover:scale-110 mb-1.5 ${item.bg} ${item.color}`}>
                <Icon size={18} aria-hidden="true" />
              </div>
              <span className={`text-[11px] font-bold tracking-tight line-clamp-1 ${isActive ? 'text-[var(--accent-blue)] font-extrabold' : 'text-[var(--text-primary)]'}`}>
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
