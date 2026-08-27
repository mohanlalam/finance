import React, { useState, useEffect, useRef, Suspense } from 'react';
import { TrendingUp, RefreshCw, Bell, X, Landmark, Shield, Activity, Sun, Moon, LockKeyhole, Eye, EyeOff, FileText, CheckCircle2, MoreHorizontal } from './icons/AppIcons';
import { FetchStatus } from '../types/portfolio';
import { Portfolio } from '../types/portfolio';
import type { ImportRow } from './ExportPanel';
import { Alert } from '../hooks/useAlerts';
import { IconButton } from './ui/IconButton';
import { useIsMobile } from '../hooks/useIsMobile';

import { usePrivacy } from '../contexts/PrivacyContext';

const ExportPanel = React.lazy(() => import('./ExportPanel'));

interface HeaderProps {
  totalCurrentValue?: number;
  totalPnL?: number;
  totalPnLPercent?: number;
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
  onOpenSmartImport?: () => void;
  onOpenMobileAlerts?: () => void;
}

const ALERTS_TYPE_CONFIG: Record<string, { icon: React.ReactNode; color: string; bg: string; border: string }> = {
  fd_maturity: {
    icon: <Landmark size={14} />,
    color: 'text-[var(--text-primary)]',
    bg: 'bg-[var(--surface-secondary)]',
    border: 'border-[var(--border-subtle)]',
  },
  rd_maturity: {
    icon: <Landmark size={14} />,
    color: 'text-[var(--accent-blue)]',
    bg: 'bg-[var(--accent-blue-soft)]',
    border: 'border-[var(--accent-blue)]/30',
  },
  insurance_renewal: {
    icon: <Shield size={14} />,
    color: 'text-[var(--negative)]',
    bg: 'bg-[var(--negative-soft)]',
    border: 'border-[var(--negative)]/30',
  },
  portfolio_swing: {
    icon: <Activity size={14} />,
    color: 'text-[var(--accent-blue)]',
    bg: 'bg-[var(--accent-blue-soft)]',
    border: 'border-[var(--border-subtle)]',
  },
  document_expiry: {
    icon: <FileText size={14} />,
    color: 'text-[var(--text-secondary)]',
    bg: 'bg-[var(--surface-secondary)]',
    border: 'border-[var(--border-subtle)]',
  },
};

