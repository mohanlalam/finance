import React, { useState, useCallback } from 'react';
import { X, TrendingUp, TrendingDown, Landmark, Shield, Activity, AlertTriangle, FileText } from './icons/AppIcons';
import { Alert, AlertType } from '../hooks/useAlerts';

interface AlertsBannerProps {
  alerts: Alert[];
}

const TYPE_CONFIG: Record<AlertType, { icon: React.ReactNode; color: string; bg: string; border: string }> = {
  '52w_high': {
    icon: <TrendingUp size={14} />,
    color: 'text-blue-700 dark:text-blue-400',
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    border: 'border-blue-200 dark:border-blue-800',
  },
  '52w_low': {
    icon: <TrendingDown size={14} />,
    color: 'text-amber-700 dark:text-amber-400',
    bg: 'bg-amber-50 dark:bg-amber-900/20',
    border: 'border-amber-200 dark:border-amber-800',
  },
  fd_maturity: {
    icon: <Landmark size={14} />,
    color: 'text-indigo-700 dark:text-indigo-400',
    bg: 'bg-indigo-50 dark:bg-indigo-900/20',
    border: 'border-indigo-200 dark:border-indigo-800',
  },
  insurance_renewal: {
    icon: <Shield size={14} />,
    color: 'text-rose-700 dark:text-rose-400',
    bg: 'bg-rose-50 dark:bg-rose-900/20',
    border: 'border-rose-200 dark:border-rose-800',
  },
  portfolio_swing: {
    icon: <Activity size={14} />,
    color: 'text-violet-700 dark:text-violet-400',
    bg: 'bg-violet-50 dark:bg-violet-900/20',
    border: 'border-violet-200 dark:border-violet-800',
  },
  document_expiry: {
    icon: <FileText size={14} />,
    color: 'text-slate-700 dark:text-slate-300',
    bg: 'bg-slate-50 dark:bg-slate-800/40',
    border: 'border-slate-200 dark:border-slate-700',
  },
};

const SEVERITY_BADGE: Record<string, string> = {
  critical: 'bg-red-500 text-white',
  warning: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',
  info: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
};

function AlertsBanner({ alerts }: AlertsBannerProps) {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const dismiss = useCallback((id: string) => {
    setDismissed((prev) => new Set(prev).add(id));
  }, []);

  const dismissAll = useCallback(() => {
    setDismissed(new Set(alerts.map((a) => a.id)));
  }, [alerts]);

  const visible = alerts.filter((a) => !dismissed.has(a.id));

  if (visible.length === 0) return null;

  return (
    <div role="alert" aria-live="polite" className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertTriangle size={14} className="text-amber-500" />
          <span className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
            {visible.length} Alert{visible.length > 1 ? 's' : ''}
          </span>
        </div>
        {visible.length > 1 && (
          <button
            onClick={dismissAll}
            className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
          >
            Dismiss all
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {visible.slice(0, 8).map((alert) => {
          const config = TYPE_CONFIG[alert.type];
          return (
            <div
              key={alert.id}
              className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs ${config.bg} ${config.border} ${config.color} transition-all duration-200 animate-in fade-in`}
            >
              <span className="shrink-0">{config.icon}</span>
              <div className="min-w-0">
                <span className="font-bold">{alert.title}</span>
                <span className="text-[10px] opacity-70 ml-1.5">{alert.message}</span>
                {alert.portfolioLabel && (
                  <span className="text-[10px] opacity-50 ml-1">· {alert.portfolioLabel}</span>
                )}
              </div>
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${SEVERITY_BADGE[alert.severity]}`}>
                {alert.severity}
              </span>
              <button
                onClick={() => dismiss(alert.id)}
                aria-label={`Dismiss alert: ${alert.title}`}
                className="shrink-0 opacity-50 hover:opacity-100 transition-opacity"
              >
                <X size={12} />
              </button>
            </div>
          );
        })}
        {visible.length > 8 && (
          <span className="flex items-center text-[10px] font-semibold text-slate-400 dark:text-slate-500 px-2">
            +{visible.length - 8} more
          </span>
        )}
      </div>
    </div>
  );
}

export default React.memo(AlertsBanner);
