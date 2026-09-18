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
  onDrawerStateChange?: (isOpen: boolean) => void;
}

/* ── More drawer tab definitions ─────────────────────────────────────────── */
const moreTabs: { id: AssetTab; label: string; subtext: string; icon: React.ReactNode; color: string; gradient: string }[] = [
  { id: 'rd',          label: 'Recurring Deposits',  subtext: 'Quarterly compounding RD accounts',   icon: <Clock size={18} aria-hidden="true" />,      color: '#f97316', gradient: 'linear-gradient(135deg,#fb923c,#c2410c)' },
  { id: 'gold',        label: 'Gold Holdings',        subtext: 'Physical & digital gold bullion',     icon: <Coins size={18} aria-hidden="true" />,      color: '#eab308', gradient: 'linear-gradient(135deg,#facc15,#a16207)' },
  { id: 'real_estate', label: 'Real Estate',          subtext: 'Properties, plots & rental yields',  icon: <Building2 size={18} aria-hidden="true" />,  color: '#22c55e', gradient: 'linear-gradient(135deg,#4ade80,#15803d)' },
  { id: 'insurance',   label: 'Insurance Policies',   subtext: 'Life, health & vehicle policies',    icon: <Shield size={18} aria-hidden="true" />,     color: '#f43f5e', gradient: 'linear-gradient(135deg,#fb7185,#be123c)' },
  { id: 'documents',   label: 'Document Vault',       subtext: 'Digital receipts & policy bonds',    icon: <FolderOpen size={18} aria-hidden="true" />, color: '#3b82f6', gradient: 'linear-gradient(135deg,#60a5fa,#1d4ed8)' },
  { id: 'tax',         label: 'Tax Harvesting',       subtext: 'LTCG / STCG tax optimisation',       icon: <TrendingUp size={18} aria-hidden="true" />, color: '#10b981', gradient: 'linear-gradient(135deg,#34d399,#047857)' },
];

/* ── Main tab list ───────────────────────────────────────────────────────── */
const mainTabs: { id: AssetTab; label: string }[] = [
  { id: 'home',   label: 'Home' },
  { id: 'stocks', label: 'Stocks' },
  { id: 'sip',    label: 'Funds' },
  { id: 'fd',     label: 'Deposits' },
];

/* ── Filled glyphs for active states (Apple SF Symbols style) ─────────────── */
function HomeFilled({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2.09l-9 7.875A1 1 0 0 0 4 11.5V20a2 2 0 0 0 2 2h4a1 1 0 0 0 1-1v-4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v4a1 1 0 0 0 1 1h4a2 2 0 0 0 2-2v-8.5a1 1 0 0 0-1-1.525z" />
    </svg>
  );
}

function StocksFilled({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
      <polyline points="17 6 23 6 23 12" />
    </svg>
  );
}

function WalletFilled({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M21 7H4a2 2 0 0 1-2-2 2 2 0 0 1 2-2h17a1 1 0 0 1 0 2H4a.5.5 0 0 0 0 1h17a2 2 0 0 1 2 2v10a3 3 0 0 1-3 3H5a3 3 0 0 1-3-3V9.2a3.02 3.02 0 0 0 1 .2H21a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1h-4a2 2 0 0 1-2-2 2 2 0 0 1 2-2h4a1 1 0 0 0 0-2h-4a4 4 0 0 0-4 4 4 4 0 0 0 4 4h4a3 3 0 0 0 3-3V9a2 2 0 0 0-2-2z" />
    </svg>
  );
}

function LandmarkFilled({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2L2 7h20L12 2zM4 9v9h3V9H4zm5 0v9h3V9H9zm5 0v9h3V9h-3zm5 0v9h3V9h-3zM2 20v2h20v-2H2z" />
    </svg>
  );
}

