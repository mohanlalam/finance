import React, { useEffect, useState } from 'react';
import { Home as HomeIcon, TrendingUp, Landmark, Wallet, Menu, Coins, Building2, Shield, FolderOpen, Clock, ChevronRight, X, Sparkles } from './icons/AppIcons';
import { triggerHaptic } from '../utils/haptics';

type AssetTab = 'home' | 'stocks' | 'fd' | 'rd' | 'sip' | 'gold' | 'real_estate' | 'insurance' | 'documents' | 'widgets' | 'tax';

interface MobileBottomNavProps {
  activeAsset: AssetTab;
  onChangeAsset: (tab: AssetTab) => void;
  alertCount?: number;
  onOpenSmartImport?: () => void;
}

const mainTabs: { id: AssetTab; label: string; icon: (isActive: boolean) => React.ReactNode }[] = [
  { 
    id: 'home', 
    label: 'Home', 
    icon: (isActive) => <HomeIcon size={20} className={isActive ? 'fill-[var(--accent-blue)] stroke-[var(--accent-blue)]' : ''} /> 
  },
  { 
    id: 'stocks', 
    label: 'Stocks', 
    icon: () => <TrendingUp size={20} /> 
  },
  { 
    id: 'sip', 
    label: 'SIP & MF', 
    icon: () => <Wallet size={20} /> 
  },
  { 
    id: 'fd', 
    label: 'Deposits', 
    icon: () => <Landmark size={20} /> 
  },
];

const moreTabs: { id: AssetTab; label: string; subtext: string; icon: React.ReactNode }[] = [
  { id: 'rd', label: 'Recurring Deposits', subtext: 'Quarterly compounding RD accounts', icon: <Clock size={18} /> },
  { id: 'gold', label: 'Gold Holdings', subtext: 'Physical & digital gold bullion', icon: <Coins size={18} /> },
  { id: 'real_estate', label: 'Real Estate', subtext: 'Properties, plots & rental yields', icon: <Building2 size={18} /> },
  { id: 'insurance', label: 'Insurance Policies', subtext: 'Life, health & vehicle policies', icon: <Shield size={18} /> },
  { id: 'documents', label: 'Document Vault', subtext: 'Digital receipts & policy bonds', icon: <FolderOpen size={18} /> },
  { id: 'tax', label: 'Tax Harvesting', subtext: 'LTCG / STCG tax optimization', icon: <TrendingUp size={18} /> },
];

