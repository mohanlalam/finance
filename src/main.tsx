import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import AppErrorBoundary from './components/AppErrorBoundary.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppErrorBoundary>
      <App />
    </AppErrorBoundary>
  </StrictMode>
);

// Register SW in production after a delay to prevent connection contention in Safari during startup
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    setTimeout(() => {
      const swUrl = `${import.meta.env.BASE_URL || '/'}sw.js`;
      navigator.serviceWorker.register(swUrl)
        .then((reg) => {
          console.log('[pwa] Service Worker registered successfully:', reg);
        })
        .catch((err) => {
          console.warn('[pwa] Service Worker registration failed:', err);
        });
    }, 5000); // Defer by 5 seconds to prioritize main app chunks and asset load
  });
}
