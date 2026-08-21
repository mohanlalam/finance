import React, { useState, useCallback } from 'react';
import { X, Landmark, Shield, Activity, AlertTriangle, FileText } from './icons/AppIcons';
import { Alert, AlertType } from '../hooks/useAlerts';

interface AlertsBannerProps {
  alerts: Alert[];
  onDismissAlert?: (id: string) => void;
  onDismissAll?: () => void;
}

const TYPE_CONFIG: Record<AlertType, { icon: React.ReactNode; color: string; bg: string; border: string }> = {
  fd_maturity: {
    icon: <Landmark size={14} aria-hidden="true" />,
    color: 'text-[var(--text-primary)]',
    bg: 'bg-[var(--surface-secondary)]',
    border: 'border-[var(--border-subtle)]',
  },
  rd_maturity: {
    icon: <Landmark size={14} aria-hidden="true" />,
    color: 'text-[var(--accent-blue)]',
    bg: 'bg-[var(--accent-blue-soft)]',
    border: 'border-[var(--border-subtle)]',
  },
  insurance_renewal: {
    icon: <Shield size={14} aria-hidden="true" />,
    color: 'text-[var(--negative)]',
    bg: 'bg-[var(--negative-soft)]',
    border: 'border-[var(--border-subtle)]',
  },
  portfolio_swing: {
    icon: <Activity size={14} aria-hidden="true" />,
    color: 'text-[var(--accent-blue)]',
    bg: 'bg-[var(--accent-blue-soft)]',
    border: 'border-[var(--border-subtle)]',
  },
  document_expiry: {
    icon: <FileText size={14} aria-hidden="true" />,
    color: 'text-[var(--text-secondary)]',
    bg: 'bg-[var(--surface-secondary)]',
    border: 'border-[var(--border-subtle)]',
  },
};

const SEVERITY_BADGE: Record<string, string> = {
  critical: 'bg-[var(--negative)] text-[var(--surface)]',
  warning: 'bg-[var(--warning-soft)] text-[var(--warning)]',
  info: 'bg-[var(--accent-blue-soft)] text-[var(--accent-blue)]',
};

import { getNotificationPermission, requestNotificationPermission } from '../utils/notifications';

function AlertsBanner({ alerts, onDismissAlert, onDismissAll }: AlertsBannerProps) {
  const [localDismissed, setLocalDismissed] = useState<Set<string>>(new Set());
  const [notifPerm, setNotifPerm] = useState(getNotificationPermission());

  const handleRequestPermission = useCallback(async () => {
    const granted = await requestNotificationPermission();
    setNotifPerm(granted ? 'granted' : 'denied');
  }, []);

  const dismiss = useCallback((id: string) => {
    if (onDismissAlert) {
      onDismissAlert(id);
    } else {
      setLocalDismissed((prev) => new Set(prev).add(id));
    }
  }, [onDismissAlert]);

  const dismissAll = useCallback(() => {
    if (onDismissAll) {
      onDismissAll();
    } else {
      setLocalDismissed(new Set(alerts.map((a) => a.id)));
    }
  }, [alerts, onDismissAll]);

  const visible = onDismissAlert
    ? alerts
    : alerts.filter((a) => !localDismissed.has(a.id));

  if (visible.length === 0) return null;

  return (
    <div aria-live="polite" className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertTriangle size={14} className="text-[var(--warning)]" aria-hidden="true" />
          <span className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">
            {visible.length} Alert{visible.length > 1 ? 's' : ''}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {notifPerm === 'default' && (
            <button
              onClick={handleRequestPermission}
              className="text-xs font-semibold text-[var(--accent-blue)] hover:underline ios-press px-2 py-1"
            >
              Enable push alerts
            </button>
          )}
          {visible.length > 1 && (
            <button
              onClick={dismissAll}
              className="text-xs font-semibold text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors ios-press px-2 py-1 rounded-[var(--radius-small)]"
            >
              Dismiss all
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {visible.slice(0, 8).map((alert) => {
          const config = TYPE_CONFIG[alert.type];
          return (
            <div
              key={alert.id}
              className={`flex items-center gap-2 rounded-[var(--radius-medium)] border px-3 py-2 text-xs ${config.bg} ${config.border} ${config.color} transition-all duration-200 apple-card`}
            >
              <span className="shrink-0">{config.icon}</span>
              <div className="min-w-0">
                <span className="font-bold">{alert.title}</span>
                <span className="text-[11px] opacity-75 ml-1.5">{alert.message}</span>
                {alert.portfolioLabel && (
                  <span className="text-[11px] opacity-60 ml-1">· {alert.portfolioLabel}</span>
                )}
              </div>
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-[var(--radius-pill)] shrink-0 ${SEVERITY_BADGE[alert.severity]}`}>
                {alert.severity}
              </span>
              <button
                onClick={() => dismiss(alert.id)}
                aria-label={`Dismiss alert: ${alert.title}`}
                className="shrink-0 opacity-60 hover:opacity-100 transition-opacity p-0.5 rounded-[var(--radius-pill)] hover:bg-[var(--surface-secondary)] ios-press"
              >
                <X size={12} aria-hidden="true" />
              </button>
            </div>
          );
        })}
        {visible.length > 8 && (
          <span className="flex items-center text-xs font-semibold text-[var(--text-tertiary)] px-2">
            +{visible.length - 8} more
          </span>
        )}
      </div>
    </div>
  );
}

export default React.memo(AlertsBanner);