function Header({
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
  onChangePinClick,
  onOpenMobileAlerts,
}: HeaderProps) {
  const isLoading = status === 'loading';
  const [openAlerts, setOpenAlerts] = useState(false);
  const [openMobileMenu, setOpenMobileMenu] = useState(false);
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const { toggleHideBalances, isBalancesHidden } = usePrivacy();
  const isMobile = useIsMobile();
  const mobileMenuRef = useRef<HTMLDivElement>(null);

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

  // Close alerts on Escape key
  useEffect(() => {
    if (!openAlerts) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpenAlerts(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [openAlerts]);

  // Close mobile menu on Escape
  useEffect(() => {
    if (!openMobileMenu) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpenMobileMenu(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [openMobileMenu]);

  const visibleAlerts = alerts;

  const handleAlertsClick = () => {
    if (isMobile && onOpenMobileAlerts) {
      onOpenMobileAlerts();
    } else {
      setOpenAlerts((prev) => !prev);
    }
  };

  return (
    <header className="sticky top-0 z-[var(--z-header)] bg-[var(--surface-header)] backdrop-blur-md border-b border-[var(--border-subtle)] transition-colors pt-[env(safe-area-inset-top,0px)]">
      <div className="max-w-[1720px] mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16 gap-2">

          {/* Logo & title */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-[var(--radius-medium)] bg-[var(--accent-blue)] flex items-center justify-center text-white shadow-sm ring-1 ring-[var(--border-subtle)] shrink-0">
              <TrendingUp size={16} className="sm:w-[18px] sm:h-[18px]" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-sm sm:text-base font-bold text-[var(--text-primary)] tracking-tight leading-none truncate">
                  Portfolio Tracker
                </h1>
                {activePortfolioLabel && (
                  <span className="hidden sm:inline text-label-micro font-semibold px-2 py-0.5 rounded-[var(--radius-small)] bg-[var(--surface-secondary)] text-[var(--text-secondary)] border border-[var(--border-subtle)]">
                    {activePortfolioLabel}
                  </span>
                )}
              </div>
              <p className="text-label-micro text-[var(--text-tertiary)] flex items-center gap-1.5 mt-0.5">
                <span className="flex items-center gap-1">
                  <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-[var(--positive)]' : 'bg-[var(--negative)]'}`} />
                  {isOnline ? 'Online' : 'Offline'}
                </span>
              </p>
            </div>
          </div>

          {/* Action buttons — right side */}
          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">

            {/* Sync / Refresh — always visible */}
            <IconButton
              icon={<RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />}
              title={isLoading ? 'Fetching prices...' : lastUpdated ? `Last updated: ${lastUpdated.toLocaleTimeString()}` : 'Sync prices'}
              onClick={onRefresh}
              disabled={isLoading}
            />

            {/* Export Panel — desktop only */}
            <div className="hidden sm:block">
              <Suspense fallback={<div className="w-8 h-8 rounded-[var(--radius-medium)] bg-[var(--surface-secondary)] animate-pulse" />}>
                <ExportPanel
                  portfolios={portfolios}
                  onImportCSV={onImportCSV}
                  portfolioOptions={portfolioOptions}
                />
              </Suspense>
            </div>

            {/* ── Desktop: individual icon buttons ── */}
            <div className="hidden sm:flex items-center gap-1.5">
              {onChangePinClick && (
                <IconButton
                  icon={<LockKeyhole size={14} />}
                  title="Change PIN"
                  onClick={onChangePinClick}
                />
              )}
              <IconButton
                icon={isBalancesHidden ? <EyeOff size={14} /> : <Eye size={14} />}
                title={isBalancesHidden ? 'Show Balances' : 'Hide Balances'}
                onClick={toggleHideBalances}
              />
              <IconButton
                icon={darkMode ? <Sun size={14} /> : <Moon size={14} />}
                title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
                onClick={onToggleDarkMode}
              />
            </div>

            {/* ── Mobile: ⋯ overflow popup ── */}
            {isMobile && (
              <div className="relative sm:hidden" ref={mobileMenuRef}>
                <IconButton
                  icon={<MoreHorizontal size={14} />}
                  title="More options"
                  onClick={() => setOpenMobileMenu((prev) => !prev)}
                  className={openMobileMenu ? 'bg-[var(--surface-secondary)] text-[var(--accent-blue)]' : ''}
                />

                {openMobileMenu && (
                  <>
                    {/* Tap-outside backdrop */}
                    <div
                      className="fixed inset-0 z-[var(--z-overlay)]"
                      onClick={() => setOpenMobileMenu(false)}
                      aria-hidden="true"
                    />

                    {/* Dropdown panel */}
                    <div
                      role="menu"
                      aria-label="More options"
                      className="absolute right-0 top-full mt-2 w-52 bg-[var(--surface)] border border-[var(--border-subtle)] rounded-[var(--radius-large)] shadow-[var(--shadow-floating)] z-[var(--z-modal)] overflow-hidden animate-in fade-in zoom-in-95 duration-150 origin-top-right"
                    >
                      {/* Change PIN */}
                      {onChangePinClick && (
                        <button
                          type="button"
                          role="menuitem"
                          onClick={() => { setOpenMobileMenu(false); onChangePinClick(); }}
                          className="w-full flex items-center gap-3 px-4 py-3 text-sm text-[var(--text-primary)] hover:bg-[var(--surface-secondary)] active:bg-[var(--surface-secondary)] transition-colors cursor-pointer border-b border-[var(--border-subtle)]"
                        >
                          <span className="w-7 h-7 rounded-[var(--radius-small)] bg-[var(--surface-secondary)] flex items-center justify-center shrink-0">
                            <LockKeyhole size={14} className="text-[var(--text-secondary)]" />
                          </span>
                          <span className="font-medium">Change PIN</span>
                        </button>
                      )}

                      {/* Privacy toggle */}
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => { setOpenMobileMenu(false); toggleHideBalances(); }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm text-[var(--text-primary)] hover:bg-[var(--surface-secondary)] active:bg-[var(--surface-secondary)] transition-colors cursor-pointer border-b border-[var(--border-subtle)]"
                      >
                        <span className="w-7 h-7 rounded-[var(--radius-small)] bg-[var(--surface-secondary)] flex items-center justify-center shrink-0">
                          {isBalancesHidden
                            ? <EyeOff size={14} className="text-[var(--text-secondary)]" />
                            : <Eye size={14} className="text-[var(--text-secondary)]" />}
                        </span>
                        <span className="font-medium">{isBalancesHidden ? 'Show Balances' : 'Hide Balances'}</span>
                      </button>

                      {/* Theme toggle */}
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => { setOpenMobileMenu(false); onToggleDarkMode(); }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm text-[var(--text-primary)] hover:bg-[var(--surface-secondary)] active:bg-[var(--surface-secondary)] transition-colors cursor-pointer"
                      >
                        <span className="w-7 h-7 rounded-[var(--radius-small)] bg-[var(--surface-secondary)] flex items-center justify-center shrink-0">
                          {darkMode
                            ? <Sun size={14} className="text-[var(--text-secondary)]" />
                            : <Moon size={14} className="text-[var(--text-secondary)]" />}
                        </span>
                        <span className="font-medium">{darkMode ? 'Light Mode' : 'Dark Mode'}</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Alerts Bell — always visible */}
            <div className="relative">
              <IconButton
                icon={<Bell size={14} />}
                title={`Notifications (${visibleAlerts.length})`}
                onClick={handleAlertsClick}
                className={openAlerts ? 'bg-[var(--surface-secondary)] text-[var(--accent-blue)]' : ''}
              />
              {visibleAlerts.length > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-[var(--negative)] rounded-full ring-2 ring-[var(--surface)]" />
              )}

              {openAlerts && !isMobile && (
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
                    className="absolute right-0 top-full mt-2 w-96 max-w-[calc(100vw-2rem)] bg-[var(--surface)] border border-[var(--border-subtle)] rounded-[var(--radius-large)] shadow-[var(--shadow-floating)] z-[var(--z-modal)] overflow-hidden animate-in fade-in zoom-in-95 duration-150"
                  >
                    {/* Panel header */}
                    <div className="px-4 py-3 bg-[var(--surface-secondary)] border-b border-[var(--border-subtle)] flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider">
                          Notifications
                        </span>
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-[var(--accent-blue-soft)] text-[var(--accent-blue)]">
                          {visibleAlerts.length}
                        </span>
                      </div>
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

                    {/* Alerts list */}
                    <div className="max-h-[380px] overflow-y-auto divide-y divide-[var(--border-subtle)]">
                      {visibleAlerts.length === 0 ? (
                        <div className="py-8 px-4 text-center flex flex-col items-center justify-center gap-2">
                          <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                            <CheckCircle2 size={20} />
                          </div>
                          <span className="text-xs font-bold text-[var(--text-primary)]">All Caught Up!</span>
                          <span className="text-[11px] text-[var(--text-tertiary)] max-w-[220px]">No active notifications. You're completely up to date.</span>
                        </div>
                      ) : (
                        visibleAlerts.map((alert) => {
                          const cfg = ALERTS_TYPE_CONFIG[alert.type] ?? {
                            icon: <Bell size={14} />,
                            color: 'text-[var(--text-secondary)]',
                            bg: 'bg-[var(--surface-secondary)]',
                            border: 'border-[var(--border-subtle)]',
                          };
                          return (
                            <div
                              key={alert.id}
                              className="p-3.5 hover:bg-[var(--surface-secondary)] transition-colors flex items-start gap-3 group"
                            >
                              <div className={`p-1.5 rounded-[var(--radius-small)] ${cfg.bg} ${cfg.color} shrink-0 mt-0.5 border ${cfg.border}`}>
                                {cfg.icon}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <p className="text-xs font-bold text-[var(--text-primary)] leading-tight">{alert.title}</p>
                                  {alert.portfolioLabel && (
                                    <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-[var(--surface-secondary)] text-[var(--text-tertiary)] border border-[var(--border-subtle)]">
                                      {alert.portfolioLabel}
                                    </span>
                                  )}
                                </div>
                                <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed mt-1">{alert.message}</p>
                              </div>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onDismissAlert(alert.id);
                                }}
                                className="w-6 h-6 flex items-center justify-center rounded-[var(--radius-small)] text-[var(--text-tertiary)] hover:text-[var(--negative)] hover:bg-[var(--surface)] transition-colors cursor-pointer shrink-0 opacity-70 group-hover:opacity-100"
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
    </header>
  );
}

export default React.memo(Header);
