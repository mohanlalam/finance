import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { Portfolio } from '../types/portfolio';

export type AlertSeverity = 'critical' | 'warning' | 'info';
export type AlertType = '52w_high' | '52w_low' | 'fd_maturity' | 'insurance_renewal' | 'portfolio_swing' | 'document_expiry';

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

  const currentPct = useMemo(() => {
    const totalInvested = portfolios.reduce((s, p) => s + p.totalInvested, 0);
    const totalCurrent = portfolios.reduce((s, p) => s + p.totalCurrentValue, 0);
    return totalInvested > 0 ? ((totalCurrent - totalInvested) / totalInvested) * 100 : 0;
  }, [portfolios]);

  useEffect(() => {
    if (baselinePnlPctRef.current === null && portfolios.length > 0) {
      baselinePnlPctRef.current = currentPct;
      setLastPnlPct(currentPct);
    }
  }, [currentPct, portfolios]);

  return useMemo(() => {
    const alerts: Alert[] = [];

    for (const p of portfolios) {
      // ── 52-week high/low alerts ──
      for (const h of p.holdings) {
        if (h.ltp <= 0 || h.weekHigh52 <= 0 || h.weekLow52 <= 0) continue;

        // Above or near 52-week high
        if (h.ltp > h.weekHigh52) {
          alerts.push({
            id: `52w-high-above-${p.name}-${h.id ?? h.ticker}`,
            type: '52w_high',
            severity: 'info',
            title: `${h.ticker} above 52-week high`,
            message: `LTP ₹${h.ltp.toLocaleString('en-IN')} vs High ₹${h.weekHigh52.toLocaleString('en-IN')}`,
            portfolioLabel: p.label,
          });
        } else if (h.ltp >= h.weekHigh52 * 0.98) {
          alerts.push({
            id: `52w-high-${p.name}-${h.id ?? h.ticker}`,
            type: '52w_high',
            severity: 'info',
            title: `${h.ticker} near 52-week high`,
            message: `LTP ₹${h.ltp.toLocaleString('en-IN')} vs High ₹${h.weekHigh52.toLocaleString('en-IN')}`,
            portfolioLabel: p.label,
          });
        }

        // Below or near 52-week low
        if (h.ltp < h.weekLow52) {
          alerts.push({
            id: `52w-low-below-${p.name}-${h.id ?? h.ticker}`,
            type: '52w_low',
            severity: 'warning',
            title: `${h.ticker} below 52-week low`,
            message: `LTP ₹${h.ltp.toLocaleString('en-IN')} vs Low ₹${h.weekLow52.toLocaleString('en-IN')}`,
            portfolioLabel: p.label,
          });
        } else if (h.ltp <= h.weekLow52 * 1.02 && h.weekLow52 > 0) {
          alerts.push({
            id: `52w-low-${p.name}-${h.id ?? h.ticker}`,
            type: '52w_low',
            severity: 'warning',
            title: `${h.ticker} near 52-week low`,
            message: `LTP ₹${h.ltp.toLocaleString('en-IN')} vs Low ₹${h.weekLow52.toLocaleString('en-IN')}`,
            portfolioLabel: p.label,
          });
        }
      }

      // ── FD maturity alerts ──
      for (const fd of p.fixedDeposits) {
        if (fd.status === 'matured' || !fd.maturity_date) continue;
        const days = Math.ceil((new Date(fd.maturity_date).getTime() - Date.now()) / (1000 * 3600 * 24));
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
        if (!ins.renewal_date) continue;
        const days = Math.ceil((new Date(ins.renewal_date).getTime() - Date.now()) / (1000 * 3600 * 24));
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
        if (!doc.expiry_date) continue;
        const days = Math.ceil((new Date(doc.expiry_date).getTime() - Date.now()) / (1000 * 3600 * 24));
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
          id: `portfolio-swing-${lastPct.toFixed(2)}-${currentPct.toFixed(2)}`,
          type: 'portfolio_swing',
          severity: diff < 0 ? 'critical' : 'info',
          title: `Portfolio ${diff > 0 ? 'up' : 'down'} ${Math.abs(diff).toFixed(1)}% since last session`,
          message: `${lastPct.toFixed(1)}% → ${currentPct.toFixed(1)}%`,
        });
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

  // Perform monthly cleanup of alerts that are no longer active
  useEffect(() => {
    try {
      const now = Date.now();
      const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
      const lastCleanupStr = localStorage.getItem('portfolio_dismissed_alerts_cleanup');
      const lastCleanup = lastCleanupStr ? parseInt(lastCleanupStr, 10) : 0;

      if (!lastCleanup) {
        // First time initialization of cleanup timer
        localStorage.setItem('portfolio_dismissed_alerts_cleanup', String(now));
        return;
      }

      // If last cleanup was more than 30 days ago
      if (now - lastCleanup > thirtyDaysMs) {
        const activeIds = new Set(alerts.map((a) => a.id));
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
          if (changed) {
            localStorage.setItem('portfolio_dismissed_alerts', JSON.stringify(cleanMap));
            return cleanMap;
          }
          return prev;
        });
        localStorage.setItem('portfolio_dismissed_alerts_cleanup', String(now));
      }
    } catch { /* ignore */ }
  }, [alerts]);

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
      alerts.forEach((a) => {
        next[a.id] = now;
      });
      try {
        localStorage.setItem('portfolio_dismissed_alerts', JSON.stringify(next));
      } catch { /* ignore */ }
      return next;
    });
  }, [alerts]);

  const visibleAlerts = useMemo(() => {
    return alerts.filter((a) => !Object.prototype.hasOwnProperty.call(dismissedAlertsMap, a.id));
  }, [alerts, dismissedAlertsMap]);

  return {
    visibleAlerts,
    handleDismissAlert,
    handleDismissAll,
  };
}
