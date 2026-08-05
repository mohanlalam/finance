import { useState, useEffect } from 'react';
import { X } from './icons/AppIcons';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

interface NavigatorWithStandalone extends Navigator {
  standalone?: boolean;
}

export default function PWAInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);

  useEffect(() => {
    // Check if already installed
    const nav = navigator as NavigatorWithStandalone;
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || Boolean(nav.standalone);
    if (isStandalone) {
      return;
    }

    // Check dismissal in localStorage
    const dismissedAt = localStorage.getItem('pwa_banner_dismissed');
    if (dismissedAt) {
      const dismissedTime = parseInt(dismissedAt, 10);
      const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
      if (Date.now() - dismissedTime < thirtyDaysMs) {
        return;
      }
    }

    // Check iOS Safari
    const isIOSDevice = /iPhone|iPad|iPod/.test(navigator.userAgent);
    if (isIOSDevice && !nav.standalone) {
      setIsIOS(true);
      setIsVisible(true);
      return;
    }

    // Listen for beforeinstallprompt (Chrome / Android)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    setShowInstructions(false);
    localStorage.setItem('pwa_banner_dismissed', Date.now().toString());
  };

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowInstructions(!showInstructions);
      return;
    }

    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setIsVisible(false);
    }
    
    setDeferredPrompt(null);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-16 left-4 right-4 md:left-auto md:right-6 md:bottom-6 md:w-96 z-[250] animate-slide-up">
      {showInstructions && isIOS && (
        <div className="absolute bottom-full mb-2 left-0 right-0 bg-slate-800 dark:bg-slate-700 text-white text-sm p-3 rounded-xl shadow-lg border border-slate-700/50">
          <div className="flex items-center gap-2">
            <span>Tap</span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5 text-blue-400 shrink-0">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 15v4c0 1.1.9 2 2 2h14a2 2 0 0 0 2-2v-4M17 8l-5-5-5 5M12 3v12" />
            </svg>
            <span>then <strong>Add to Home Screen</strong></span>
          </div>
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-slate-800 dark:border-t-slate-700" />
        </div>
      )}
      
      <div className="bg-white/85 dark:bg-slate-900/85 backdrop-blur-xl border border-slate-200/60 dark:border-slate-700/60 rounded-2xl shadow-floating p-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500 shadow-sm flex items-center justify-center shrink-0">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-6 h-6 text-white">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 11v-1m-6-3a9 9 0 1118 0 9 9 0 01-18 0z" />
            </svg>
          </div>
          <p className="text-sm font-medium text-slate-800 dark:text-slate-200 leading-tight">
            Add Family Wealth to Home Screen for fast, native access
          </p>
        </div>
        
        <div className="flex items-center gap-2 shrink-0">
          <button 
            onClick={handleInstallClick}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-sm active:scale-95 transition-all"
          >
            {isIOS ? 'Install' : 'Install'}
          </button>
          
          <button 
            onClick={handleDismiss}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
