import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { Portfolio } from '../types/portfolio';

export type AlertSeverity = 'critical' | 'warning' | 'info';
export type AlertType = 'fd_maturity' | 'rd_maturity' | 'insurance_renewal' | 'portfolio_swing' | 'document_expiry';

export interface Alert {
  id: string;
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  message: string;
  portfolioLabel?: string;
}

const SWING_THRESHOLD_KEY = 'finance_last_pnl_pct_v1';

function getLastPnlPct(): number | null {
  try {
    const v = sessionStorage.getItem(SWING_THRESHOLD_KEY);
    return v ? parseFloat(v) : null;
  } catch {
    return null;
  }
}

function setLastPnlPct(pct: number): void {
  try {
    sessionStorage.setItem(SWING_THRESHOLD_KEY, String(pct));
  } catch { /* ignore */ }
}

export function useAlerts(portfolios: Portfolio[]): Alert[] {
  const baselinePnlPctRef = useRef<number | null>(getLastPnlPct());
  // Track whether a swing alert was triggered this render cycle
  const swingAlertRef = useRef<{ diff: number; newPct: number } | null>(null);

  const { currentPct, totalInvested } = useMemo(() => {
    let invested = 0;
    let current = 0;
    for (let i = 0; i < portfolios.length; i++) {
      invested += portfolios[i].totalInvested;
      current += portfolios[i].totalCurrentValue;
    }
    const pct = invested > 0 ? ((current - invested) / invested) * 100 : 0;
    return { currentPct: pct, totalInvested: invested };
  }, [portfolios]);

  useEffect(() => {
    if (baselinePnlPctRef.current === null && portfolios.length > 0 && totalInvested > 0) {
      baselinePnlPctRef.current = currentPct;
      setLastPnlPct(currentPct);
    }
  }, [currentPct, portfolios.length, totalInvested]);

  // Advance the baseline AFTER render when a swing is detected — safe side-effect
  useEffect(() => {
    if (swingAlertRef.current !== null) {
      baselinePnlPctRef.current = swingAlertRef.current.newPct;
      setLastPnlPct(swingAlertRef.current.newPct);
      swingAlertRef.current = null;
    }
  }, [currentPct]);

  return useMemo(() => {
    const alerts: Alert[] = [];
    swingAlertRef.current = null;

    for (const p of portfolios) {
      // ── RD maturity alerts ──
      for (const rd of p.rdAccounts ?? []) {
        if (rd.status === 'matured' || !rd.maturity_date) continue;
        const maturityTs = Date.parse(rd.maturity_date);
        if (isNaN(maturityTs)) continue;
        const days = Math.ceil((maturityTs - Date.now()) / (1000 * 3600 * 24));
        if (days < 0) {
          alerts.push({
            id: `rd-overdue-${p.name}-${rd.id}`,
            type: 'rd_maturity',
            severity: 'critical',
            title: `RD overdue for maturity`,
            message: `${rd.bank_name} — ₹${Number(rd.maturity_amount || rd.monthly_deposit).toLocaleString('en-IN')} (Matured ${Math.abs(days)} days ago)`,
            portfolioLabel: p.label,
          });
        } else if (days <= 30) {
          alerts.push({
            id: `rd-maturity-${p.name}-${rd.id}`,
            type: 'rd_maturity',
            severity: days <= 7 ? 'critical' : 'warning',
            title: `RD maturing ${days === 0 ? 'today' : `in ${days} days`}`,
            message: `${rd.bank_name} — ₹${Number(rd.maturity_amount || rd.monthly_deposit).toLocaleString('en-IN')}`,
            portfolioLabel: p.label,
          });
        }
      }

      // ── FD maturity alerts ──
      for (const fd of p.fixedDeposits) {
        if (fd.status === 'matured' || fd.maturityDateTs === undefined) continue;
        const days = Math.ceil((fd.maturityDateTs - Date.now()) / (1000 * 3600 * 24));
        if (days < 0) {
          alerts.push({
            id: `fd-overdue-${p.name}-${fd.id}`,
            type: 'fd_maturity',
            severity: 'critical',
            title: `FD overdue for maturity`,
            message: `${fd.bank_name} — ₹${Number(fd.principal_amount).toLocaleString('en-IN')} (Matured ${Math.abs(days)} days ago)`,
            portfolioLabel: p.label,
          });
        } else if (days <= 15) {
          alerts.push({
            id: `fd-maturity-${p.name}-${fd.id}`,
            type: 'fd_maturity',
            severity: days <= 5 ? 'critical' : 'warning',
            title: `FD maturing ${days === 0 ? 'today' : `in ${days} days`}`,
            message: `${fd.bank_name} — ₹${Number(fd.principal_amount).toLocaleString('en-IN')}`,
            portfolioLabel: p.label,
          });
        }
      }

      // ── Insurance renewal alerts ──
      for (const ins of p.insurances) {
        if (ins.renewalDateTs === undefined) continue;
        const days = Math.ceil((ins.renewalDateTs - Date.now()) / (1000 * 3600 * 24));
        if (days < 0) {
          alerts.push({
            id: `insurance-overdue-${p.name}-${ins.id}`,
            type: 'insurance_renewal',
            severity: 'critical',
            title: `Insurance premium overdue`,
            message: `${ins.policy_name} — ${ins.provider} (Due ${Math.abs(days)} days ago)`,
            portfolioLabel: p.label,
          });
        } else if (days <= 30) {
          alerts.push({
            id: `insurance-renewal-${p.name}-${ins.id}`,
            type: 'insurance_renewal',
            severity: days <= 7 ? 'critical' : 'warning',
            title: `Insurance renewal ${days === 0 ? 'today' : `in ${days} days`}`,
            message: `${ins.policy_name} — ${ins.provider}`,
            portfolioLabel: p.label,
          });
        }
      }

      // ── Document expiry alerts ──
      for (const doc of p.documents) {
        if (doc.expiryDateTs === undefined) continue;
        const days = Math.ceil((doc.expiryDateTs - Date.now()) / (1000 * 3600 * 24));
        if (days < 0) {
          alerts.push({
            id: `document-expired-${p.name}-${doc.id}`,
            type: 'document_expiry',
            severity: 'critical',
            title: `Document expired`,
            message: `${doc.name} (Expired ${Math.abs(days)} days ago)`,
            portfolioLabel: p.label,
          });
        } else if (days <= 30) {
          alerts.push({
            id: `document-expiry-${p.name}-${doc.id}`,
            type: 'document_expiry',
            severity: days <= 7 ? 'critical' : 'warning',
            title: `Document expiring ${days === 0 ? 'today' : `in ${days} days`}`,
            message: `${doc.name}`,
            portfolioLabel: p.label,
          });
        }
      }
    }

    // ── Portfolio swing alerts ──
    const lastPct = baselinePnlPctRef.current;

    if (lastPct !== null) {
      const diff = currentPct - lastPct;
      if (Math.abs(diff) >= 5) {
        alerts.push({
          id: 'portfolio-swing-alert',
          type: 'portfolio_swing',
          severity: diff < 0 ? 'critical' : 'info',
          title: `Portfolio ${diff > 0 ? 'up' : 'down'} ${Math.abs(diff).toFixed(1)}% since last session`,
          message: `${lastPct.toFixed(1)}% → ${currentPct.toFixed(1)}%`,
        });
        // Schedule baseline advance via ref — actual write happens in the useEffect above
        swingAlertRef.current = { diff, newPct: currentPct };
      }
    }
    // Sort: critical first, then warning, then info
    const order: Record<AlertSeverity, number> = { critical: 0, warning: 1, info: 2 };
    alerts.sort((a, b) => order[a.severity] - order[b.severity]);

    return alerts;
  }, [portfolios, currentPct]);
}

