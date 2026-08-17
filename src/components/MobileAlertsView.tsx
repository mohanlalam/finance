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
    color: 'text-[var(--accent-blue)]',
    bg: 'bg-[var(--accent-blue-soft)]',
    border: 'border-[var(--accent-blue)]/30',
  },
  '52w_low': {
    icon: <TrendingDown size={16} />,
    color: 'text-[var(--warning)]',
    bg: 'bg-[var(--warning-soft)]',
    border: 'border-[var(--warning)]/30',
  },
  fd_maturity: {
    icon: <Landmark size={16} />,
    color: 'text-[var(--accent-blue)]',
    bg: 'bg-[var(--accent-blue-soft)]',
    border: 'border-[var(--accent-blue)]/30',
  },
  insurance_renewal: {
    icon: <Shield size={16} />,
    color: 'text-[var(--negative)]',
    bg: 'bg-[var(--negative-soft)]',
    border: 'border-[var(--negative)]/30',
  },
  portfolio_swing: {
    icon: <Activity size={16} />,
    color: 'text-[var(--text-secondary)]',
    bg: 'bg-[var(--surface-secondary)]',
    border: 'border-[var(--border-subtle)]',
  },
  document_expiry: {
    icon: <FileText size={16} />,
    color: 'text-[var(--text-secondary)]',
    bg: 'bg-[var(--surface-secondary)]',
    border: 'border-[var(--border-subtle)]',
  },
};

const SEVERITY_STYLES: Record<AlertSeverity, { bg: string; text: string }> = {
  critical: { bg: 'bg-[var(--negative)] text-white', text: 'text-[var(--negative)]' },
  warning: { bg: 'bg-[var(--warning-soft)] text-[var(--warning)] border border-[var(--warning)]/30', text: 'text-[var(--warning)]' },
  info: { bg: 'bg-[var(--accent-blue-soft)] text-[var(--accent-blue)] border border-[var(--accent-blue)]/30', text: 'text-[var(--accent-blue)]' },
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
      <div className="flex-1 mt-12 bg-[var(--surface)] rounded-t-2xl flex flex-col shadow-xl overflow-hidden">
        {/* Header */}
        <div className="px-4 py-3.5 border-b border-[var(--border-subtle)] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[var(--accent-blue-soft)] text-[var(--accent-blue)] flex items-center justify-center">
              <Bell size={16} />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-[var(--text-primary)]">Active Alerts</h2>
              <p className="text-xs text-[var(--text-tertiary)] mt-0.5">{alerts.length} action items require attention</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center bg-[var(--surface-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] ios-press transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="px-3 py-2 pb-3 border-b border-[var(--border-subtle)] flex gap-1.5 overflow-x-auto scrollbar-none shrink-0">
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
                className={`flex items-center gap-1.5 px-3 py-1.5 min-h-[36px] rounded-[var(--radius-small)] text-xs font-bold transition-all shrink-0 ${
                  isActive
                    ? 'bg-[var(--accent-blue)] text-white shadow-xs'
                    : 'bg-[var(--surface-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-subtle)]'
                }`}
              >
                <span>{tab.label}</span>
                {count > 0 && (
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                    isActive ? 'bg-white/20 text-white' : 'bg-[var(--surface)] text-[var(--text-secondary)] border border-[var(--border-subtle)]'
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
              <div className="w-12 h-12 rounded-xl bg-[var(--positive-soft)] text-[var(--positive)] border border-[var(--positive)]/20 flex items-center justify-center mb-3">
                <CheckCircle2 size={24} />
              </div>
              <h3 className="text-sm font-extrabold text-[var(--text-primary)] mb-1">All Clear!</h3>
              <p className="text-xs text-[var(--text-tertiary)] max-w-xs">
                No active notifications in this category. You're completely up to date.
              </p>
            </div>
          ) : (
            filteredAlerts.map((alert) => {
              const cfg = TYPE_CONFIG[alert.type] || {
                icon: <AlertTriangle size={16} />,
                color: 'text-[var(--text-secondary)]',
                bg: 'bg-[var(--surface-secondary)]',
                border: 'border-[var(--border-subtle)]',
              };
              const severity = SEVERITY_STYLES[alert.severity];

              return (
                <div
                  key={alert.id}
                  className={`flex flex-col rounded-xl border p-3.5 shadow-xs relative transition-all ${cfg.bg} ${cfg.border} ${cfg.color}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex gap-3">
                      <div className="mt-0.5 w-7 h-7 rounded-md bg-[var(--surface)] border border-[var(--border-subtle)] text-[var(--text-primary)] flex items-center justify-center shadow-xs shrink-0">
                        {cfg.icon}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-extrabold leading-tight text-[var(--text-primary)] break-words">{alert.title}</p>
                        <p className="text-xs font-medium opacity-90 mt-1 break-words">{alert.message}</p>
                        {alert.portfolioLabel && (
                          <span className="inline-block mt-2 text-[10px] font-bold uppercase bg-[var(--surface)] border border-[var(--border-subtle)] text-[var(--text-secondary)] px-2 py-0.5 rounded">
                            Member: {alert.portfolioLabel}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full whitespace-nowrap ${severity.bg}`}>
                        {alert.severity}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDismissAlert(alert.id);
                        }}
                        aria-label={`Dismiss ${alert.title}`}
                        className="w-8 h-8 rounded-lg bg-[var(--surface)]/80 hover:bg-[var(--surface)] border border-[var(--border-subtle)] flex items-center justify-center text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer active:scale-95"
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
        <div className="p-3.5 pb-safe border-t border-[var(--border-subtle)] bg-[var(--surface)] flex gap-3">
          {alerts.length > 0 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDismissAll();
              }}
              className="flex-1 min-h-[44px] py-2.5 text-xs font-bold text-center bg-[var(--surface-secondary)] hover:bg-[var(--surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-subtle)] rounded-[var(--radius-medium)] ios-press transition-all cursor-pointer"
            >
              Clear All ({alerts.length})
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="flex-1 min-h-[44px] py-2.5 text-xs font-bold text-center bg-[var(--accent-blue)] hover:brightness-110 active:scale-95 text-white rounded-[var(--radius-medium)] ios-press transition-all shadow-xs cursor-pointer"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
