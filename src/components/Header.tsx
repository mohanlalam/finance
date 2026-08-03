import React, { useState, useEffect, Suspense } from 'react';
import { TrendingUp, RefreshCw, Bell, X, TrendingDown, Landmark, Shield, Activity, Check, Sun, Moon } from './icons/AppIcons';
import { formatINR, formatPercent } from '../utils/formatters';
import { FetchStatus } from '../hooks/useMarketData';
import { Portfolio } from '../types/portfolio';
import type { ImportRow } from './ExportPanel';
import { Alert } from '../hooks/useAlerts';
import { IconButton } from './ui/IconButton';
import { Badge } from './ui/Badge';

const ExportPanel = React.lazy(() => import('./ExportPanel'));

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
  alerts: Alert[];
  onDismissAlert: (id: string) => void;
  onDismissAll: () => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  activePortfolioLabel?: string;
  isPriceStale?: boolean;
  isUsingCachedData?: boolean;
}

const ALERTS_TYPE_CONFIG: Record<string, { icon: React.ReactNode; color: string; bg: string; border: string }> = {
  '52w_high': {
    icon: <TrendingUp size={13} />,
    color: 'text-blue-600',
    bg: 'bg-blue-50 dark:bg-blue-950/20',
    border: 'border-blue-100 dark:border-blue-900/30',
  },
  '52w_low': {
    icon: <TrendingDown size={13} />,
    color: 'text-amber-600',
    bg: 'bg-amber-50 dark:bg-amber-950/20',
    border: 'border-amber-100 dark:border-amber-900/30',
  },
  fd_maturity: {
    icon: <Landmark size={13} />,
    color: 'text-indigo-600',
    bg: 'bg-indigo-50 dark:bg-indigo-950/20',
    border: 'border-indigo-100 dark:border-indigo-900/30',
  },
  insurance_renewal: {
    icon: <Shield size={13} />,
    color: 'text-rose-600',
    bg: 'bg-rose-50 dark:bg-rose-950/20',
    border: 'border-rose-100 dark:border-rose-900/30',
  },
  portfolio_swing: {
    icon: <Activity size={13} />,
    color: 'text-purple-600',
    bg: 'bg-purple-50 dark:bg-purple-950/20',
    border: 'border-purple-100 dark:border-purple-900/30',
  },
};

