import React from 'react';
import { TrendingUp, Landmark, Coins, Home as HomeIcon, Shield, FolderOpen } from 'lucide-react';

type AssetTab = 'stocks' | 'fd' | 'gold' | 'real_estate' | 'insurance' | 'documents';

interface MobileBottomNavProps {
  activeAsset: AssetTab;
  onChangeAsset: (tab: AssetTab) => void;
}

const tabs: { id: AssetTab; label: string; icon: React.ReactNode }[] = [
  { id: 'stocks', label: 'Stocks', icon: <TrendingUp size={18} /> },
  { id: 'fd', label: 'FDs', icon: <Landmark size={18} /> },
  { id: 'gold', label: 'Gold', icon: <Coins size={18} /> },
  { id: 'real_estate', label: 'Realty', icon: <HomeIcon size={18} /> },
  { id: 'insurance', label: 'Cover', icon: <Shield size={18} /> },
  { id: 'documents', label: 'Docs', icon: <FolderOpen size={18} /> },
];

function MobileBottomNav({ activeAsset, onChangeAsset }: MobileBottomNavProps) {
  return (
    <nav
      role="navigation"
      aria-label="Asset navigation"
      className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-700 md:hidden safe-area-bottom"
    >
      <div className="grid grid-cols-6 h-14">
        {tabs.map((tab) => {
          const isActive = activeAsset === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onChangeAsset(tab.id)}
              aria-current={isActive ? 'page' : undefined}
              className={`flex flex-col items-center justify-center gap-0.5 transition-colors ${
                isActive
                  ? 'text-blue-600 dark:text-blue-400'
                  : 'text-slate-400 dark:text-slate-500 active:text-slate-600 dark:active:text-slate-300'
              }`}
            >
              <div className={`transition-transform duration-150 ${isActive ? 'scale-110' : ''}`}>
                {tab.icon}
              </div>
              <span className={`text-[9px] font-semibold leading-none ${
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
      </div>
    </nav>
  );
}

export default React.memo(MobileBottomNav);