export function useDismissibleAlerts(portfolios: Portfolio[]) {
  const alerts = useAlerts(portfolios);

  // We load/save as Record<string, number> (id -> dismissedAt timestamp)
  const [dismissedAlertsMap, setDismissedAlertsMap] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem('portfolio_dismissed_alerts');
      if (!saved) return {};
      const parsed = JSON.parse(saved) as Record<string, number>;
      
      // Auto-filter out anything older than 30 days on load
      const now = Date.now();
      const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
      const cleanMap: Record<string, number> = {};
      let changed = false;
      for (const [id, timestamp] of Object.entries(parsed)) {
        if (now - timestamp < thirtyDaysMs) {
          cleanMap[id] = timestamp;
        } else {
          changed = true;
        }
      }
      if (changed) {
        localStorage.setItem('portfolio_dismissed_alerts', JSON.stringify(cleanMap));
      }
      return cleanMap;
    } catch {
      return {};
    }
  });

  const alertsRef = useRef(alerts);
  useEffect(() => {
    alertsRef.current = alerts;
  }, [alerts]);

  const lastCleanupRef = useRef<number>(
    (() => {
      try {
        const saved = localStorage.getItem('portfolio_dismissed_alerts_cleanup');
        return saved ? parseInt(saved, 10) : 0;
      } catch {
        return 0;
      }
    })()
  );

  // Perform monthly cleanup of alerts that are no longer active
  useEffect(() => {
    try {
      const now = Date.now();
      const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
      const lastCleanup = lastCleanupRef.current;

      if (!lastCleanup) {
        // First time initialization of cleanup timer
        lastCleanupRef.current = now;
        localStorage.setItem('portfolio_dismissed_alerts_cleanup', String(now));
        return;
      }

      // If last cleanup was more than 30 days ago
      if (now - lastCleanup > thirtyDaysMs) {
        // Guard: Do not run active ID cleanup if alerts haven't loaded yet
        if (alertsRef.current.length === 0) {
          return;
        }

        const activeIds = new Set(alertsRef.current.map((a) => a.id));
        setDismissedAlertsMap((prev) => {
          const cleanMap: Record<string, number> = {};
          let changed = false;
          for (const [id, timestamp] of Object.entries(prev)) {
            // Keep only if it's currently active AND not older than 30 days
            if (activeIds.has(id) && now - timestamp < thirtyDaysMs) {
              cleanMap[id] = timestamp;
            } else {
              changed = true;
            }
          }
          return changed ? cleanMap : prev;
        });
        try {
          localStorage.setItem('portfolio_dismissed_alerts_cleanup', String(now));
        } catch { /* ignore */ }
        lastCleanupRef.current = now;
      }
    } catch { /* ignore */ }
  }, []);

  const handleDismissAlert = useCallback((id: string) => {
    setDismissedAlertsMap((prev) => {
      const next = { ...prev, [id]: Date.now() };
      try {
        localStorage.setItem('portfolio_dismissed_alerts', JSON.stringify(next));
      } catch { /* ignore */ }
      return next;
    });
  }, []);

  const handleDismissAll = useCallback(() => {
    setDismissedAlertsMap((prev) => {
      const next = { ...prev };
      const now = Date.now();
      alertsRef.current.forEach((a) => {
        next[a.id] = now;
      });
      try {
        localStorage.setItem('portfolio_dismissed_alerts', JSON.stringify(next));
      } catch { /* ignore */ }
      return next;
    });
  }, []);

  const visibleAlerts = useMemo(() => {
    return alerts.filter((a) => !Object.prototype.hasOwnProperty.call(dismissedAlertsMap, a.id));
  }, [alerts, dismissedAlertsMap]);

  return {
    visibleAlerts,
    handleDismissAlert,
    handleDismissAll,
  };
}
