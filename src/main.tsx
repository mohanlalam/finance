import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import ErrorBoundary from './components/ErrorBoundary';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>
);

// Register SW update listener in production to ensure iOS Standalone PWA updates automatically
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  navigator.serviceWorker.ready.then((registration) => {
    // Check for updates when user returns to app, focuses window, or comes online
    const checkForUpdates = () => {
      registration.update().catch(() => {});
    };

    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        checkForUpdates();
      }
    });

    window.addEventListener('focus', checkForUpdates);
    window.addEventListener('online', checkForUpdates);

    // Periodic check every 10 minutes
    setInterval(checkForUpdates, 10 * 60 * 1000);
  }).catch(() => {});

  // When a new service worker takes over, reload to apply the latest update immediately
  let isRefreshing = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (isRefreshing) return;
    isRefreshing = true;
    window.location.reload();
  });
}

