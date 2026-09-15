import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  Home as HomeIcon,
  TrendingUp,
  Landmark,
  Wallet,
  Coins,
  Building2,
  Shield,
  FolderOpen,
  Clock,
  ChevronRight,
  X,
  Sparkles,
  Menu,
} from './icons/AppIcons';
import { triggerHaptic } from '../utils/haptics';

type AssetTab = 'home' | 'stocks' | 'fd' | 'rd' | 'sip' | 'gold' | 'real_estate' | 'insurance' | 'documents' | 'widgets' | 'tax';

interface MobileBottomNavProps {
  activeAsset: AssetTab;
  onChangeAsset: (tab: AssetTab) => void;
  alertCount?: number;
  onOpenSmartImport?: () => void;
  onAddStock?: () => void;
  onAddAsset?: (type: 'fd' | 'rd' | 'sip' | 'gold' | 'real_estate' | 'insurance' | 'documents') => void;
  onDrawerStateChange?: (isOpen: boolean) => void;
}

/* ── More drawer tab definitions ─────────────────────────────────────────── */
const moreTabs: { id: AssetTab; label: string; subtext: string; icon: React.ReactNode; color: string }[] = [
  { id: 'rd',          label: 'Recurring Deposits',  subtext: 'Quarterly compounding RD accounts',   icon: <Clock size={18} />,      color: '#06b6d4' },
  { id: 'gold',        label: 'Gold Holdings',        subtext: 'Physical & digital gold bullion',     icon: <Coins size={18} />,      color: '#f59e0b' },
  { id: 'real_estate', label: 'Real Estate',          subtext: 'Properties, plots & rental yields',  icon: <Building2 size={18} />,  color: '#10b981' },
  { id: 'insurance',   label: 'Insurance Policies',   subtext: 'Life, health & vehicle policies',    icon: <Shield size={18} />,     color: '#8b5cf6' },
  { id: 'documents',   label: 'Document Vault',       subtext: 'Digital receipts & policy bonds',    icon: <FolderOpen size={18} />, color: '#f97316' },
  { id: 'tax',         label: 'Tax Harvesting',       subtext: 'LTCG / STCG tax optimisation',       icon: <TrendingUp size={18} />, color: '#ef4444' },
];

/* ── Main tab list ───────────────────────────────────────────────────────── */
const mainTabs: { id: AssetTab; label: string }[] = [
  { id: 'home',   label: 'Home' },
  { id: 'stocks', label: 'Stocks' },
  { id: 'sip',    label: 'Mutual Funds' },
  { id: 'fd',     label: 'Deposits' },
];

/* ── Individual tab button ───────────────────────────────────────────────── */
function TabBtn({
  label, isActive, badge, onClick, icon, activeIcon,
}: {
  id: AssetTab; label: string; isActive: boolean;
  badge?: number; onClick: () => void;
  icon: React.ReactNode; activeIcon: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={isActive ? 'page' : undefined}
      aria-label={label}
      className="relative flex-1 flex flex-col items-center justify-center touch-manipulation outline-none cursor-pointer select-none"
      style={{ WebkitTapHighlightColor: 'transparent', gap: 4, paddingTop: 10, paddingBottom: 6 }}
    >
      <span className="relative flex items-center justify-center">
        {/* Springy pill indicator — solid accent fill for clear visibility */}
        <span
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: 999,
            padding: '7px 20px',
            background: isActive ? 'var(--accent-blue-soft, rgba(0,122,255,0.18))' : 'transparent',
            border: isActive ? '1px solid rgba(0,122,255,0.22)' : '1px solid transparent',
            transform: isActive ? 'scale(1)' : 'scale(0.4)',
            opacity: isActive ? 1 : 0,
            transition: 'transform 0.32s cubic-bezier(0.34,1.56,0.64,1), opacity 0.22s ease',
          }}
        />
        {/* Icon */}
        <span
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '7px 20px', borderRadius: 999,
            color: isActive ? 'var(--accent-blue)' : 'var(--text-secondary)',
            transform: isActive ? 'scale(1.12)' : 'scale(1)',
            transition: 'transform 0.3s cubic-bezier(0.34,1.56,0.64,1), color 0.18s ease',
            position: 'relative', zIndex: 1,
          }}
        >
          {isActive ? activeIcon : icon}
        </span>
        {/* Badge */}
        {badge != null && badge > 0 && (
          <span
            role="status"
            aria-label={`${badge} notifications`}
            style={{
              position: 'absolute', top: 0, right: 4,
              minWidth: 18, height: 18, borderRadius: 999,
              background: 'var(--negative, #ef4444)', color: '#fff',
              fontSize: 10, fontWeight: 800,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: '0 4px', zIndex: 2,
              boxShadow: '0 0 0 2.5px var(--surface, #fff)',
            }}
          >
            {badge > 9 ? '9+' : badge}
          </span>
        )}
      </span>
      {/* Label */}
      <span
        style={{
          fontSize: 11, fontWeight: isActive ? 700 : 500,
          letterSpacing: isActive ? '-0.02em' : '-0.01em',
          color: isActive ? 'var(--accent-blue)' : 'var(--text-secondary)',
          transition: 'color 0.18s ease', lineHeight: 1,
          maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          paddingInline: 2,
        }}
      >
        {label}
      </span>
    </button>
  );
}

