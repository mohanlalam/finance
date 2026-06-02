import React, { useState } from 'react';
import { X, TrendingUp, TrendingDown, Landmark, Shield, Activity, FileText, Bell, AlertTriangle, CheckCircle2 } from 'lucide-react';
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
    color: 'text-slate-755 dark:text-slate-350',
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
    <div className="fixed inset-0 bg-slate-900/50 dark:bg-slate-950/80 backdrop-blur-sm z-50 flex flex-col md:hidden animate-fade-in">
      <div className="flex-1 mt-12 bg-white dark:bg-slate-900 rounded-t-3xl flex flex-col shadow-2xl overflow-hidden animate-slide-up pb-safe">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Bell size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800 dark:text-slate-150">Active Alerts</h2>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">{alerts.length} action items require attention</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-750 flex items-center justify-center text-slate-400 dark:text-slate-300 transition-colors"
            aria-label="Close Alerts"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="px-4 py-2 border-b border-slate-50 dark:border-slate-800/50 flex gap-1 overflow-x-auto scrollbar-none shrink-0">
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
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                }`}
              >
                <span>{tab.label}</span>
                {count > 0 && (
                  <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-md ${
                    isActive ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600 dark:bg-slate-750 dark:text-slate-300'
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
              <div className="w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 text-emerald-500 dark:text-emerald-400 flex items-center justify-center mb-4">
                <CheckCircle2 size={32} />
              </div>
              <h3 className="text-sm font-bold text-slate-700 dark:text-slate-250 mb-1">All Clear!</h3>
              <p className="text-xs text-slate-400 dark:text-slate-500 max-w-[200px]">
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
                  className={`flex flex-col rounded-2xl border p-4 shadow-xs relative transition-all active:scale-[0.99] ${cfg.bg} ${cfg.border} ${cfg.color}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex gap-3">
                      <div className="mt-0.5 w-7 h-7 rounded-lg bg-white/80 dark:bg-slate-900/50 flex items-center justify-center shadow-2xs shrink-0">
                        {cfg.icon}
                      </div>
                      <div>
                        <p className="text-xs font-extrabold leading-tight text-slate-800 dark:text-slate-200">{alert.title}</p>
                        <p className="text-[11px] font-medium opacity-80 mt-1">{alert.message}</p>
                        {alert.portfolioLabel && (
                          <span className="inline-block mt-2 text-[9px] font-extrabold uppercase bg-white/70 dark:bg-slate-900/40 px-2 py-0.5 rounded-md">
                            Portfolio: {alert.portfolioLabel}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <span className={`text-[8px] font-extrabold uppercase px-2 py-0.5 rounded-full ${severity.bg}`}>
                        {alert.severity}
                      </span>
                      <button
                        onClick={() => onDismissAlert(alert.id)}
                        aria-label="Dismiss Alert"
                        className="w-7 h-7 rounded-lg bg-white/40 dark:bg-slate-900/20 flex items-center justify-center hover:bg-white/80 dark:hover:bg-slate-900/50 text-slate-400 hover:text-slate-600 transition-colors"
                      >
                        <X size={13} />
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
          <div className="p-4 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/30 flex gap-3">
            <button
              onClick={onDismissAll}
              className="flex-1 py-3 text-xs font-bold text-center bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 rounded-xl transition-all"
            >
              Clear All ({alerts.length})
            </button>
            <button
              onClick={onClose}
              className="flex-1 py-3 text-xs font-bold text-center bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all shadow-xs"
            >
              Back to Dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