/* ── Individual tab button — iOS 27 Liquid Glass style ─────────────────── */
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
      style={{
        position: 'relative',
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 3,
        paddingTop: 4,
        paddingBottom: 4,
        minWidth: 56,
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        outline: 'none',
        WebkitTapHighlightColor: 'transparent',
        userSelect: 'none',
        touchAction: 'manipulation',
      }}
    >
      {/* Full-coverage Liquid Glass active capsule — enclosing BOTH icon orb AND label name */}
      <span
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: '4px 3px',
          borderRadius: 22,
          background: isActive ? 'var(--nav-pill-bg)' : 'transparent',
          backdropFilter: isActive ? 'blur(20px) saturate(2)' : 'none',
          WebkitBackdropFilter: isActive ? 'blur(20px) saturate(2)' : 'none',
          border: isActive ? '0.5px solid var(--nav-pill-border)' : 'none',
          boxShadow: isActive ? 'var(--nav-pill-shadow)' : 'none',
          opacity: isActive ? 1 : 0,
          transform: isActive ? 'scale(1)' : 'scale(0.88)',
          transition: 'transform 0.28s cubic-bezier(0.34,1.56,0.64,1), opacity 0.2s ease',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      {/* Circular icon container — 32px blue circular chip when active, matching iOS 27 */}
      <span
        style={{
          position: 'relative',
          zIndex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 32,
          height: 32,
          borderRadius: 999,
          background: isActive ? 'var(--accent-blue)' : 'transparent',
          color: isActive ? '#ffffff' : 'var(--text-primary)',
          opacity: isActive ? 1 : 0.75,
          boxShadow: isActive ? '0 2px 10px color-mix(in srgb, var(--accent-blue) 45%, transparent)' : 'none',
          transform: isActive ? 'scale(1)' : 'scale(0.95)',
          transition: 'background-color 0.2s ease, transform 0.25s cubic-bezier(0.34,1.56,0.64,1), color 0.18s ease, opacity 0.18s ease, box-shadow 0.2s ease',
          pointerEvents: 'none',
        }}
      >
        {isActive ? activeIcon : icon}

        {/* Badge */}
        {badge != null && badge > 0 && (
          <span
            role="status"
            aria-label={`${badge} notifications`}
            style={{
              position: 'absolute', top: -3, right: -3,
              minWidth: 16, height: 16, borderRadius: 999,
              background: '#ef4444', color: '#fff',
              fontSize: 9.5, fontWeight: 800,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: '0 3px', zIndex: 3,
              boxShadow: '0 0 0 2px var(--surface-solid, #fff), 0 2px 6px rgba(239,68,68,0.5)',
            }}
          >
            {badge > 9 ? '9+' : badge}
          </span>
        )}
      </span>

      {/* Label — bold accent when active, crisp text when inactive, completely inside the capsule */}
      <span
        style={{
          fontSize: 11,
          fontWeight: isActive ? 700 : 500,
          letterSpacing: isActive ? '-0.02em' : '0.005em',
          color: isActive ? 'var(--accent-blue)' : 'var(--text-primary)',
          opacity: isActive ? 1 : 0.75,
          transition: 'color 0.18s ease, opacity 0.18s ease, font-weight 0.18s ease',
          lineHeight: 1,
          whiteSpace: 'nowrap',
          position: 'relative',
          zIndex: 1,
          pointerEvents: 'none',
        }}
      >
        {label}
      </span>
    </button>
  );
}