/* ── "More" tab button with rotating grid icon ──────────────────────────── */
function MoreTabBtn({ isActive, isOpen, onClick }: { isActive: boolean; isOpen: boolean; onClick: () => void }) {
  const lit = isActive || isOpen;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-expanded={isOpen}
      aria-label={isActive ? `More (active)` : 'More asset categories'}
      className="relative flex-1 flex flex-col items-center justify-center touch-manipulation outline-none cursor-pointer select-none"
      style={{ WebkitTapHighlightColor: 'transparent', gap: 4, paddingTop: 10, paddingBottom: 6 }}
    >
      <span className="relative flex items-center justify-center">
        <span
          aria-hidden="true"
          style={{
            position: 'absolute', inset: 0, borderRadius: 999, padding: '7px 20px',
            background: lit ? 'var(--accent-blue-soft, rgba(0,122,255,0.18))' : 'transparent',
            border: lit ? '1px solid rgba(0,122,255,0.22)' : '1px solid transparent',
            transform: lit ? 'scale(1)' : 'scale(0.4)',
            opacity: lit ? 1 : 0,
            transition: 'transform 0.32s cubic-bezier(0.34,1.56,0.64,1), opacity 0.22s ease',
          }}
        />
        <span
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '7px 20px', borderRadius: 999,
            color: lit ? 'var(--accent-blue)' : 'var(--text-secondary)',
            transform: isOpen ? 'rotate(90deg) scale(1.12)' : lit ? 'scale(1.12)' : 'scale(1)',
            transition: 'transform 0.32s cubic-bezier(0.34,1.56,0.64,1), color 0.18s ease',
            position: 'relative', zIndex: 1,
          }}
        >
          <Menu size={24} aria-hidden="true" />
        </span>
      </span>
      <span
        style={{
          fontSize: 11, fontWeight: lit ? 700 : 500,
          letterSpacing: lit ? '-0.02em' : '-0.01em',
          color: lit ? 'var(--accent-blue)' : 'var(--text-secondary)',
          transition: 'color 0.18s ease', lineHeight: 1, whiteSpace: 'nowrap',
        }}
      >
        More
      </span>
    </button>
  );
}

