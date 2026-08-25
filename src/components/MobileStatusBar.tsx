import React from 'react';
import { RefreshCw } from './icons/AppIcons';

interface MobileStatusBarProps {
  priceStatus: string;
  lastUpdated: Date | null;
  isLoadingPrices: boolean;
  onRefresh: () => void;
}

export const MobileStatusBar = React.memo(function MobileStatusBar({
  priceStatus,
  lastUpdated,
  isLoadingPrices,
  onRefresh,
}: MobileStatusBarProps) {
  const isLive = priceStatus === 'success';

  return (
    <div className="flex items-center justify-between px-3.5 py-2.5 bg-[var(--surface)] border border-[var(--border-subtle)] rounded-[var(--radius-medium)] text-[11px] text-[var(--text-secondary)] shadow-xs apple-card">
      <div className="flex items-center gap-1.5 min-w-0" aria-live="polite">
        <span
          className={`w-2 h-2 rounded-full shrink-0 ${
            isLive ? 'bg-[var(--positive)] animate-pulse' : 'bg-[var(--warning)]'
          }`}
        />
        <span className="font-bold text-[var(--text-primary)] shrink-0">
          {isLive ? 'Live Prices' : 'Snapshot'}
        </span>
        <span className="text-[var(--text-tertiary)] shrink-0">•</span>
        <span className="truncate text-[var(--text-tertiary)]">
          Updated {lastUpdated ? lastUpdated.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : 'Never'}
        </span>
      </div>
      <button
        onClick={onRefresh}
        disabled={isLoadingPrices}
        className="flex items-center gap-1 min-h-[44px] px-2.5 -my-1.5 font-bold text-[var(--accent-blue)] hover:opacity-80 active:scale-[0.97] transition-all shrink-0 ml-1 cursor-pointer disabled:opacity-50 touch-manipulation"
        title="Sync live market rates"
        aria-label="Sync live market rates"
      >
        <RefreshCw size={11} className={isLoadingPrices ? 'animate-spin' : ''} aria-hidden="true" />
        <span>Sync</span>
      </button>
    </div>
  );
});

export default MobileStatusBar;
