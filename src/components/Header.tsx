import React, { useState } from 'react';
import { TrendingUp, RefreshCw, Bell, X, TrendingDown, Landmark, Shield, Activity, Check, Sun, Moon } from 'lucide-react';
import { formatINR, formatPercent } from '../utils/formatters';
import { FetchStatus } from '../hooks/useMarketData';
import { Portfolio } from '../types/portfolio';
import ExportPanel, { ImportRow } from './ExportPanel';
import { Alert } from '../hooks/useAlerts';

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
  darkMode: boolean;
  onToggleDarkMode: () => void;
}

const ALERTS_TYPE_CONFIG: Record<string, { icon: React.ReactNode; color: string; bg: string; border: string }> = {
  '52w_high': {
    icon: <TrendingUp size={13} />,
    color: 'text-blue-700 dark:text-blue-400',
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    border: 'border-blue-200 dark:border-blue-800',
  },
  '52w_low': {
    icon: <TrendingDown size={13} />,
    color: 'text-amber-700 dark:text-amber-400',
    bg: 'bg-amber-50 dark:bg-amber-900/20',
    border: 'border-amber-200 dark:border-amber-800',
  },
  fd_maturity: {
    icon: <Landmark size={13} />,
    color: 'text-indigo-700 dark:text-indigo-400',
    bg: 'bg-indigo-50 dark:bg-indigo-900/20',
    border: 'border-indigo-200 dark:border-indigo-800',
  },
  insurance_renewal: {
    icon: <Shield size={13} />,
    color: 'text-rose-700 dark:text-rose-400',
    bg: 'bg-rose-50 dark:bg-rose-900/20',
    border: 'border-rose-200 dark:border-rose-800',
  },
  portfolio_swing: {
    icon: <Activity size={13} />,
    color: 'text-violet-700 dark:text-violet-400',
    bg: 'bg-violet-50 dark:bg-violet-900/20',
    border: 'border-violet-200 dark:border-violet-800',
  },
};

