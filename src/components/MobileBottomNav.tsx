import React, { useEffect, useState } from 'react';
import { Home as HomeIcon, TrendingUp, Landmark, Coins, Building2, Shield, FolderOpen, Clock, ChevronUp, Calculator as CalculatorIcon, ChevronRight, X } from './icons/AppIcons';

type AssetTab = 'home' | 'stocks' | 'fd' | 'rd' | 'sip' | 'gold' | 'real_estate' | 'insurance' | 'documents' | 'widgets' | 'what_if' | 'tax';

interface MobileBottomNavProps {
  activeAsset: AssetTab;
  onChangeAsset: (tab: AssetTab) => void;
  alertCount?: number;
}

const mainTabs: { id: AssetTab; label: string; icon: React.ReactNode }[] = [
  { id: 'home', label: 'Home', icon: <HomeIcon size={18} /> },
  { id: 'stocks', label: 'Stocks', icon: <TrendingUp size={18} /> },
  { id: 'fd', label: 'FDs', icon: <Landmark size={18} /> },
];

const moreTabs: { id: AssetTab; label: string; icon: React.ReactNode }[] = [
  { id: 'rd', label: 'Recurring Deposits', icon: <Clock size={18} /> },
  { id: 'sip', label: 'SIP Mutual Funds', icon: <TrendingUp size={18} /> },
  { id: 'gold', label: 'Gold Holdings', icon: <Coins size={18} /> },
  { id: 'real_estate', label: 'Real Estate Properties', icon: <Building2 size={18} /> },
  { id: 'insurance', label: 'Insurance Policies', icon: <Shield size={18} /> },
  { id: 'documents', label: 'Document Vault', icon: <FolderOpen size={18} /> },
  { id: 'what_if', label: 'What-If Calculator', icon: <CalculatorIcon size={18} /> },
];

function MobileBottomNav({ activeAsset, onChangeAsset, alertCount = 0 }: MobileBottomNavProps) {
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
        className={`fixed inset-0 z-30 transition-opacity duration-200 md:hidden bg-[var(--backdrop-overlay)] ${
          isDrawerOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setIsDrawerOpen(false)}
        aria-hidden="true"
      />

      {/* More Drawer - Compact Vertical List */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="More Asset Classes"
        className={`fixed bottom-14 left-0 right-0 z-30 bg-[var(--surface)] border-t border-[var(--border-subtle)] rounded-t-[var(--radius-large)] shadow-xl p-4 md:hidden pb-safe transition-transform duration-250 ease-out apple-card ${
          isDrawerOpen ? 'translate-y-0' : 'translate-y-full pointer-events-none'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 mb-2 border-b border-[var(--border-subtle)]">
          <h4 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">
            All Asset Categories
          </h4>
          <button
            onClick={() => setIsDrawerOpen(false)}
            className="w-10 h-10 flex items-center justify-center text-[var(--text-tertiary)] hover:text-[var(--text-primary)] rounded-[var(--radius-medium)] hover:bg-[var(--surface-secondary)] transition-colors outline-none ios-press"
            aria-label="Close menu"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        {/* Compact Vertical List */}
        <div className="space-y-1 max-h-[60vh] overflow-y-auto">
          {moreTabs.map((tab) => {
            const isActive = activeAsset === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  onChangeAsset(tab.id);
                  setIsDrawerOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 min-h-[44px] py-2 rounded-[var(--radius-medium)] ios-press transition-colors text-left outline-none ${
                  isActive
                    ? 'bg-[var(--accent-blue-soft)] text-[var(--accent-blue)] font-bold'
                    : 'text-[var(--text-primary)] hover:bg-[var(--surface-secondary)]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-7 h-7 rounded-[var(--radius-small)] flex items-center justify-center ${
                    isActive ? 'bg-[var(--accent-blue)] text-[var(--surface)]' : 'bg-[var(--surface-secondary)] text-[var(--text-secondary)]'
                  }`}>
                    {tab.icon}
                  </div>
                  <span className="text-xs font-bold">{tab.label}</span>
                </div>
                <ChevronRight size={15} className="text-[var(--text-tertiary)]" aria-hidden="true" />
              </button>
            );
          })}
        </div>
      </div>

      {/* Persistent Bottom Bar - Quiet Top Line Active Indicator */}
      <nav
        aria-label="Mobile Navigation"
        className="fixed bottom-0 left-0 right-0 z-40 bg-[var(--surface)] border-t border-[var(--border-subtle)] min-h-[56px] md:hidden pb-safe shadow-md"
      >
        <div className="flex items-center justify-around h-14 max-w-lg mx-auto px-2">
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
                className={`relative flex-1 flex flex-col items-center justify-center h-full min-h-[44px] ios-press transition-colors outline-none ${
                  isActive
                    ? 'text-[var(--accent-blue)] font-bold border-t-2 border-[var(--accent-blue)]'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] border-t-2 border-transparent'
                }`}
              >
                <div className="relative">
                  {tab.icon}
                  {tab.id === 'home' && alertCount > 0 && (
                    <span 
                      className="absolute -top-1 -right-1.5 min-w-[14px] h-[14px] rounded-[var(--radius-pill)] bg-[var(--negative)] text-[var(--surface)] text-[9px] font-bold flex items-center justify-center px-0.5 leading-none"
                      aria-label={`${alertCount} notifications`}
                    >
                      {alertCount > 9 ? '9+' : alertCount}
                    </span>
                  )}
                </div>
                <span className="text-xs font-bold tracking-wide mt-0.5">
                  {tab.label}
                </span>
              </button>
            );
          })}

          {/* More Tab */}
          <button
            onClick={() => setIsDrawerOpen(!isDrawerOpen)}
            aria-expanded={isDrawerOpen}
            className={`relative flex-1 flex flex-col items-center justify-center h-full min-h-[44px] ios-press transition-colors outline-none ${
              isMoreActive || isDrawerOpen
                ? 'text-[var(--accent-blue)] font-bold border-t-2 border-[var(--accent-blue)]'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] border-t-2 border-transparent'
            }`}
          >
            <ChevronUp size={18} className={`transition-transform duration-250 ${isDrawerOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
            <span className="text-xs font-bold tracking-wide mt-0.5">
              More
            </span>
          </button>
        </div>
      </nav>
    </>
  );
}

export default React.memo(MobileBottomNav);