function MobileBottomNav({ activeAsset, onChangeAsset, alertCount = 0, onOpenSmartImport }: MobileBottomNavProps) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Close drawer when active asset changes
  useEffect(() => {
    setIsDrawerOpen(false);
  }, [activeAsset]);

  // Trap Escape key for accessibility
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isDrawerOpen) {
        setIsDrawerOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDrawerOpen]);

  const isMoreActive = moreTabs.some((tab) => tab.id === activeAsset);

  return (
    <>
      {/* Backdrop for More Drawer */}
      <div
        className={`fixed inset-0 z-40 transition-opacity duration-200 md:hidden bg-black/50 backdrop-blur-xs ${
          isDrawerOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setIsDrawerOpen(false)}
        aria-hidden="true"
      />

      {/* More Drawer - Bottom Sheet */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="All Asset Categories"
        className={`fixed left-0 right-0 z-50 bg-[var(--surface)] border-t border-[var(--border-subtle)] rounded-t-2xl shadow-2xl p-4 md:hidden transition-transform duration-250 ease-out max-w-lg mx-auto ${
          isDrawerOpen ? 'translate-y-0 pointer-events-auto' : 'translate-y-full pointer-events-none'
        }`}
        style={{
          bottom: 'calc(56px + env(safe-area-inset-bottom, 0px))',
          maxHeight: 'calc(80vh - 56px)',
        }}
      >
        {/* Header with Drag Handle */}
        <div className="w-10 h-1 rounded-full bg-[var(--border-subtle)] mx-auto mb-3" aria-hidden="true" />
        <div className="flex items-center justify-between pb-3 mb-2 border-b border-[var(--border-subtle)]">
          <div>
            <h4 className="text-xs font-extrabold text-[var(--text-primary)] uppercase tracking-wider">
              More Asset Classes
            </h4>
            <p className="text-[11px] text-[var(--text-tertiary)]">Select category to view details</p>
          </div>
          <button
            type="button"
            onClick={() => setIsDrawerOpen(false)}
            className="w-8 h-8 flex items-center justify-center text-[var(--text-tertiary)] hover:text-[var(--text-primary)] rounded-[var(--radius-medium)] hover:bg-[var(--surface-secondary)] transition-colors outline-none cursor-pointer"
            aria-label="Close menu"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        {/* Quick Smart AI Import Option inside More Drawer */}
        {onOpenSmartImport && (
          <button
            type="button"
            onClick={() => {
              triggerHaptic('selection');
              setIsDrawerOpen(false);
              onOpenSmartImport();
            }}
            className="w-full flex items-center justify-between p-3 mb-3 bg-gradient-to-r from-amber-500/15 to-amber-600/15 border border-amber-500/30 rounded-[var(--radius-medium)] text-amber-800 dark:text-amber-300 ios-press cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-amber-500 text-white flex items-center justify-center shrink-0">
                <Sparkles size={16} />
              </div>
              <div className="text-left">
                <p className="text-xs font-bold text-slate-800 dark:text-slate-100">✨ Smart AI Import</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Scan FD, Gold, or Insurance photo/PDF</p>
              </div>
            </div>
            <ChevronRight size={16} className="text-amber-500 shrink-0" />
          </button>
        )}

        {/* Compact Vertical List */}
        <div className="space-y-1.5 overflow-y-auto max-h-[50vh] pr-1">
          {moreTabs.map((tab) => {
            const isActive = activeAsset === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  onChangeAsset(tab.id);
                  setIsDrawerOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 min-h-[48px] py-2.5 rounded-[var(--radius-medium)] transition-colors text-left outline-none cursor-pointer active:scale-[0.99] ${
                  isActive
                    ? 'bg-[var(--accent-blue-soft)] text-[var(--accent-blue)] font-bold border border-[var(--accent-blue)]/30'
                    : 'text-[var(--text-primary)] hover:bg-[var(--surface-secondary)] border border-transparent'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-8 h-8 rounded-[var(--radius-small)] flex items-center justify-center shrink-0 ${
                    isActive ? 'bg-[var(--accent-blue)] text-white' : 'bg-[var(--surface-secondary)] text-[var(--text-secondary)]'
                  }`}>
                    {tab.icon}
                  </div>
                  <div className="min-w-0">
                    <span className="text-xs font-bold block truncate">{tab.label}</span>
                    <span className="text-[10px] text-[var(--text-tertiary)] block truncate font-normal">{tab.subtext}</span>
                  </div>
                </div>
                <ChevronRight size={15} className={`shrink-0 ${isActive ? 'text-[var(--accent-blue)]' : 'text-[var(--text-tertiary)]'}`} aria-hidden="true" />
              </button>
            );
          })}
        </div>
      </div>

      {/* Persistent Bottom Bar */}
      <nav
        aria-label="Mobile Navigation"
        className="fixed bottom-0 left-0 right-0 z-50 bg-[var(--surface)] border-t border-[var(--border-subtle)] md:hidden shadow-[0_-2px_10px_rgba(0,0,0,0.05)] select-none will-change-transform transform-gpu"
        style={{
          paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 0px)',
        }}
      >
        <div className="flex items-center justify-around h-14 max-w-lg mx-auto px-1">
          {mainTabs.map((tab) => {
            const isActive = activeAsset === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  triggerHaptic('selection');
                  onChangeAsset(tab.id);
                  setIsDrawerOpen(false);
                }}
                aria-current={isActive ? 'page' : undefined}
                className={`relative flex-1 flex flex-col items-center justify-center h-full py-1 min-h-[48px] touch-manipulation transition-all duration-150 outline-none cursor-pointer active:scale-95 ${
                  isActive
                    ? 'text-[var(--accent-blue)]'
                    : 'text-[var(--text-tertiary)] hover:text-[var(--text-primary)]'
                }`}
              >
                <div className="relative flex items-center justify-center mb-0.5">
                  {tab.icon(isActive)}
                  {tab.id === 'home' && alertCount > 0 && (
                    <span 
                      className="absolute -top-1 -right-2 min-w-[15px] h-[15px] rounded-full bg-[var(--negative)] text-white text-[9px] font-extrabold flex items-center justify-center px-1 leading-none shadow-xs"
                      aria-label={`${alertCount} notifications`}
                    >
                      {alertCount > 9 ? '9+' : alertCount}
                    </span>
                  )}
                </div>
                <span className={`text-[11px] tracking-tight leading-tight max-w-full truncate px-0.5 ${isActive ? 'font-bold text-[var(--accent-blue)]' : 'font-medium text-[var(--text-secondary)]'}`}>
                  {tab.label}
                </span>
              </button>
            );
          })}

          {/* More Tab */}
          <button
            type="button"
            onClick={() => {
              triggerHaptic('selection');
              setIsDrawerOpen(!isDrawerOpen);
            }}
            aria-expanded={isDrawerOpen}
            className={`relative flex-1 flex flex-col items-center justify-center h-full py-1 min-h-[48px] touch-manipulation transition-all duration-150 outline-none cursor-pointer active:scale-95 ${
              isMoreActive || isDrawerOpen
                ? 'text-[var(--accent-blue)]'
                : 'text-[var(--text-tertiary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <div className="relative flex items-center justify-center mb-0.5">
              <Menu size={20} aria-hidden="true" />
            </div>
            <span className={`text-[11px] tracking-tight leading-tight max-w-full truncate px-0.5 ${isMoreActive || isDrawerOpen ? 'font-bold text-[var(--accent-blue)]' : 'font-medium text-[var(--text-secondary)]'}`}>
              More
            </span>
          </button>
        </div>
      </nav>
    </>
  );
}

export default React.memo(MobileBottomNav);