const SEVERITY_BADGE: Record<string, string> = {
  critical: 'bg-red-500 text-white',
  warning: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',
  info: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
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
  darkMode,
  onToggleDarkMode,
}: HeaderProps) {
  const isGain = totalPnL >= 0;
  const isLoading = status === 'loading';
  const [openAlerts, setOpenAlerts] = useState(false);

  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(() => {
    try {
      const saved = sessionStorage.getItem('finance_dismissed_alerts');
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch {
      return new Set();
    }
  });

  const saveDismissed = (newSet: Set<string>) => {
    setDismissedAlerts(newSet);
    try {
      sessionStorage.setItem('finance_dismissed_alerts', JSON.stringify(Array.from(newSet)));
    } catch { /* ignore */ }
  };

  const handleDismissAlert = (id: string) => {
    const next = new Set(dismissedAlerts);
    next.add(id);
    saveDismissed(next);
  };

  const handleDismissAll = () => {
    const next = new Set(dismissedAlerts);
    alerts.forEach((a) => next.add(a.id));
    saveDismissed(next);
  };

  const visibleAlerts = alerts.filter((a) => !dismissedAlerts.has(a.id));

  return (
    <header className="bg-slate-900 text-white relative z-40">
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
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Stats (Desktop Only) */}
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
            </div>

            {/* Actions (Mobile & Desktop) */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              <button
                onClick={onRefresh}
                disabled={isLoading}
                aria-label={isLoading ? 'Fetching live prices' : 'Refresh live prices'}
                className="flex items-center justify-center w-8 h-8 sm:w-auto sm:px-3 sm:py-1.5 text-xs text-slate-400 hover:text-blue-400 transition-colors border border-slate-700 rounded-lg disabled:opacity-40"
                title={isLoading ? 'Fetching...' : lastUpdated ? lastUpdated.toLocaleTimeString('en-IN') : 'Fetch live prices'}
              >
                <RefreshCw size={12} className={isLoading ? 'animate-spin' : ''} />
                <span className="hidden sm:inline sm:ml-1.5">
                  {isLoading ? 'Fetching...' : lastUpdated ? lastUpdated.toLocaleTimeString('en-IN') : 'Fetch live prices'}
                </span>
              </button>
              <ExportPanel
                portfolios={portfolios}
                onImportCSV={onImportCSV}
                portfolioOptions={portfolioOptions}
              />

              {/* Dark Mode Toggle */}
              <button
                onClick={onToggleDarkMode}
                aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
                className="flex items-center justify-center w-8 h-8 rounded-lg text-slate-400 hover:text-blue-400 transition-colors border border-slate-700 hover:border-slate-600"
                title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
              >
                {darkMode ? <Sun size={14} /> : <Moon size={14} />}
              </button>

              {/* Alerts Bell Popover */}
              <div className="relative">
                <button
                  onClick={() => setOpenAlerts(!openAlerts)}
                  aria-expanded={openAlerts}
                  aria-haspopup="true"
                  aria-label={`Notifications${visibleAlerts.length > 0 ? `, ${visibleAlerts.length} active` : ''}`}
                  className="flex items-center justify-center w-8 h-8 rounded-lg text-slate-400 hover:text-blue-400 transition-colors border border-slate-700 hover:border-slate-600 relative"
                  title="Notifications"
                >
                  <Bell size={14} />
                  {visibleAlerts.length > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center animate-pulse">
                      {visibleAlerts.length}
                    </span>
                  )}
                </button>

              {openAlerts && (
                <div
                  role="region"
                  aria-label="Notifications panel"
                  className="fixed left-3 right-3 top-16 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-50 overflow-hidden sm:absolute sm:left-auto sm:right-0 sm:top-full sm:mt-2 sm:w-96"
                >
                  <div className="px-4 py-3 bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">
                      Active Alerts ({visibleAlerts.length})
                    </span>
                    {visibleAlerts.length > 1 && (
                      <button
                        onClick={handleDismissAll}
                        className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                      >
                        Dismiss all
                      </button>
                    )}
                  </div>

                  <div className="max-h-[300px] overflow-y-auto divide-y divide-slate-100 dark:divide-slate-700">
                    {visibleAlerts.length === 0 ? (
                      <div className="px-4 py-8 text-center text-slate-400 dark:text-slate-500">
                        <Check size={20} className="mx-auto text-emerald-500 mb-2" />
                        <p className="text-xs font-semibold">All caught up!</p>
                        <p className="text-[10px] mt-0.5">No active portfolio alerts.</p>
                      </div>
                    ) : (
                      visibleAlerts.map((alert) => {
                        const config = ALERTS_TYPE_CONFIG[alert.type] || {
                          icon: <Bell size={13} />,
                          color: 'text-slate-600 dark:text-slate-300',
                          bg: 'bg-slate-50 dark:bg-slate-900',
                          border: 'border-slate-200 dark:border-slate-700',
                        };

                        return (
                          <div key={alert.id} className="p-3 hover:bg-slate-50/50 dark:hover:bg-slate-700/50 transition-colors flex items-start gap-2.5">
                            <span className={`shrink-0 p-1.5 rounded-lg border ${config.bg} ${config.border} ${config.color} mt-0.5`}>
                              {config.icon}
                            </span>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <p className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate">{alert.title}</p>
                                <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${SEVERITY_BADGE[alert.severity]}`}>
                                  {alert.severity}
                                </span>
                              </div>
                              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">{alert.message}</p>
                              {alert.portfolioLabel && (
                                <p className="text-[9px] text-slate-400 dark:text-slate-500 mt-0.5 font-medium">Portfolio: {alert.portfolioLabel}</p>
                              )}
                            </div>
                            <button
                              onClick={() => handleDismissAlert(alert.id)}
                              aria-label={`Dismiss alert: ${alert.title}`}
                              className="shrink-0 p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                            >
                              <X size={12} />
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