/* ── "More" tab button ──────────────────────────────────────────────────── */
function MoreTabBtn({ isActive, isOpen, onClick }: { isActive: boolean; isOpen: boolean; onClick: () => void }) {
  const lit = isActive || isOpen;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-haspopup="dialog"
      aria-expanded={isOpen}
      aria-label={isActive ? 'More (active)' : 'More asset categories'}
      style={{
        position: 'relative',
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 3,
        paddingTop: 4,
        paddingBottom: 4,
        minWidth: 56,
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        outline: 'none',
        WebkitTapHighlightColor: 'transparent',
        userSelect: 'none',
        touchAction: 'manipulation',
      }}
    >
      {/* Full-coverage Liquid Glass active capsule */}
      <span
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: '4px 3px',
          borderRadius: 22,
          background: lit ? 'var(--nav-pill-bg)' : 'transparent',
          backdropFilter: lit ? 'blur(20px) saturate(2)' : 'none',
          WebkitBackdropFilter: lit ? 'blur(20px) saturate(2)' : 'none',
          border: lit ? '0.5px solid var(--nav-pill-border)' : 'none',
          boxShadow: lit ? 'var(--nav-pill-shadow)' : 'none',
          opacity: lit ? 1 : 0,
          transform: lit ? 'scale(1)' : 'scale(0.88)',
          transition: 'transform 0.28s cubic-bezier(0.34,1.56,0.64,1), opacity 0.2s ease',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      {/* Circular icon container */}
      <span
        style={{
          position: 'relative',
          zIndex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 32,
          height: 32,
          borderRadius: 999,
          background: lit ? 'var(--accent-blue)' : 'transparent',
          color: lit ? '#ffffff' : 'var(--text-primary)',
          opacity: lit ? 1 : 0.75,
          boxShadow: lit ? '0 2px 10px color-mix(in srgb, var(--accent-blue) 45%, transparent)' : 'none',
          transform: isOpen ? 'rotate(90deg)' : 'scale(1)',
          transition: 'background-color 0.2s ease, transform 0.28s cubic-bezier(0.34,1.56,0.64,1), color 0.18s ease, opacity 0.18s ease, box-shadow 0.2s ease',
          pointerEvents: 'none',
        }}
      >
        <Menu size={18} aria-hidden="true" />
      </span>

      <span
        style={{
          fontSize: 11,
          fontWeight: lit ? 700 : 500,
          letterSpacing: lit ? '-0.02em' : '0.005em',
          color: lit ? 'var(--accent-blue)' : 'var(--text-primary)',
          opacity: lit ? 1 : 0.75,
          transition: 'color 0.18s ease, opacity 0.18s ease',
          lineHeight: 1,
          whiteSpace: 'nowrap',
          position: 'relative',
          zIndex: 1,
          pointerEvents: 'none',
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
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const prevFocusedElementRef = useRef<HTMLElement | null>(null);

  useEffect(() => { isDrawerOpenRef.current = isDrawerOpen; }, [isDrawerOpen]);

  const openDrawer = useCallback(() => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    setIsDrawerOpen(true);
    requestAnimationFrame(() => requestAnimationFrame(() => setSheetIn(true)));
  }, []);

  const closeDrawer = useCallback(() => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
    }
    setSheetIn(false);
    closeTimerRef.current = setTimeout(() => {
      setIsDrawerOpen(false);
      closeTimerRef.current = null;
    }, 360);
  }, []);

  // Cleanup close timer on unmount
  useEffect(() => {
    return () => {
      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current);
      }
    };
  }, []);

  // Scroll lock + parent notify
  useEffect(() => {
    onDrawerStateChange?.(isDrawerOpen);
    document.body.style.overflow = isDrawerOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isDrawerOpen, onDrawerStateChange]);

  // Focus management: autofocus Close button on sheet open & restore previous focus on close
  useEffect(() => {
    if (isDrawerOpen) {
      prevFocusedElementRef.current = document.activeElement as HTMLElement | null;
      const timer = setTimeout(() => {
        closeBtnRef.current?.focus();
      }, 50);
      return () => {
        clearTimeout(timer);
        if (prevFocusedElementRef.current && typeof prevFocusedElementRef.current.focus === 'function') {
          prevFocusedElementRef.current.focus();
        }
      };
    }
  }, [isDrawerOpen]);

  // Focus trap inside More sheet
  useEffect(() => {
    if (!isDrawerOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        if (!sheetRef.current) return;
        const focusableElements = sheetRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        if (!focusableElements.length) return;
        const firstEl = focusableElements[0];
        const lastEl = focusableElements[focusableElements.length - 1];
        if (e.shiftKey) {
          if (document.activeElement === firstEl) {
            e.preventDefault();
            lastEl.focus();
          }
        } else {
          if (document.activeElement === lastEl) {
            e.preventDefault();
            firstEl.focus();
          }
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDrawerOpen]);

  // Close on navigation (only when activeAsset actually changes)
  const prevAssetRef = useRef(activeAsset);
  useEffect(() => {
    if (prevAssetRef.current !== activeAsset) {
      prevAssetRef.current = activeAsset;
      if (isDrawerOpenRef.current) {
        closeDrawer();
      }
    }
  }, [activeAsset, closeDrawer]);

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
      {/* ── Backdrop ─────────────────────────────────────────────────────── */}
      {isDrawerOpen && (
        <div
          aria-hidden="true"
          onClick={closeDrawer}
          className="md:hidden"
          style={{
            position: 'fixed', inset: 0, zIndex: 60,
            background: 'rgba(0,0,0,0.5)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            opacity: sheetIn ? 1 : 0,
            transition: 'opacity 0.3s ease',
            touchAction: 'none',
          }}
        />
      )}

      {/* ── iOS 27 Liquid Glass "More" Sheet ─────────────────────────────── */}
      {isDrawerOpen && (
        <div
          ref={sheetRef}
          role="dialog"
          aria-modal="true"
          aria-label="All asset categories"
          className="md:hidden"
          style={{
            position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 70,
            /* Layered Liquid Glass background */
            background: 'color-mix(in srgb, var(--surface-solid) 78%, transparent)',
            backdropFilter: 'blur(44px) saturate(2)',
            WebkitBackdropFilter: 'blur(44px) saturate(2)',
            borderRadius: '28px 28px 0 0',
            /* Specular top rim */
            borderTop: '0.5px solid rgba(255,255,255,0.45)',
            boxShadow: '0 -16px 60px rgba(0,0,0,0.28), 0 -1px 0 rgba(255,255,255,0.12) inset',
            transform: sheetIn ? 'translateY(0)' : 'translateY(105%)',
            transition: 'transform 0.38s cubic-bezier(0.32,0.72,0,1)',
            willChange: 'transform',
            paddingBottom: 'calc(env(safe-area-inset-bottom,0px) + 72px)',
            maxHeight: '80vh',
            display: 'flex', flexDirection: 'column',
          }}
        >
          <span className="sr-only" role="status" aria-live="polite">More asset categories drawer opened</span>

          {/* Drag handle */}
          <div
            style={{
              width: 36, height: 4.5, borderRadius: 999,
              background: 'color-mix(in srgb, var(--text-primary) 18%, transparent)',
              margin: '12px auto 0', flexShrink: 0,
            }}
            aria-hidden="true"
          />

          {/* Sheet header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px 10px', flexShrink: 0 }}>
            <div>
              <p style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.025em', lineHeight: 1.1 }}>More</p>
              <p style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 2, letterSpacing: '0.01em' }}>Asset categories</p>
            </div>
            <button
              ref={closeBtnRef}
              type="button"
              onClick={closeDrawer}
              aria-label="Close"
              style={{
                width: 32, height: 32, borderRadius: 999,
                background: 'color-mix(in srgb, var(--text-primary) 10%, transparent)',
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
                border: '0.5px solid color-mix(in srgb, var(--text-primary) 12%, transparent)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--text-secondary)', cursor: 'pointer', flexShrink: 0,
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.2)',
              }}
            >
              <X size={14} aria-hidden="true" />
            </button>
          </div>

          {/* Smart Import banner */}
          {onOpenSmartImport && (
            <div style={{ padding: '0 14px 12px', flexShrink: 0 }}>
              <button
                type="button"
                onClick={() => { triggerHaptic('selection'); closeDrawer(); onOpenSmartImport(); }}
                style={{
                  width: '100%',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '13px 16px', borderRadius: 18,
                  background: 'linear-gradient(135deg, color-mix(in srgb,#06b6d4 16%,transparent), color-mix(in srgb,#8b5cf6 16%,transparent))',
                  backdropFilter: 'blur(20px)',
                  WebkitBackdropFilter: 'blur(20px)',
                  border: '0.5px solid color-mix(in srgb, #8b5cf6 30%, transparent)',
                  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.25), 0 4px 16px rgba(139,92,246,0.18)',
                  cursor: 'pointer', outline: 'none', WebkitTapHighlightColor: 'transparent',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 13 }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 12, flexShrink: 0,
                    background: 'linear-gradient(135deg,#06b6d4,#8b5cf6)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 4px 14px rgba(139,92,246,0.4), inset 0 1px 0 rgba(255,255,255,0.3)',
                  }}>
                    <span style={{ color: '#fff', display: 'flex' }}><Sparkles size={19} aria-hidden="true" /></span>
                  </div>
                  <div style={{ textAlign: 'left' }}>
                    <p style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.015em' }}>✨ Smart AI Import</p>
                    <p style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 1.5 }}>Auto-extract details from a doc or photo</p>
                  </div>
                </div>
                <span style={{ color: 'var(--text-tertiary)', flexShrink: 0, display: 'flex' }}><ChevronRight size={14} aria-hidden="true" /></span>
              </button>
            </div>
          )}

          {/* Divider */}
          <div style={{ height: 0.5, background: 'var(--border-subtle)', opacity: 0.5, marginInline: 14, flexShrink: 0 }} />

          {/* Category rows — Glass tile cards */}
          <div style={{ overflowY: 'auto', padding: '10px 12px 4px', flex: 1 }}>
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
                    padding: '12px 14px', marginBottom: 6, borderRadius: 16,
                    background: active
                      ? `color-mix(in srgb,${tab.color} 14%,var(--surface-secondary))`
                      : 'color-mix(in srgb, var(--surface-secondary) 60%, transparent)',
                    backdropFilter: 'blur(16px)',
                    WebkitBackdropFilter: 'blur(16px)',
                    border: active
                      ? `0.5px solid color-mix(in srgb,${tab.color} 35%, transparent)`
                      : '0.5px solid color-mix(in srgb, var(--border-subtle) 60%, transparent)',
                    boxShadow: active
                      ? `inset 0 1px 0 rgba(255,255,255,0.2), 0 4px 16px color-mix(in srgb,${tab.color} 20%,transparent)`
                      : 'inset 0 1px 0 rgba(255,255,255,0.08)',
                    cursor: 'pointer', outline: 'none', textAlign: 'left',
                    transition: 'background 0.22s ease, border-color 0.22s ease, box-shadow 0.22s ease',
                    WebkitTapHighlightColor: 'transparent',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 0 }}>
                    {/* Icon circle — glass gradient orb */}
                    <div style={{
                      width: 42, height: 42, borderRadius: 13, flexShrink: 0,
                      background: active ? tab.gradient : `color-mix(in srgb,${tab.color} 16%, var(--surface-secondary))`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: active ? '#fff' : tab.color,
                      boxShadow: active
                        ? `0 4px 16px color-mix(in srgb,${tab.color} 45%,transparent), inset 0 1px 0 rgba(255,255,255,0.35)`
                        : `inset 0 1px 0 rgba(255,255,255,0.18)`,
                      transition: 'background 0.22s ease, box-shadow 0.22s ease',
                    }}>
                      {tab.icon}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <p style={{
                        fontSize: 14.5, fontWeight: active ? 700 : 600,
                        color: active ? tab.color : 'var(--text-primary)',
                        letterSpacing: '-0.015em',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>{tab.label}</p>
                      <p style={{
                        fontSize: 11.5, color: 'var(--text-tertiary)', marginTop: 1.5,
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>{tab.subtext}</p>
                    </div>
                  </div>
                  <span style={{
                    color: active ? tab.color : 'var(--text-tertiary)',
                    flexShrink: 0, display: 'flex',
                    transform: active ? 'translateX(2px)' : 'translateX(0)',
                    transition: 'transform 0.2s ease',
                  }}>
                    <ChevronRight size={15} aria-hidden="true" />
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── iOS 27 Liquid Glass Floating Tab Bar ─────────────────────────── */}
      <nav
        aria-label="Mobile Navigation"
        className="md:hidden"
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 50,
          paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 6px)',
          paddingLeft: 12,
          paddingRight: 12,
          paddingTop: 6,
          pointerEvents: 'none',
        }}
      >
        <div
          style={{
            maxWidth: 480,
            margin: '0 auto',
            pointerEvents: 'auto',
            /* ─── Authentic Liquid Glass floating pill ─── */
            background: 'color-mix(in srgb, var(--surface-solid) 68%, transparent)',
            backdropFilter: 'blur(40px) saturate(2.4) brightness(1.02)',
            WebkitBackdropFilter: 'blur(40px) saturate(2.4) brightness(1.02)',
            borderRadius: 28,
            border: '0.5px solid color-mix(in srgb, var(--border-glass, rgba(255,255,255,0.30)) 75%, transparent)',
            boxShadow: [
              'inset 0 1px 0 rgba(255,255,255,0.55)',
              'inset 0 -0.5px 0 rgba(0,0,0,0.10)',
              '0 8px 24px -4px rgba(0,0,0,0.14)',
              '0 16px 40px -8px rgba(0,0,0,0.18)',
            ].join(', '),
            willChange: 'transform',
            transform: 'translateZ(0)',
            userSelect: 'none',
            overflow: 'hidden',
            marginBottom: 2,
          }}
        >
          {/* Shimmer gloss layer — frosted glass sheen */}
          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              top: 0, left: 0, right: 0,
              height: '50%',
              background: 'linear-gradient(180deg, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0.06) 60%, transparent 100%)',
              borderRadius: '28px 28px 0 0',
              pointerEvents: 'none',
              zIndex: 0,
            }}
          />
          {/* Left-right edge soft vignette for glass depth */}
          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(90deg, rgba(255,255,255,0.05) 0%, transparent 20%, transparent 80%, rgba(255,255,255,0.05) 100%)',
              borderRadius: 28,
              pointerEvents: 'none',
              zIndex: 0,
            }}
          />

          <div
            style={{
              display: 'flex',
              alignItems: 'stretch',
              height: 64,
              paddingInline: 4,
              position: 'relative',
              zIndex: 1,
            }}
          >
            {mainTabs.map((tab) => (
              <TabBtn
                key={tab.id}
                id={tab.id}
                label={tab.label}
                isActive={activeAsset === tab.id}
                badge={tab.id === 'home' && alertCount > 0 ? alertCount : undefined}
                onClick={() => { triggerHaptic('selection'); onChangeAsset(tab.id); if (isDrawerOpen) closeDrawer(); }}
                icon={
                  tab.id === 'home'   ? <HomeIcon size={21} aria-hidden="true" />   :
                  tab.id === 'stocks' ? <TrendingUp size={21} aria-hidden="true" /> :
                  tab.id === 'sip'    ? <Wallet size={21} aria-hidden="true" />     :
                                        <Landmark size={21} aria-hidden="true" />
                }
                activeIcon={
                  tab.id === 'home'   ? <HomeFilled size={18} />     :
                  tab.id === 'stocks' ? <StocksFilled size={18} />   :
                  tab.id === 'sip'    ? <WalletFilled size={18} />   :
                                        <LandmarkFilled size={18} />
                }
              />
            ))}

            {/* Thin vertical separator */}
            <div
              aria-hidden="true"
              style={{
                width: 0.5,
                alignSelf: 'center',
                height: 24,
                background: 'color-mix(in srgb, var(--border-subtle) 65%, transparent)',
                flexShrink: 0,
                opacity: 0.7,
              }}
            />

            <MoreTabBtn isActive={isMoreActive} isOpen={isDrawerOpen} onClick={toggleDrawer} />
          </div>
        </div>
      </nav>
    </>
  );
}

export default React.memo(MobileBottomNav);
