import React, { useState, useEffect, Suspense } from 'react';
import { TrendingUp, RefreshCw, Bell, X, TrendingDown, Landmark, Shield, Activity, Sun, Moon, LockKeyhole, Eye, EyeOff, Users, Clock } from './icons/AppIcons';
import { formatINR, formatPercent } from '../utils/formatters';
import { FetchStatus } from '../types/portfolio';
import { Portfolio } from '../types/portfolio';
import type { ImportRow } from './ExportPanel';
import { Alert } from '../hooks/useAlerts';
import { IconButton } from './ui/IconButton';
import { Badge } from './ui/Badge';

import { usePrivacy } from '../contexts/PrivacyContext';

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
  onChangePinClick?: () => void;
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
  onChangePinClick,
}: HeaderProps) {
  const isGain = totalPnL >= 0;
  const isLoading = status === 'loading';
  const [openAlerts, setOpenAlerts] = useState(false);
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const { isBalancesHidden, toggleHideBalances } = usePrivacy();

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
    <header className="sticky top-0 z-[var(--z-sticky)] bg-[var(--surface)] border-b border-[var(--border-subtle)] text-[var(--text-primary)] transition-colors">
      <div className="max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          
          {/* Left: App Logo & Selected Context */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-[var(--radius-medium)] bg-[var(--accent-blue)] flex items-center justify-center text-white shrink-0 shadow-sm">
              <TrendingUp size={16} />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-extrabold tracking-tight text-[var(--text-primary)] truncate">
                Family Wealth
              </span>
              <span className="text-label-micro font-semibold text-[var(--text-tertiary)] leading-none truncate">
                {activePortfolioLabel || 'Portfolio Tracker'}
              </span>
            </div>
          </div>

          {/* Right: Net Worth Summary & Utility Buttons */}
          <div className="flex items-center gap-3">
            
            {/* Value Indicators (Desktop & Tablet) */}
            <div className="hidden sm:flex items-center gap-2.5 text-right">
              <div className="flex flex-col">
                <span className="text-xs font-extrabold tnum leading-tight text-[var(--text-primary)]">
                  {formatINR(totalCurrentValue)}
                </span>
                <span className="text-label-micro text-[var(--text-tertiary)] font-semibold leading-none mt-0.5">
                  Net Worth
                </span>
              </div>
              <Badge variant={isGain ? 'positive' : 'negative'} className="text-label-micro font-bold px-2 py-0.5">
                {formatPercent(totalPnLPercent, 1)}
              </Badge>
            </div>

            <div className="hidden sm:block h-4 w-px bg-[var(--border-subtle)]" />

            {/* Action Icons */}
            <div className="flex items-center gap-1">
              {/* Status Pill Badge (Desktop) */}
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
                className={`hidden md:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-label-micro font-bold border transition-all ${
                  !isOnline || isUsingCachedData
                    ? 'bg-[var(--negative-soft)] text-[var(--negative)] border-[var(--negative)]/30'
                    : isLoading
                    ? 'bg-[var(--accent-blue-soft)] text-[var(--accent-blue)] border-[var(--accent-blue)]/30'
                    : isPriceStale || status === 'error'
                    ? 'bg-[var(--warning-soft)] text-[var(--warning)] border-[var(--warning)]/30'
                    : 'bg-[var(--positive-soft)] text-[var(--positive)] border-[var(--positive)]/30'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    !isOnline || isUsingCachedData
                      ? 'bg-[var(--negative)]'
                      : isLoading
                      ? 'bg-[var(--accent-blue)] animate-pulse'
                      : isPriceStale || status === 'error'
                      ? 'bg-[var(--warning)]'
                      : 'bg-[var(--positive)]'
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
                icon={<RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />}
                title={isLoading ? 'Fetching prices...' : lastUpdated ? `Last updated: ${lastUpdated.toLocaleTimeString()}` : 'Sync prices'}
                onClick={onRefresh}
                disabled={isLoading}
              />

              {/* Export Panel (Desktop) */}
              <div className="hidden sm:block">
                <Suspense fallback={<div className="w-8 h-8 rounded-[var(--radius-medium)] bg-[var(--surface-secondary)] animate-pulse" />}>
                  <ExportPanel
                    portfolios={portfolios}
                    onImportCSV={onImportCSV}
                    portfolioOptions={portfolioOptions}
                  />
                </Suspense>
              </div>

              {/* Change PIN (Desktop) */}
              {onChangePinClick && (
                <div className="hidden sm:block">
                  <IconButton
                    icon={<LockKeyhole size={14} />}
                    title="Change PIN"
                    onClick={onChangePinClick}
                  />
                </div>
              )}

              {/* Privacy Toggle */}
              <IconButton
                icon={isBalancesHidden ? <EyeOff size={14} /> : <Eye size={14} />}
                title={isBalancesHidden ? "Show Balances" : "Hide Balances"}
                onClick={toggleHideBalances}
              />

              {/* Theme Toggle */}
              <IconButton
                icon={darkMode ? <Sun size={14} /> : <Moon size={14} />}
                title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
                onClick={onToggleDarkMode}
              />

              {/* Alerts bell */}
              <div className="relative">
                <IconButton
                  icon={<Bell size={14} />}
                  title={`Notifications (${visibleAlerts.length})`}
                  onClick={() => setOpenAlerts(!openAlerts)}
                  className={openAlerts ? 'bg-[var(--surface-secondary)]' : ''}
                />
                {visibleAlerts.length > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-[var(--negative)] rounded-full ring-2 ring-[var(--surface)]" />
                )}

                {openAlerts && (
                  <>
                    {/* Backdrop to dismiss alerts panel */}
                    <div
                      className="fixed inset-0 z-[var(--z-overlay)]"
                      onClick={() => setOpenAlerts(false)}
                      aria-hidden="true"
                    />
                    <div
                      role="region"
                      aria-label="Notifications panel"
                      className="fixed left-4 right-4 top-16 bg-[var(--surface)] border border-[var(--border-subtle)] rounded-[var(--radius-large)] shadow-[var(--shadow-floating)] z-[var(--z-modal)] overflow-hidden sm:absolute sm:left-auto sm:right-0 sm:top-full sm:mt-2 sm:w-80"
                    >
                      <div className="px-3.5 py-2.5 bg-[var(--surface-secondary)] border-b border-[var(--border-subtle)] flex items-center justify-between">
                        <span className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider">
                          Alerts ({visibleAlerts.length})
                        </span>
                        {visibleAlerts.length > 0 && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDismissAll();
                            }}
                            className="text-label-micro font-bold text-[var(--accent-blue)] hover:underline cursor-pointer"
                          >
                            Clear All
                          </button>
                        )}
                      </div>

                      <div className="max-h-72 overflow-y-auto divide-y divide-[var(--border-subtle)]">
                        {visibleAlerts.length === 0 ? (
                          <div className="p-5 text-center text-xs text-[var(--text-tertiary)] flex flex-col items-center justify-center gap-1.5">
                            <span className="font-semibold text-[var(--text-secondary)]">All Clear!</span>
                            <span>No active notifications. You're completely up to date.</span>
                          </div>
                        ) : (
                          visibleAlerts.map((alert) => {
                            const cfg = ALERTS_TYPE_CONFIG[alert.type] ?? {
                              icon: <Bell size={13} />,
                              color: 'text-[var(--text-secondary)]',
                              bg: 'bg-[var(--surface-secondary)]',
                              border: 'border-[var(--border-subtle)]',
                            };
                            return (
                              <div
                                key={alert.id}
                                className="p-3 hover:bg-[var(--surface-secondary)] transition-colors flex items-start gap-2.5"
                              >
                                <div className={`p-1 rounded-[var(--radius-small)] ${cfg.bg} ${cfg.color} shrink-0 mt-0.5`}>
                                  {cfg.icon}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-bold text-[var(--text-primary)] truncate">{alert.title}</p>
                                  <p className="text-label-micro text-[var(--text-tertiary)] line-clamp-2 mt-0.5">{alert.message}</p>
                                </div>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onDismissAlert(alert.id);
                                  }}
                                  className="w-6 h-6 flex items-center justify-center rounded-[var(--radius-small)] text-[var(--text-tertiary)] hover:text-[var(--negative)] hover:bg-[var(--surface)] transition-colors cursor-pointer"
                                  aria-label="Dismiss alert"
                                  title="Dismiss alert"
                                >
                                  <X size={12} />
                                </button>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  </>
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