/* ── Main component ──────────────────────────────────────────────────────── */
function MobileBottomNav({
  activeAsset, onChangeAsset, alertCount = 0, onOpenSmartImport, onDrawerStateChange,
}: MobileBottomNavProps) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [sheetIn,      setSheetIn]      = useState(false);
  const isDrawerOpenRef = useRef(isDrawerOpen);
  useEffect(() => { isDrawerOpenRef.current = isDrawerOpen; }, [isDrawerOpen]);

  const openDrawer = useCallback(() => {
    setIsDrawerOpen(true);
    requestAnimationFrame(() => requestAnimationFrame(() => setSheetIn(true)));
  }, []);

  const closeDrawer = useCallback(() => {
    setSheetIn(false);
    const id = setTimeout(() => setIsDrawerOpen(false), 330);
    return () => clearTimeout(id);
  }, []);

  // Scroll lock + parent notify
  useEffect(() => {
    onDrawerStateChange?.(isDrawerOpen);
    document.body.style.overflow = isDrawerOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isDrawerOpen, onDrawerStateChange]);

  // Close on navigation
  useEffect(() => { if (isDrawerOpen) closeDrawer(); }, [activeAsset]); // eslint-disable-line react-hooks/exhaustive-deps

  // Escape key
  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === 'Escape' && isDrawerOpenRef.current) closeDrawer(); };
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, [closeDrawer]);

  const handleMoreTabClick = useCallback((tabId: typeof moreTabs[number]['id']) => {
    triggerHaptic('selection');
    onChangeAsset(tabId);
  }, [onChangeAsset]);

  const toggleDrawer = useCallback(() => {
    triggerHaptic('selection');
    if (isDrawerOpen) {
      closeDrawer();
    } else {
      openDrawer();
    }
  }, [isDrawerOpen, openDrawer, closeDrawer]);

  const isMoreActive = moreTabs.some((t) => t.id === activeAsset);

  return (
    <>
      {/* Frosted backdrop */}
      {isDrawerOpen && (
        <div
          aria-hidden="true"
          onClick={closeDrawer}
          className="md:hidden"
          style={{
            position: 'fixed', inset: 0, zIndex: 60,
            background: 'rgba(0,0,0,0.44)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            opacity: sheetIn ? 1 : 0,
            transition: 'opacity 0.3s ease',
          }}
        />
      )}

      {/* Liquid Glass More Sheet */}
      {isDrawerOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="All asset categories"
          className="md:hidden"
          style={{
            position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 70,
            background: 'color-mix(in srgb, var(--surface-solid) 82%, transparent)',
            backdropFilter: 'blur(34px) saturate(1.8)',
            WebkitBackdropFilter: 'blur(34px) saturate(1.8)',
            borderTop: '0.5px solid color-mix(in srgb, var(--border-subtle) 60%, transparent)',
            borderRadius: '26px 26px 0 0',
            boxShadow: '0 -14px 60px rgba(0,0,0,0.24)',
            transform: sheetIn ? 'translateY(0)' : 'translateY(100%)',
            transition: 'transform 0.33s cubic-bezier(0.32,0.72,0,1)',
            willChange: 'transform',
            paddingBottom: 'calc(env(safe-area-inset-bottom,0px) + 68px)',
            maxHeight: '82vh',
            display: 'flex', flexDirection: 'column',
          }}
        >
          <span className="sr-only" role="status" aria-live="polite">More asset categories drawer opened</span>

          {/* Drag handle */}
          <div style={{ width: 36, height: 4, borderRadius: 999, background: 'color-mix(in srgb,var(--border-subtle) 80%,transparent)', margin: '10px auto 0', flexShrink: 0 }} aria-hidden="true" />

          {/* Sheet header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px 8px', flexShrink: 0 }}>
            <div>
              <p style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.022em', lineHeight: 1.1 }}>More</p>
              <p style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 1 }}>Asset categories</p>
            </div>
            <button
              type="button"
              onClick={closeDrawer}
              aria-label="Close"
              style={{
                width: 30, height: 30, borderRadius: 999,
                background: 'color-mix(in srgb, var(--text-tertiary) 14%, transparent)',
                border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--text-secondary)', cursor: 'pointer', flexShrink: 0,
              }}
            >
              <X size={15} aria-hidden="true" />
            </button>
          </div>

          {/* Smart Import banner */}
          {onOpenSmartImport && (
            <div style={{ padding: '0 14px 10px', flexShrink: 0 }}>
              <button
                type="button"
                onClick={() => { triggerHaptic('selection'); closeDrawer(); onOpenSmartImport(); }}
                style={{
                  width: '100%',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '11px 14px', borderRadius: 16,
                  background: 'linear-gradient(135deg,color-mix(in srgb,#06b6d4 14%,transparent),color-mix(in srgb,#8b5cf6 14%,transparent))',
                  border: '1px solid color-mix(in srgb,var(--accent-blue) 28%,transparent)',
                  cursor: 'pointer', outline: 'none', WebkitTapHighlightColor: 'transparent',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                    background: 'linear-gradient(135deg,#06b6d4,#8b5cf6)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 4px 12px rgba(139,92,246,0.35)',
                  }}>
                    <span style={{ color: '#fff', display: 'flex' }}><Sparkles size={18} aria-hidden="true" /></span>
                  </div>
                  <div style={{ textAlign: 'left' }}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>✨ Smart AI Import</p>
                    <p style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 1 }}>Auto-extract details from a doc or photo</p>
                  </div>
                </div>
                <span style={{ color: 'var(--text-tertiary)', flexShrink: 0, display: 'flex' }}><ChevronRight size={14} aria-hidden="true" /></span>
              </button>
            </div>
          )}

          {/* Divider */}
          <div style={{ height: 1, background: 'var(--border-subtle)', opacity: 0.45, marginInline: 14, flexShrink: 0 }} />

          {/* Category rows */}
          <div style={{ overflowY: 'auto', padding: '8px 10px 4px', flex: 1 }}>
            {moreTabs.map((tab) => {
              const active = activeAsset === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => handleMoreTabClick(tab.id)}
                  style={{
                    width: '100%',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '10px 12px', marginBottom: 5, borderRadius: 14,
                    background: active ? `color-mix(in srgb,${tab.color} 13%,transparent)` : 'transparent',
                    border: `1px solid ${active ? `color-mix(in srgb,${tab.color} 32%,transparent)` : 'transparent'}`,
                    cursor: 'pointer', outline: 'none', textAlign: 'left',
                    transition: 'background 0.18s ease, border-color 0.18s ease',
                    WebkitTapHighlightColor: 'transparent',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 13, minWidth: 0 }}>
                    <div style={{
                      width: 38, height: 38, borderRadius: 11, flexShrink: 0,
                      background: active ? tab.color : `color-mix(in srgb,${tab.color} 18%,var(--surface-secondary))`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: active ? '#fff' : tab.color,
                      boxShadow: active ? `0 4px 14px color-mix(in srgb,${tab.color} 40%,transparent)` : 'none',
                      transition: 'background 0.2s ease, box-shadow 0.2s ease',
                    }}>
                      {tab.icon}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <p style={{
                        fontSize: 14, fontWeight: active ? 700 : 600,
                        color: active ? tab.color : 'var(--text-primary)',
                        letterSpacing: '-0.01em',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>{tab.label}</p>
                      <p style={{
                        fontSize: 11, color: 'var(--text-tertiary)', marginTop: 1,
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>{tab.subtext}</p>
                    </div>
                  </div>
                  <span style={{ color: active ? tab.color : 'var(--text-tertiary)', flexShrink: 0, display: 'flex' }}><ChevronRight size={14} aria-hidden="true" /></span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Liquid Glass Tab Bar ─────────────────────────────────────────── */}
      <nav
        aria-label="Mobile Navigation"
        className="md:hidden"
        style={{
          position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50,
          /* Solid frosted glass — opaque enough to always be visible */
          background: 'var(--surface, #fff)',
          backdropFilter: 'blur(24px) saturate(1.6)',
          WebkitBackdropFilter: 'blur(24px) saturate(1.6)',
          borderTop: '1px solid var(--border-subtle, rgba(0,0,0,0.1))',
          boxShadow: '0 -4px 24px rgba(0,0,0,0.12), 0 -1px 0 rgba(0,0,0,0.06)',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
          willChange: 'transform', transform: 'translateZ(0)', userSelect: 'none',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'stretch', height: 62, maxWidth: 480, margin: '0 auto', paddingInline: 4 }}>
          {mainTabs.map((tab) => (
            <TabBtn
              key={tab.id}
              id={tab.id}
              label={tab.label}
              isActive={activeAsset === tab.id}
              badge={tab.id === 'home' && alertCount > 0 ? alertCount : undefined}
              onClick={() => { triggerHaptic('selection'); onChangeAsset(tab.id); if (isDrawerOpen) closeDrawer(); }}
              icon={
                tab.id === 'home'   ? <HomeIcon size={24} aria-hidden="true" />   :
                tab.id === 'stocks' ? <TrendingUp size={24} aria-hidden="true" /> :
                tab.id === 'sip'    ? <Wallet size={24} aria-hidden="true" />     :
                                      <Landmark size={24} aria-hidden="true" />
              }
              activeIcon={
                tab.id === 'home'
                  ? <HomeIcon size={24} className="fill-[var(--accent-blue)] stroke-[var(--accent-blue)]" aria-hidden="true" />
                  : tab.id === 'stocks'
                    ? <TrendingUp size={24} className="stroke-[var(--accent-blue)]" aria-hidden="true" />
                    : tab.id === 'sip'
                      ? <Wallet size={24} className="stroke-[var(--accent-blue)]" aria-hidden="true" />
                      : <Landmark size={24} className="stroke-[var(--accent-blue)]" aria-hidden="true" />
              }
            />
          ))}
          <MoreTabBtn isActive={isMoreActive} isOpen={isDrawerOpen} onClick={toggleDrawer} />
        </div>
      </nav>
    </>
  );
}

export default React.memo(MobileBottomNav);
