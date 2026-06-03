import React from 'react';
import { Home as HomeIcon, TrendingUp, Landmark, Coins, Building2, Shield, FolderOpen } from 'lucide-react';

type AssetTab = 'home' | 'stocks' | 'fd' | 'gold' | 'real_estate' | 'insurance' | 'documents';

interface MobileBottomNavProps {
  activeAsset: AssetTab;
  onChangeAsset: (tab: AssetTab) => void;
  /** Number of active (non-dismissed) alerts to show as a badge on the Home tab */
  alertCount?: number;
}

const tabs: { id: AssetTab; label: string; icon: React.ReactNode }[] = [
  { id: 'home', label: 'Home', icon: <HomeIcon size={18} /> },
  { id: 'stocks', label: 'Stocks', icon: <TrendingUp size={18} /> },
  { id: 'fd', label: 'FDs', icon: <Landmark size={18} /> },
  { id: 'gold', label: 'Gold', icon: <Coins size={18} /> },
  { id: 'real_estate', label: 'Realty', icon: <Building2 size={18} /> },
  { id: 'insurance', label: 'Cover', icon: <Shield size={18} /> },
  { id: 'documents', label: 'Docs', icon: <FolderOpen size={18} /> },
];

function MobileBottomNav({ activeAsset, onChangeAsset, alertCount = 0 }: MobileBottomNavProps) {
  return (
    <nav
      role="navigation"
      aria-label="Asset navigation"
      className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-700 md:hidden pb-safe"
    >
      <div className="grid grid-cols-7 h-14">
        {tabs.map((tab) => {
          const isActive = activeAsset === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onChangeAsset(tab.id)}
              aria-current={isActive ? 'page' : undefined}
              className={`relative flex flex-col items-center justify-center gap-1 transition-all duration-150 active:scale-95 outline-none ${
                isActive
                  ? 'text-blue-600 dark:text-blue-400 font-bold'
                  : 'text-slate-400 dark:text-slate-500 active:text-slate-600 dark:active:text-slate-350'
              }`}
            >
              <div className={`transition-transform duration-200 ${isActive ? 'scale-110 -translate-y-0.5' : ''} relative`}>
                {tab.icon}
                {tab.id === 'home' && alertCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 min-w-[14px] h-[14px] rounded-full bg-red-500 text-white text-[8px] font-bold flex items-center justify-center px-0.5 leading-none">
                    {alertCount > 9 ? '9+' : alertCount}
                  </span>
                )}
              </div>
              <span className={`text-[9px] font-semibold tracking-wide leading-none transition-all duration-150 ${
                isActive
                  ? 'text-blue-600 dark:text-blue-400'
                  : 'text-slate-400 dark:text-slate-500'
              }`}>
                {tab.label}
              </span>
              {isActive && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-blue-600 dark:bg-blue-400 rounded-full animate-pulse" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

export default React.memo(MobileBottomNav);
