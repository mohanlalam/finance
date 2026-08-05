import React, { useRef, useEffect, useState } from 'react';
import { Home as HomeIcon, TrendingUp, Landmark, Coins, Building2, Shield, FolderOpen, Clock, ChevronUp, Calculator as CalculatorIcon } from './icons/AppIcons';

type AssetTab = 'home' | 'stocks' | 'fd' | 'rd' | 'sip' | 'gold' | 'real_estate' | 'insurance' | 'documents' | 'widgets' | 'what_if' | 'tax';

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
          className="fixed inset-0 bg-[#000000]/30 z-30 backdrop-blur-md transition-opacity duration-300 md:hidden"
          onClick={() => setIsDrawerOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* More Drawer */}
      <div
        className={`fixed bottom-14 left-0 right-0 z-30 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl border-t border-[var(--border-subtle)] rounded-t-2xl shadow-floating p-5 md:hidden transition-transform duration-300 ease-out transform pb-safe ${
          isDrawerOpen ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            More Asset Classes
          </h4>
          <button
            onClick={() => setIsDrawerOpen(false)}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs font-semibold px-2.5 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 transition-all"
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
                className={`flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl border transition-all active:scale-[0.97] ${
                  isActive
                    ? 'bg-[#eaf3ff] border-transparent dark:bg-blue-950/20 text-[#007aff] dark:text-[#60a5fa] font-bold'
                    : 'bg-[#f2f2f7] border-transparent dark:bg-zinc-800 text-slate-550 dark:text-slate-450 hover:bg-slate-100 dark:hover:bg-zinc-750'
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
        className="fixed bottom-0 left-0 right-0 z-40 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border-t border-[var(--border-subtle)] shadow-sm md:hidden pb-safe"
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
                className={`relative flex-1 flex flex-col items-center justify-center gap-0.5 h-full transition-all duration-200 active:scale-[0.97] outline-none ${
                  isActive
                    ? 'text-[#007aff] dark:text-[#60a5fa] font-bold'
                    : 'text-slate-400 dark:text-slate-500 active:text-slate-650 dark:active:text-slate-300'
                }`}
              >
                {/* Active pill bubble */}
                {isActive && (
                  <div className="absolute inset-x-2 top-2 bottom-2 rounded-xl bg-[#eaf3ff] dark:bg-blue-950/20" />
                )}
                <div className={`transition-all duration-200 relative z-10 ${isActive ? 'scale-110' : ''} relative`}>
                  {tab.icon}
                  {tab.id === 'home' && alertCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 min-w-[14px] h-[14px] rounded-full bg-[#ff3b30] text-white text-[8px] font-bold flex items-center justify-center px-0.5 leading-none">
                      {alertCount > 9 ? '9+' : alertCount}
                    </span>
                  )}
                </div>
                <span className={`text-[9px] font-semibold tracking-wide leading-none transition-all duration-200 relative z-10 ${
                  isActive
                    ? 'text-[#007aff] dark:text-[#60a5fa]'
                    : 'text-slate-450 dark:text-slate-500'
                }`}>
                  {tab.label}
                </span>
              </button>
            );
          })}

          {/* More Tab */}
          <button
            onClick={() => setIsDrawerOpen(!isDrawerOpen)}
            aria-expanded={isDrawerOpen}
            className={`relative flex-1 flex flex-col items-center justify-center gap-0.5 h-full transition-all duration-200 active:scale-[0.97] outline-none ${
              isMoreActive || isDrawerOpen
                ? 'text-[#007aff] dark:text-[#60a5fa] font-bold'
                : 'text-slate-455 dark:text-slate-500 active:text-slate-650 dark:active:text-slate-300'
            }`}
          >
            {/* Active pill bubble */}
            {(isMoreActive || isDrawerOpen) && (
              <div className="absolute inset-x-2 top-2 bottom-2 rounded-xl bg-[#eaf3ff] dark:bg-blue-950/20" />
            )}
            <div className={`transition-all duration-200 ${isMoreActive || isDrawerOpen ? 'scale-110 rotate-180' : ''} relative z-10`}>
              <ChevronUp size={18} />
            </div>
            <span className={`text-[9px] font-semibold tracking-wide leading-none transition-all duration-200 relative z-10 ${
              isMoreActive || isDrawerOpen
                ? 'text-[#007aff] dark:text-[#60a5fa]'
                : 'text-slate-455 dark:text-slate-500'
            }`}>
              More
            </span>
          </button>
        </div>
      </nav>
    </>
  );
}

export default React.memo(MobileBottomNav);