function Header({
  totalCurrentValue,
  totalPnL,
  totalPnLPercent,
  status,
  lastUpdated,
  onRefresh,
  portfolios,
  onImportCSV,
  portfolioOptions,
  alerts,
  onDismissAlert,
  onDismissAll,
  darkMode,
  onToggleDarkMode,
  activePortfolioLabel = 'Family',
  isPriceStale = false,
  isUsingCachedData = false,
}: HeaderProps) {
  const isGain = totalPnL >= 0;
  const isLoading = status === 'loading';
  const [openAlerts, setOpenAlerts] = useState(false);
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const visibleAlerts = alerts;

  return (
    <header className="sticky top-0 z-40 bg-white/80 dark:bg-black/75 backdrop-blur-md border-b border-[var(--border-subtle)] text-[var(--text-primary)] transition-colors">
      <div className="max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          
          {/* Left: App Logo & Selected Context */}
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-[10px] bg-[#007aff] flex items-center justify-center shadow-sm">
              <TrendingUp size={15} className="text-white" />
            </div>
            <div className="flex flex-col sm:flex-row sm:items-baseline sm:gap-1.5">
              <span className="text-sm font-semibold tracking-tight">Family Portfolio</span>
              {activePortfolioLabel && (
                <span className="text-[11px] text-[var(--text-secondary)] font-normal hidden sm:inline">
                  • {activePortfolioLabel}
                </span>
              )}
            </div>
          </div>

          {/* Right: Net Worth Summary & Utility Buttons */}
          <div className="flex items-center gap-3">
            
            {/* Value Indicators (Neutral Net Worth, subtle colored P&L) */}
            <div className="flex items-center gap-2.5 text-right">
              <div className="flex flex-col">
                <span className="text-xs font-semibold tnum leading-tight">
                  {formatINR(totalCurrentValue)}
                </span>
                <span className="text-[10px] text-[var(--text-secondary)] leading-none mt-0.5">
                  Net Worth
                </span>
              </div>
              <Badge variant={isGain ? 'positive' : 'negative'} className="text-[10px] py-0">
                {formatPercent(totalPnLPercent, 1)}
              </Badge>
            </div>

            <div className="h-4 w-px bg-[var(--border-subtle)]" />

            {/* Compact Action Icons */}
            <div className="flex items-center gap-1.5">
              {/* Status Pill Badge */}
              <button
                onClick={onRefresh}
                title={
                  !isOnline
                    ? 'Offline mode. Connect to the internet to sync.'
                    : isUsingCachedData
                    ? 'Displaying cached portfolio data.'
                    : isLoading
                    ? 'Syncing live market prices...'
                    : isPriceStale || status === 'error'
                    ? 'Prices may be outdated (>15m). Click to refresh.'
                    : `Prices live & up to date.${lastUpdated ? ` Last synced at ${lastUpdated.toLocaleTimeString()}` : ''}`
                }
                className={`hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border transition-all ${
                  !isOnline || isUsingCachedData
                    ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-900/40'
                    : isLoading
                    ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-900/40'
                    : isPriceStale || status === 'error'
                    ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-900/40 hover:bg-amber-500/20'
                    : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/40'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    !isOnline || isUsingCachedData
                      ? 'bg-rose-500'
                      : isLoading
                      ? 'bg-blue-500 animate-pulse'
                      : isPriceStale || status === 'error'
                      ? 'bg-amber-500'
                      : 'bg-emerald-500'
                  }`}
                />
                <span>
                  {!isOnline
                    ? 'Offline'
                    : isUsingCachedData
                    ? 'Cached'
                    : isLoading
                    ? 'Syncing'
                    : isPriceStale || status === 'error'
                    ? 'Stale'
                    : 'Live'}
                </span>
              </button>

              {/* Sync Status / Refresh button */}
              <IconButton
                icon={<RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} />}
                title={isLoading ? 'Fetching prices...' : lastUpdated ? `Last updated: ${lastUpdated.toLocaleTimeString()}` : 'Sync prices'}
                onClick={onRefresh}
                disabled={isLoading}
              />

              <Suspense fallback={<div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-zinc-800 animate-pulse" />}>
                <ExportPanel
                  portfolios={portfolios}
                  onImportCSV={onImportCSV}
                  portfolioOptions={portfolioOptions}
                />
              </Suspense>

              {/* Theme Toggle */}
              <IconButton
                icon={darkMode ? <Sun size={13} /> : <Moon size={13} />}
                title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
                onClick={onToggleDarkMode}
              />

              {/* Alerts bell */}
              <div className="relative">
                <IconButton
                  icon={<Bell size={13} />}
                  title={`Notifications (${visibleAlerts.length})`}
                  onClick={() => setOpenAlerts(!openAlerts)}
                  className={openAlerts ? 'bg-[#f2f2f7] dark:bg-zinc-800' : ''}
                />
                {visibleAlerts.length > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-[#ff3b30] rounded-full" />
                )}

                {openAlerts && (
                  <div
                    role="region"
                    aria-label="Notifications panel"
                    className="fixed left-4 right-4 top-16 bg-white dark:bg-[#1c1c1e] border border-[var(--border-subtle)] rounded-2xl shadow-floating z-50 overflow-hidden sm:absolute sm:left-auto sm:right-0 sm:top-full sm:mt-2 sm:w-80"
                  >
                    <div className="px-3.5 py-2.5 bg-slate-50 dark:bg-zinc-800/40 border-b border-[var(--border-subtle)] flex items-center justify-between">
                      <span className="text-[11px] font-bold text-[var(--text-primary)] uppercase tracking-wider">
                        Alerts ({visibleAlerts.length})
                      </span>
                      {visibleAlerts.length > 1 && (
                        <button
                          onClick={onDismissAll}
                          className="text-[10px] font-semibold text-[#007aff] hover:underline"
                        >
                          Dismiss all
                        </button>
                      )}
                    </div>

                    <div className="max-h-64 overflow-y-auto divide-y divide-[var(--border-subtle)]">
                      {visibleAlerts.length === 0 ? (
                        <div className="p-5 text-center text-[var(--text-secondary)]">
                          <Check size={16} className="mx-auto text-[#34C759] mb-1.5" />
                          <p className="text-xs font-semibold text-[var(--text-primary)]">All caught up!</p>
                        </div>
                      ) : (
                        visibleAlerts.map((alert) => {
                          const config = ALERTS_TYPE_CONFIG[alert.type] || {
                            icon: <Bell size={12} />,
                            color: 'text-[var(--text-secondary)]',
                            bg: 'bg-slate-50 dark:bg-zinc-850',
                            border: 'border-slate-200 dark:border-zinc-800',
                          };

                          return (
                            <div key={alert.id} className="p-3 hover:bg-slate-50/50 dark:hover:bg-zinc-800/40 transition-colors flex items-start gap-2">
                              <span className={`shrink-0 p-1 rounded-md border ${config.bg} ${config.border} ${config.color} mt-0.5`}>
                                {config.icon}
                              </span>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <p className="text-xs font-semibold text-[var(--text-primary)] truncate">{alert.title}</p>
                                  {alert.severity === 'critical' && (
                                    <span className="text-[9px] bg-[#fff0ef] text-[#ff3b30] px-1 rounded font-bold uppercase">
                                      {alert.severity}
                                    </span>
                                  )}
                                </div>
                                <p className="text-[11px] text-[var(--text-secondary)] mt-0.5 leading-snug">{alert.message}</p>
                                {alert.portfolioLabel && (
                                  <p className="text-[9px] text-[var(--text-tertiary)] mt-0.5">Portfolio: {alert.portfolioLabel}</p>
                                )}
                              </div>
                              <button
                                onClick={() => onDismissAlert(alert.id)}
                                className="shrink-0 p-0.5 rounded hover:bg-slate-100 dark:hover:bg-zinc-800 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors"
                              >
                                <X size={11} />
                              </button>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>
    </header>
  );
}

export default React.memo(Header);
