import React, { useState } from 'react';
import { X, TrendingUp, TrendingDown, Landmark, Shield, Activity, FileText, Bell, AlertTriangle, CheckCircle2 } from './icons/AppIcons';
import { Alert, AlertType, AlertSeverity } from '../hooks/useAlerts';

interface MobileAlertsViewProps {
  alerts: Alert[];
  onClose: () => void;
  onDismissAlert: (id: string) => void;
  onDismissAll: () => void;
}

type FilterTab = 'all' | 'due_soon' | 'stocks' | 'insurance' | 'documents';

const TYPE_CONFIG: Record<AlertType, { icon: React.ReactNode; color: string; bg: string; border: string }> = {
  '52w_high': {
    icon: <TrendingUp size={16} />,
    color: 'text-blue-700 dark:text-blue-400',
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    border: 'border-blue-200 dark:border-blue-800',
  },
  '52w_low': {
    icon: <TrendingDown size={16} />,
    color: 'text-amber-700 dark:text-amber-400',
    bg: 'bg-amber-50 dark:bg-amber-900/20',
    border: 'border-amber-200 dark:border-amber-800',
  },
  fd_maturity: {
    icon: <Landmark size={16} />,
    color: 'text-indigo-700 dark:text-indigo-400',
    bg: 'bg-indigo-50 dark:bg-indigo-900/20',
    border: 'border-indigo-200 dark:border-indigo-800',
  },
  insurance_renewal: {
    icon: <Shield size={16} />,
    color: 'text-rose-700 dark:text-rose-400',
    bg: 'bg-rose-50 dark:bg-rose-900/20',
    border: 'border-rose-200 dark:border-rose-800',
  },
  portfolio_swing: {
    icon: <Activity size={16} />,
    color: 'text-violet-700 dark:text-violet-400',
    bg: 'bg-violet-50 dark:bg-violet-900/20',
    border: 'border-violet-200 dark:border-violet-800',
  },
  document_expiry: {
    icon: <FileText size={16} />,
    color: 'text-slate-700 dark:text-slate-300',
    bg: 'bg-slate-50 dark:bg-slate-800/40',
    border: 'border-slate-200 dark:border-slate-700',
  },
};

const SEVERITY_STYLES: Record<AlertSeverity, { bg: string; text: string }> = {
  critical: { bg: 'bg-red-500 text-white', text: 'text-red-500' },
  warning: { bg: 'bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400', text: 'text-amber-500' },
  info: { bg: 'bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400', text: 'text-blue-500' },
};

export default function MobileAlertsView({ alerts, onClose, onDismissAlert, onDismissAll }: MobileAlertsViewProps) {
  const [activeTab, setActiveTab] = useState<FilterTab>('all');

  const tabs: { key: FilterTab; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'due_soon', label: 'Due Soon' },
    { key: 'stocks', label: 'Stocks' },
    { key: 'insurance', label: 'Insurance' },
    { key: 'documents', label: 'Documents' },
  ];

  const filteredAlerts = alerts.filter((alert) => {
    switch (activeTab) {
      case 'due_soon':
        return alert.type === 'fd_maturity' || alert.type === 'insurance_renewal' || alert.type === 'document_expiry';
      case 'stocks':
        return alert.type === '52w_high' || alert.type === '52w_low';
      case 'insurance':
        return alert.type === 'insurance_renewal';
      case 'documents':
        return alert.type === 'document_expiry';
      case 'all':
      default:
        return true;
    }
  });

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Active Portfolio Alerts"
      className="fixed inset-0 bg-black/50 z-50 flex flex-col md:hidden"
    >
      <div className="flex-1 mt-12 bg-white dark:bg-slate-900 rounded-t-xl flex flex-col shadow-xl overflow-hidden pb-safe">
        {/* Header */}
        <div className="px-4 py-3.5 border-b border-[var(--border-subtle)] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Bell size={16} />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-[var(--text-primary)]">Active Alerts</h2>
              <p className="text-xs text-[var(--text-tertiary)] mt-0.5">{alerts.length} action items require attention</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-11 h-11 flex items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors"
            aria-label="Close Alerts"
          >
            <X size={16} />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="px-3 py-2 border-b border-[var(--border-subtle)] flex gap-1.5 overflow-x-auto scrollbar-none shrink-0">
          {tabs.map((tab) => {
            const count = alerts.filter((a) => {
              if (tab.key === 'due_soon') return a.type === 'fd_maturity' || a.type === 'insurance_renewal' || a.type === 'document_expiry';
              if (tab.key === 'stocks') return a.type === '52w_high' || a.type === '52w_low';
              if (tab.key === 'insurance') return a.type === 'insurance_renewal';
              if (tab.key === 'documents') return a.type === 'document_expiry';
              return true;
            }).length;

            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 min-h-[36px] rounded-md text-xs font-bold transition-all shrink-0 ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                }`}
              >
                <span>{tab.label}</span>
                {count > 0 && (
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                    isActive ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                  }`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Alerts Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {filteredAlerts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-3">
                <CheckCircle2 size={24} />
              </div>
              <h3 className="text-sm font-extrabold text-[var(--text-primary)] mb-1">All Clear!</h3>
              <p className="text-xs text-[var(--text-tertiary)] max-w-[220px]">
                No active notifications in this category. You're completely up to date.
              </p>
            </div>
          ) : (
            filteredAlerts.map((alert) => {
              const cfg = TYPE_CONFIG[alert.type] || {
                icon: <AlertTriangle size={16} />,
                color: 'text-slate-700',
                bg: 'bg-slate-50',
                border: 'border-slate-200',
              };
              const severity = SEVERITY_STYLES[alert.severity];

              return (
                <div
                  key={alert.id}
                  className={`flex flex-col rounded-xl border p-3.5 shadow-xs relative transition-all ${cfg.bg} ${cfg.border} ${cfg.color}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex gap-3">
                      <div className="mt-0.5 w-7 h-7 rounded-md bg-white/80 dark:bg-slate-900/50 flex items-center justify-center shadow-xs shrink-0">
                        {cfg.icon}
                      </div>
                      <div>
                        <p className="text-xs font-extrabold leading-tight text-[var(--text-primary)]">{alert.title}</p>
                        <p className="text-xs font-medium opacity-90 mt-1">{alert.message}</p>
                        {alert.portfolioLabel && (
                          <span className="inline-block mt-2 text-[10px] font-bold uppercase bg-white/80 dark:bg-slate-900/60 px-2 py-0.5 rounded">
                            Member: {alert.portfolioLabel}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${severity.bg}`}>
                        {alert.severity}
                      </span>
                      <button
                        onClick={() => onDismissAlert(alert.id)}
                        aria-label="Dismiss Alert"
                        className="w-8 h-8 rounded-lg bg-white/60 dark:bg-slate-900/40 flex items-center justify-center hover:bg-white dark:hover:bg-slate-900 text-slate-400 hover:text-slate-700 transition-colors"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer actions */}
        {alerts.length > 0 && (
          <div className="p-3.5 border-t border-[var(--border-subtle)] bg-[var(--surface)] flex gap-3">
            <button
              onClick={onDismissAll}
              className="flex-1 py-2.5 text-xs font-bold text-center bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg transition-all"
            >
              Clear All ({alerts.length})
            </button>
            <button
              onClick={onClose}
              className="flex-1 py-2.5 text-xs font-bold text-center bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all shadow-xs"
            >
              Back to Dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
