import React, { useRef, useEffect, useState } from 'react';
import { Home as HomeIcon, TrendingUp, Landmark, Coins, Building2, Shield, FolderOpen, Clock, Heart, ChevronUp } from 'lucide-react';

type AssetTab = 'home' | 'stocks' | 'fd' | 'rd' | 'ssy' | 'sip' | 'gold' | 'real_estate' | 'insurance' | 'documents';

interface MobileBottomNavProps {
  activeAsset: AssetTab;
  onChangeAsset: (tab: AssetTab) => void;
  /** Number of active (non-dismissed) alerts to show as a badge on the Home tab */
  alertCount?: number;
}

const mainTabs: { id: AssetTab; label: string; icon: React.ReactNode }[] = [
  { id: 'home', label: 'Home', icon: <HomeIcon size={18} /> },
  { id: 'stocks', label: 'Stocks', icon: <TrendingUp size={18} /> },
  { id: 'fd', label: 'FDs', icon: <Landmark size={18} /> },
];

const moreTabs: { id: AssetTab; label: string; icon: React.ReactNode }[] = [
  { id: 'rd', label: 'RDs', icon: <Clock size={18} /> },
  { id: 'ssy', label: 'SSY', icon: <Heart size={18} /> },
  { id: 'sip', label: 'SIPs', icon: <TrendingUp size={18} /> },
  { id: 'gold', label: 'Gold', icon: <Coins size={18} /> },
  { id: 'real_estate', label: 'Realty', icon: <Building2 size={18} /> },
  { id: 'insurance', label: 'Cover', icon: <Shield size={18} /> },
  { id: 'documents', label: 'Docs', icon: <FolderOpen size={18} /> },
];

function MobileBottomNav({ activeAsset, onChangeAsset, alertCount = 0 }: MobileBottomNavProps) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close drawer when active asset changes
  useEffect(() => {
    setIsDrawerOpen(false);
  }, [activeAsset]);

  const isMoreActive = moreTabs.some((tab) => tab.id === activeAsset);

  return (
    <>
      {/* Backdrop for More Drawer */}
      {isDrawerOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 z-30 backdrop-blur-xs transition-opacity duration-300 md:hidden"
          onClick={() => setIsDrawerOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* More Drawer */}
      <div
        className={`fixed bottom-14 left-0 right-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 rounded-t-2xl shadow-2xl p-5 md:hidden transition-transform duration-350 ease-out transform pb-safe ${
          isDrawerOpen ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-xs font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            More Asset Classes
          </h4>
          <button
            onClick={() => setIsDrawerOpen(false)}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs font-bold"
            aria-label="Close menu"
          >
            Close
          </button>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {moreTabs.map((tab) => {
            const isActive = activeAsset === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  onChangeAsset(tab.id);
                  setIsDrawerOpen(false);
                }}
                className={`flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl border transition-all active:scale-95 ${
                  isActive
                    ? 'bg-blue-50/50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-900/50 text-blue-600 dark:text-blue-400 font-bold'
                    : 'bg-slate-50/50 border-slate-100 dark:bg-slate-900/20 dark:border-slate-800 text-slate-500 dark:text-slate-400'
                }`}
              >
                <div className={`transition-transform duration-200 ${isActive ? 'scale-110' : ''}`}>{tab.icon}</div>
                <span className="text-[10px] font-semibold">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Bottom Nav Bar */}
      <nav
        role="navigation"
        aria-label="Asset navigation"
        className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-700 md:hidden pb-safe"
      >
        <div
          ref={containerRef}
          className="flex items-center justify-around h-14 px-2"
        >
          {mainTabs.map((tab) => {
            const isActive = activeAsset === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  onChangeAsset(tab.id);
                  setIsDrawerOpen(false);
                }}
                aria-current={isActive ? 'page' : undefined}
                className={`relative flex-1 flex flex-col items-center justify-center gap-1 h-full transition-all duration-150 active:scale-95 outline-none ${
                  isActive
                    ? 'text-blue-600 dark:text-blue-400 font-bold'
                    : 'text-slate-400 dark:text-slate-500 active:text-slate-600 dark:active:text-slate-350'
                }`}
              >
                <div className={`transition-transform duration-200 ${isActive ? 'scale-110 -translate-y-0.5' : ''} relative`}>
                  {tab.icon}
                  {tab.id === 'home' && alertCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 min-w-[14px] h-[14px] rounded-full bg-red-500 text-white text-[8px] font-bold flex items-center justify-center px-0.5 leading-none animate-pulse">
                      {alertCount > 9 ? '9+' : alertCount}
                    </span>
                  )}
                </div>
                <span className={`text-[9.5px] font-semibold tracking-wide leading-none transition-all duration-150 ${
                  isActive
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-slate-400 dark:text-slate-500'
                }`}>
                  {tab.label}
                </span>
                {isActive && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-blue-600 dark:bg-blue-400 rounded-full" />
                )}
              </button>
            );
          })}

          {/* More Tab (Up Arrow / ChevronUp) */}
          <button
            onClick={() => setIsDrawerOpen(!isDrawerOpen)}
            aria-expanded={isDrawerOpen}
            className={`relative flex-1 flex flex-col items-center justify-center gap-1 h-full transition-all duration-150 active:scale-95 outline-none ${
              isMoreActive || isDrawerOpen
                ? 'text-blue-600 dark:text-blue-400 font-bold'
                : 'text-slate-400 dark:text-slate-500 active:text-slate-600 dark:active:text-slate-350'
            }`}
          >
            <div className={`transition-transform duration-200 ${isMoreActive || isDrawerOpen ? 'scale-110 -translate-y-0.5 rotate-180' : ''} relative`}>
              <ChevronUp size={18} />
            </div>
            <span className={`text-[9.5px] font-semibold tracking-wide leading-none transition-all duration-150 ${
              isMoreActive || isDrawerOpen
                ? 'text-blue-600 dark:text-blue-400'
                : 'text-slate-400 dark:text-slate-500'
            }`}>
              More
            </span>
            {(isMoreActive || isDrawerOpen) && (
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-blue-600 dark:bg-blue-400 rounded-full" />
            )}
          </button>
        </div>
      </nav>
    </>
  );
}

export default React.memo(MobileBottomNav);
