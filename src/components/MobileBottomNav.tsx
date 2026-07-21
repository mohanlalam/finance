import React, { useRef, useEffect, useState } from 'react';
import { Home as HomeIcon, TrendingUp, Landmark, Coins, Building2, Shield, FolderOpen, Clock, ChevronUp, Calculator as CalculatorIcon } from './icons/AppIcons';

type AssetTab = 'home' | 'stocks' | 'fd' | 'rd' | 'sip' | 'gold' | 'real_estate' | 'insurance' | 'documents' | 'widgets' | 'what_if';

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
  { id: 'sip', label: 'SIPs', icon: <TrendingUp size={18} /> },
  { id: 'gold', label: 'Gold', icon: <Coins size={18} /> },
  { id: 'real_estate', label: 'Realty', icon: <Building2 size={18} /> },
  { id: 'insurance', label: 'Cover', icon: <Shield size={18} /> },
  { id: 'documents', label: 'Docs', icon: <FolderOpen size={18} /> },
  { id: 'what_if', label: 'What-If', icon: <CalculatorIcon size={18} /> },
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
        className={`fixed bottom-14 left-0 right-0 z-30 bg-white/96 dark:bg-[#0e1628]/98 backdrop-blur-xl border-t border-slate-200/60 dark:border-white/[0.06] rounded-t-2xl shadow-[0_-16px_48px_-8px_rgba(0,0,0,0.15)] dark:shadow-[0_-16px_48px_-8px_rgba(0,0,0,0.5)] p-5 md:hidden transition-transform duration-300 ease-out transform pb-safe ${
          isDrawerOpen ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            More Asset Classes
          </h4>
          <button
            onClick={() => setIsDrawerOpen(false)}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs font-bold px-2.5 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-all"
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
                    ? 'bg-blue-500/10 border-blue-500/25 dark:bg-blue-500/15 dark:border-blue-500/30 text-blue-600 dark:text-blue-400 font-bold shadow-sm shadow-blue-500/10'
                    : 'bg-slate-50/60 border-slate-100 dark:bg-white/[0.03] dark:border-white/[0.06] text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/[0.06]'
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
        className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#080d1a]/95 backdrop-blur-xl border-t-0 shadow-[0_-8px_32px_-4px_rgba(0,0,0,0.10)] dark:shadow-[0_-8px_32px_-4px_rgba(0,0,0,0.45)] md:hidden pb-safe"
        style={{ borderTop: '1px solid rgba(226,232,240,0.6)' }}
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
                className={`relative flex-1 flex flex-col items-center justify-center gap-0.5 h-full transition-all duration-200 active:scale-90 outline-none ${
                isActive
                  ? 'text-blue-600 dark:text-blue-400 font-bold'
                  : 'text-slate-400 dark:text-slate-500 active:text-slate-600 dark:active:text-slate-300'
              }`}
            >
              {/* Active pill bubble */}
              {isActive && (
                <div className="absolute inset-x-1.5 top-1.5 bottom-1.5 rounded-xl bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/15" />
              )}
              <div className={`transition-all duration-200 relative z-10 ${isActive ? 'scale-110 -translate-y-0.5' : ''} relative`}>
                  {tab.icon}
                  {tab.id === 'home' && alertCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 min-w-[14px] h-[14px] rounded-full bg-gradient-to-br from-rose-500 to-pink-600 text-white text-[8px] font-bold flex items-center justify-center px-0.5 leading-none">
                      {alertCount > 9 ? '9+' : alertCount}
                    </span>
                  )}
                </div>
                <span className={`text-[9.5px] font-semibold tracking-wide leading-none transition-all duration-200 relative z-10 ${
                  isActive
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-slate-400 dark:text-slate-500'
                }`}>
                  {tab.label}
                </span>
                {isActive && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-5 h-[2px] bg-gradient-to-r from-blue-500 to-indigo-500 dark:from-blue-400 dark:to-indigo-400 rounded-full" />
                )}
              </button>
            );
          })}

          {/* More Tab (Up Arrow / ChevronUp) */}
          <button
            onClick={() => setIsDrawerOpen(!isDrawerOpen)}
            aria-expanded={isDrawerOpen}
            className={`relative flex-1 flex flex-col items-center justify-center gap-0.5 h-full transition-all duration-200 active:scale-90 outline-none ${
              isMoreActive || isDrawerOpen
                ? 'text-blue-600 dark:text-blue-400 font-bold'
                : 'text-slate-400 dark:text-slate-500 active:text-slate-600 dark:active:text-slate-300'
            }`}
          >
            {/* Active pill bubble */}
            {(isMoreActive || isDrawerOpen) && (
              <div className="absolute inset-x-1.5 top-1.5 bottom-1.5 rounded-xl bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/15" />
            )}
            <div className={`transition-all duration-200 ${isMoreActive || isDrawerOpen ? 'scale-110 -translate-y-0.5 rotate-180' : ''} relative z-10`}>
              <ChevronUp size={18} />
            </div>
            <span className={`text-[9.5px] font-semibold tracking-wide leading-none transition-all duration-200 relative z-10 ${
              isMoreActive || isDrawerOpen
                ? 'text-blue-600 dark:text-blue-400'
                : 'text-slate-400 dark:text-slate-500'
            }`}>
              More
            </span>
            {(isMoreActive || isDrawerOpen) && (
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-5 h-[2px] bg-gradient-to-r from-blue-500 to-indigo-500 dark:from-blue-400 dark:to-indigo-400 rounded-full" />
            )}
          </button>
        </div>
      </nav>
    </>
  );
}

export default React.memo(MobileBottomNav);
