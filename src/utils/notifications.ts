import { Portfolio } from '../types/portfolio';
import { formatINR } from './formatters';
import { logger } from '../infrastructure/logging/logger';

const NOTIFICATION_LOCK_PREFIX = 'finance_notif_sent_';

/**
 * Check if the browser supports standard Web Notifications
 */
export function isNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

/**
 * Get current browser notification permission
 */
export function getNotificationPermission(): NotificationPermission | 'unsupported' {
  if (!isNotificationSupported()) return 'unsupported';
  return Notification.permission;
}

/**
 * Request notification permission from the user
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (!isNotificationSupported()) return false;
  try {
    const perm = await Notification.requestPermission();
    return perm === 'granted';
  } catch (err) {
    logger.warn('[notifications] Failed to request permission', { error: String(err) });
    return false;
  }
}

/**
 * Send an immediate browser notification if permission is granted
 */
export function sendNotification(title: string, options?: NotificationOptions): boolean {
  if (!isNotificationSupported() || Notification.permission !== 'granted') {
    return false;
  }

  try {
    const notif = new Notification(title, {
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-192x192.png',
      silent: false,
      ...options,
    });

    notif.onclick = () => {
      window.focus();
      notif.close();
    };
    return true;
  } catch {
    // Fallback: try ServiceWorkerRegistration.showNotification if window.Notification constructor fails on mobile PWA
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((registration) => {
        registration.showNotification(title, {
          icon: '/icons/icon-192x192.png',
          badge: '/icons/icon-192x192.png',
          ...options,
        });
      }).catch(() => {
        /* ignore */
      });
      return true;
    }
    return false;
  }
}

/**
 * Scan all portfolios for upcoming maturities, renewals, and expirations,
 * dispatching deduplicated browser notifications.
 */
export function checkAndNotifyMaturities(portfolios: Portfolio[]): number {
  if (getNotificationPermission() !== 'granted') return 0;

  const now = Date.now();
  const ONE_DAY_MS = 86_400_000;
  const nowDate = new Date();
  const todayStr = `${nowDate.getFullYear()}-${String(nowDate.getMonth() + 1).padStart(2, '0')}-${String(nowDate.getDate()).padStart(2, '0')}`;
  let dispatchedCount = 0;

  // Periodic cleanup: prune notification lock keys older than 7 days
  try {
    const keys = Object.keys(localStorage);
    const sevenDaysAgoStr = new Date(Date.now() - 7 * ONE_DAY_MS).toISOString().split('T')[0];
    keys.forEach((key) => {
      if (key.startsWith(NOTIFICATION_LOCK_PREFIX)) {
        const parts = key.split('_');
        const datePart = parts[parts.length - 1];
        if (datePart && datePart < sevenDaysAgoStr) {
          localStorage.removeItem(key);
        }
      }
    });
  } catch {
    // ignore
  }

  portfolios.forEach((portfolio) => {
    // 1. Fixed Deposits maturing within 7 days
    (portfolio.fixedDeposits || []).forEach((fd) => {
      if (fd.status === 'matured' || !fd.maturity_date) return;
      const matDate = new Date(fd.maturity_date).getTime();
      const diffDays = Math.ceil((matDate - now) / ONE_DAY_MS);

      if (diffDays >= 0 && diffDays <= 7) {
        const lockKey = `${NOTIFICATION_LOCK_PREFIX}fd_${fd.id}_${todayStr}`;
        if (!localStorage.getItem(lockKey)) {
          const sent = sendNotification('FD Maturity Reminder', {
            body: `${fd.bank_name} FD (${formatINR(fd.maturity_amount || fd.principal_amount)}) matures in ${
              diffDays === 0 ? 'today' : diffDays === 1 ? 'tomorrow' : `${diffDays} days`
            } (${portfolio.label}).`,
            tag: `fd-${fd.id}`,
          });
          if (sent) {
            localStorage.setItem(lockKey, '1');
            dispatchedCount++;
          }
        }
      }
    });

    // 2. Insurance renewals within 30 days
    (portfolio.insurances || []).forEach((ins) => {
      if (!ins.renewal_date) return;
      const renDate = new Date(ins.renewal_date).getTime();
      const diffDays = Math.ceil((renDate - now) / ONE_DAY_MS);

      if (diffDays >= 0 && diffDays <= 30) {
        // Send alert on day 30, day 7, day 1, and day 0
        const isAlertMilestone = diffDays === 30 || diffDays === 14 || diffDays === 7 || diffDays <= 1;
        if (isAlertMilestone) {
          const lockKey = `${NOTIFICATION_LOCK_PREFIX}ins_${ins.id}_${todayStr}_${diffDays}`;
          if (!localStorage.getItem(lockKey)) {
            const sent = sendNotification('Insurance Renewal Due', {
              body: `${ins.policy_name} (${ins.provider || 'Policy'}) premium renewal is due in ${
                diffDays === 0 ? 'today' : diffDays === 1 ? 'tomorrow' : `${diffDays} days`
              } (${portfolio.label}).`,
              tag: `ins-${ins.id}`,
            });
            if (sent) {
              localStorage.setItem(lockKey, '1');
              dispatchedCount++;
            }
          }
        }
      }
    });

    // 3. Document Expirations within 14 days
    (portfolio.documents || []).forEach((doc) => {
      if (!doc.expiry_date) return;
      const expDate = new Date(doc.expiry_date).getTime();
      const diffDays = Math.ceil((expDate - now) / ONE_DAY_MS);

      if (diffDays >= 0 && diffDays <= 14) {
        const lockKey = `${NOTIFICATION_LOCK_PREFIX}doc_${doc.id}_${todayStr}`;
        if (!localStorage.getItem(lockKey)) {
          const sent = sendNotification('Document Expiry Alert', {
            body: `"${doc.name}" expires in ${
              diffDays === 0 ? 'today' : diffDays === 1 ? 'tomorrow' : `${diffDays} days`
            } (${portfolio.label}).`,
            tag: `doc-${doc.id}`,
          });
          if (sent) {
            localStorage.setItem(lockKey, '1');
            dispatchedCount++;
          }
        }
      }
    });
  });

  return dispatchedCount;
}
