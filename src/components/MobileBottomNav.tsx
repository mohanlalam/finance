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
const moreTabs: { id: AssetTab; label: string; subtext: string; icon: React.ReactNode; color: string }[] = [
  { id: 'rd',          label: 'Recurring Deposits',  subtext: 'Quarterly compounding RD accounts',   icon: <Clock size={18} aria-hidden="true" />,      color: '#c2410c' },
  { id: 'gold',        label: 'Gold Holdings',        subtext: 'Physical & digital gold bullion',     icon: <Coins size={18} aria-hidden="true" />,      color: '#facc15' },
  { id: 'real_estate', label: 'Real Estate',          subtext: 'Properties, plots & rental yields',  icon: <Building2 size={18} aria-hidden="true" />,  color: '#16a34a' },
  { id: 'insurance',   label: 'Insurance Policies',   subtext: 'Life, health & vehicle policies',    icon: <Shield size={18} aria-hidden="true" />,     color: '#e11d48' },
  { id: 'documents',   label: 'Document Vault',       subtext: 'Digital receipts & policy bonds',    icon: <FolderOpen size={18} aria-hidden="true" />, color: '#0284c7' },
  { id: 'tax',         label: 'Tax Harvesting',       subtext: 'LTCG / STCG tax optimisation',       icon: <TrendingUp size={18} aria-hidden="true" />, color: '#10b981' },
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

/* ── Individual tab button — Liquid Glass inspired style ─────────────────── */
function TabBtn({
  label, isActive, badge, onClick, icon, activeIcon, isFirst, isLast,
}: {
  id: AssetTab; label: string; isActive: boolean;
  badge?: number; onClick: () => void;
  icon: React.ReactNode; activeIcon: React.ReactNode;
  isFirst?: boolean; isLast?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={isActive ? 'page' : undefined}
      aria-label={label}
      className="ios-press"
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
        height: '100%',
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        outline: 'none',
        WebkitTapHighlightColor: 'transparent',
        userSelect: 'none',
        touchAction: 'manipulation',
      }}
    >
      {/* Active Liquid Glass lens — concentric with outer dock pill */}
      <span
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: isFirst ? 0 : 2,
          right: isLast ? 0 : 2,
          borderRadius: isFirst
            ? '25px 20px 20px 25px'
            : isLast
            ? '20px 25px 25px 20px'
            : 20,
          background: isActive ? 'var(--nav-selected-bg)' : 'transparent',
          border: isActive ? '0.5px solid var(--nav-selected-border)' : 'none',
          boxShadow: isActive ? 'var(--nav-selected-shadow)' : 'none',
          opacity: isActive ? 1 : 0,
          transform: isActive ? 'scale(1)' : 'scale(0.92)',
          transition: 'opacity 0.18s ease, transform 0.24s cubic-bezier(0.34, 1.56, 0.64, 1)',
          pointerEvents: 'none',
        }}
      />

      {/* Icon — SF Symbol active filled tint vs inactive outline */}
      <span
        style={{
          position: 'relative',
          zIndex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: isActive ? 'var(--accent-blue)' : 'var(--text-secondary)',
          opacity: isActive ? 1 : 0.7,
          transform: isActive ? 'scale(1.04)' : 'scale(1)',
          transition: 'color 0.18s ease, opacity 0.18s ease, transform 0.22s cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}
      >
        {isActive ? activeIcon : icon}

        {/* Badge — cleanly anchored to icon without loud glow */}
        {badge != null && badge > 0 && (
          <span
            role="status"
            aria-label={`${badge} notifications`}
            style={{
              position: 'absolute',
              top: -3,
              right: -5,
              minWidth: 15,
              height: 15,
              borderRadius: 999,
              background: '#ef4444',
              color: '#fff',
              fontSize: 9,
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0 3px',
              boxShadow: '0 0 0 1.5px var(--surface-solid, #fff)',
            }}
          >
            {badge > 9 ? '9+' : badge}
          </span>
        )}
      </span>

      {/* Label — Clean Apple HIG typography with stable neutral tracking */}
      <span
        style={{
          fontSize: 10.5,
          fontWeight: 500,
          letterSpacing: 0,
          color: isActive ? 'var(--accent-blue)' : 'var(--text-secondary)',
          opacity: isActive ? 1 : 0.7,
          transition: 'color 0.18s ease, opacity 0.18s ease',
          lineHeight: 1,
          whiteSpace: 'nowrap',
          position: 'relative',
          zIndex: 1,
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
      className="ios-press"
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
        height: '100%',
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        outline: 'none',
        WebkitTapHighlightColor: 'transparent',
        userSelect: 'none',
        touchAction: 'manipulation',
      }}
    >
      <span
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: 2,
          right: 0,
          borderRadius: '20px 25px 25px 20px',
          background: lit ? 'var(--nav-selected-bg)' : 'transparent',
          border: lit ? '0.5px solid var(--nav-selected-border)' : 'none',
          boxShadow: lit ? 'var(--nav-selected-shadow)' : 'none',
          opacity: lit ? 1 : 0,
          transform: lit ? 'scale(1)' : 'scale(0.92)',
          transition: 'opacity 0.18s ease, transform 0.24s cubic-bezier(0.34, 1.56, 0.64, 1)',
          pointerEvents: 'none',
        }}
      />

      <span
        style={{
          position: 'relative',
          zIndex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: lit ? 'var(--accent-blue)' : 'var(--text-secondary)',
          opacity: lit ? 1 : 0.7,
          transform: isOpen ? 'rotate(90deg) scale(1.04)' : lit ? 'scale(1.04)' : 'scale(1)',
          transition: 'color 0.18s ease, opacity 0.18s ease, transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}
      >
        <Menu size={21} aria-hidden="true" />
      </span>

      <span
        style={{
          fontSize: 10.5,
          fontWeight: 500,
          letterSpacing: 0,
          color: lit ? 'var(--accent-blue)' : 'var(--text-secondary)',
          opacity: lit ? 1 : 0.7,
          transition: 'color 0.18s ease, opacity 0.18s ease',
          lineHeight: 1,
          whiteSpace: 'nowrap',
          position: 'relative',
          zIndex: 1,
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
  const [isVisible,    setIsVisible]    = useState(true);
  const lastScrollMapRef = useRef(new WeakMap<Element, number>());
  const lastWindowScrollYRef = useRef(0);

  const isDrawerOpenRef = useRef(isDrawerOpen);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const prevFocusedElementRef = useRef<HTMLElement | null>(null);

  useEffect(() => { isDrawerOpenRef.current = isDrawerOpen; }, [isDrawerOpen]);

  // Scroll collapse behavior: resilient across window, short content, and inner scroll containers
  useEffect(() => {
    if (isDrawerOpen) {
      setIsVisible(true);
      return;
    }

    let ticking = false;
    const threshold = 12;

    const handleScroll = (e?: Event) => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          // Identify scrolling target: inner element or document window
          const target = (e?.target && e.target !== document && (e.target as HTMLElement).scrollTop !== undefined)
            ? (e.target as HTMLElement)
            : null;

          const currentScrollY = target
            ? target.scrollTop
            : (window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0);

          const scrollHeight = target
            ? target.scrollHeight
            : Math.max(document.documentElement.scrollHeight, document.body.scrollHeight || 0);

          const clientHeight = target
            ? target.clientHeight
            : (window.innerHeight || document.documentElement.clientHeight || 0);

          // If content is short (no significant scroll range), always keep dock visible
          if (scrollHeight - clientHeight < 80) {
            setIsVisible(true);
            if (target) {
              lastScrollMapRef.current.set(target, 0);
            } else {
              lastWindowScrollYRef.current = 0;
            }
            ticking = false;
            return;
          }

          // Retrieve previous scroll position for this specific target
          const previousScrollY = target
            ? (lastScrollMapRef.current.get(target) ?? currentScrollY)
            : lastWindowScrollYRef.current;

          const delta = currentScrollY - previousScrollY;

          // Always visible at the top
          if (currentScrollY < 40) {
            setIsVisible(true);
          } else if (Math.abs(delta) > threshold) {
            // Hide on scroll down, show on scroll up
            setIsVisible(delta < 0);
          }

          if (target) {
            lastScrollMapRef.current.set(target, Math.max(0, currentScrollY));
          } else {
            lastWindowScrollYRef.current = Math.max(0, currentScrollY);
          }
          ticking = false;
        });
        ticking = true;
      }
    };

    // Capture phase listens to window and bubbling/contained scroll events
    window.addEventListener('scroll', handleScroll, { passive: true, capture: true });
    return () => window.removeEventListener('scroll', handleScroll, { capture: true } as EventListenerOptions);
  }, [isDrawerOpen]);

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

      {/* ── Liquid Glass "More" Sheet ────────────────────────────────────── */}
      {isDrawerOpen && (
        <div
          ref={sheetRef}
          role="dialog"
          aria-modal="true"
          aria-label="All asset categories"
          className="md:hidden"
          style={{
            position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 70,
            background: 'color-mix(in srgb, var(--surface-solid) 80%, transparent)',
            backdropFilter: 'blur(32px) saturate(1.8)',
            WebkitBackdropFilter: 'blur(32px) saturate(1.8)',
            borderRadius: '28px 28px 0 0',
            borderTop: '0.5px solid rgba(255,255,255,0.25)',
            boxShadow: '0 -12px 48px rgba(0,0,0,0.24)',
            transform: sheetIn ? 'translateY(0)' : 'translateY(105%)',
            transition: 'transform 0.36s cubic-bezier(0.16,1,0.3,1)',
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
              <p style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em', lineHeight: 1.1 }}>More</p>
              <p style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 2 }}>Asset categories</p>
            </div>
            <button
              ref={closeBtnRef}
              type="button"
              onClick={closeDrawer}
              aria-label="Close"
              className="ios-press"
              style={{
                width: 32, height: 32, borderRadius: 999,
                background: 'color-mix(in srgb, var(--text-primary) 8%, transparent)',
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
                border: '0.5px solid color-mix(in srgb, var(--text-primary) 10%, transparent)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--text-secondary)', cursor: 'pointer', flexShrink: 0,
              }}
            >
              <X size={14} aria-hidden="true" />
            </button>
          </div>

          {/* Smart Import banner — refined functional glass card */}
          {onOpenSmartImport && (
            <div style={{ padding: '0 14px 10px', flexShrink: 0 }}>
              <button
                type="button"
                onClick={() => { triggerHaptic('selection'); closeDrawer(); onOpenSmartImport(); }}
                className="ios-press"
                style={{
                  width: '100%',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '12px 14px', borderRadius: 16,
                  background: 'color-mix(in srgb, var(--surface-secondary) 75%, transparent)',
                  backdropFilter: 'blur(16px)',
                  WebkitBackdropFilter: 'blur(16px)',
                  border: '0.5px solid color-mix(in srgb, var(--accent-blue) 25%, var(--border-subtle))',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                  cursor: 'pointer', outline: 'none', WebkitTapHighlightColor: 'transparent',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                    background: 'color-mix(in srgb, var(--accent-blue) 14%, var(--surface-secondary))',
                    border: '0.5px solid color-mix(in srgb, var(--accent-blue) 25%, transparent)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'var(--accent-blue)',
                  }}>
                    <Sparkles size={18} aria-hidden="true" />
                  </div>
                  <div style={{ textAlign: 'left' }}>
                    <p style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>Smart AI Import</p>
                    <p style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 1 }}>Auto-extract details from a doc or photo</p>
                  </div>
                </div>
                <span style={{ color: 'var(--text-tertiary)', flexShrink: 0, display: 'flex' }}><ChevronRight size={14} aria-hidden="true" /></span>
              </button>
            </div>
          )}

          {/* Divider */}
          <div style={{ height: 0.5, background: 'var(--border-subtle)', opacity: 0.5, marginInline: 14, flexShrink: 0 }} />

          {/* Category rows — Calm functional glass tile cards */}
          <div style={{ overflowY: 'auto', padding: '10px 12px 4px', flex: 1 }}>
            {moreTabs.map((tab) => {
              const active = activeAsset === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => handleMoreTabClick(tab.id)}
                  className="ios-press"
                  style={{
                    width: '100%',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '11px 14px', marginBottom: 6, borderRadius: 14,
                    background: active
                      ? 'color-mix(in srgb, var(--accent-blue) 12%, var(--surface-secondary))'
                      : 'color-mix(in srgb, var(--surface-secondary) 55%, transparent)',
                    backdropFilter: 'blur(16px)',
                    WebkitBackdropFilter: 'blur(16px)',
                    border: active
                      ? '0.5px solid color-mix(in srgb, var(--accent-blue) 30%, transparent)'
                      : '0.5px solid color-mix(in srgb, var(--border-subtle) 60%, transparent)',
                    boxShadow: active
                      ? '0 2px 8px color-mix(in srgb, var(--accent-blue) 12%, transparent)'
                      : 'none',
                    cursor: 'pointer', outline: 'none', textAlign: 'left',
                    transition: 'background 0.2s ease, border-color 0.2s ease',
                    WebkitTapHighlightColor: 'transparent',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 13, minWidth: 0 }}>
                    {/* Clean icon container */}
                    <div style={{
                      width: 38, height: 38, borderRadius: 10, flexShrink: 0,
                      background: `color-mix(in srgb, ${tab.color} 12%, var(--surface-secondary))`,
                      border: `0.5px solid color-mix(in srgb, ${tab.color} 20%, transparent)`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: tab.color,
                    }}>
                      {tab.icon}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <p style={{
                        fontSize: 14, fontWeight: active ? 600 : 500,
                        color: active ? 'var(--accent-blue)' : 'var(--text-primary)',
                        letterSpacing: '-0.01em',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>{tab.label}</p>
                      <p style={{
                        fontSize: 11.5, color: 'var(--text-tertiary)', marginTop: 1,
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>{tab.subtext}</p>
                    </div>
                  </div>
                  <span style={{
                    color: active ? 'var(--accent-blue)' : 'var(--text-tertiary)',
                    flexShrink: 0, display: 'flex',
                    transform: active ? 'translateX(2px)' : 'translateX(0)',
                    transition: 'transform 0.2s ease',
                  }}>
                    <ChevronRight size={14} aria-hidden="true" />
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Liquid Glass Inspired Floating Tab Bar ──────────────────────── */}
      <nav
        aria-label="Mobile Navigation"
        className="md:hidden"
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 50,
          paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 8px)',
          paddingLeft: 12,
          paddingRight: 12,
          paddingTop: 6,
          pointerEvents: 'none',
          transform: isVisible ? 'translateY(0)' : 'translateY(calc(100% + 24px))',
          opacity: isVisible ? 1 : 0,
          transition: 'transform 0.36s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.24s ease',
        }}
      >
        <div
          style={{
            maxWidth: 440,
            margin: '0 auto',
            pointerEvents: 'auto',
            background: 'var(--nav-glass-bg)',
            backdropFilter: 'blur(20px) saturate(1.8)',
            WebkitBackdropFilter: 'blur(20px) saturate(1.8)',
            borderRadius: 29,
            border: '0.5px solid var(--nav-glass-border)',
            boxShadow: 'var(--nav-glass-shadow)',
            userSelect: 'none',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'stretch',
              height: 58,
              padding: 4,
            }}
          >
            {mainTabs.map((tab, idx) => (
              <TabBtn
                key={tab.id}
                id={tab.id}
                label={tab.label}
                isActive={activeAsset === tab.id}
                isFirst={idx === 0}
                isLast={false}
                badge={tab.id === 'home' && alertCount > 0 ? alertCount : undefined}
                onClick={() => { triggerHaptic('selection'); onChangeAsset(tab.id); if (isDrawerOpen) closeDrawer(); }}
                icon={
                  tab.id === 'home'   ? <HomeIcon size={21} aria-hidden="true" />   :
                  tab.id === 'stocks' ? <TrendingUp size={21} aria-hidden="true" /> :
                  tab.id === 'sip'    ? <Wallet size={21} aria-hidden="true" />     :
                                        <Landmark size={21} aria-hidden="true" />
                }
                activeIcon={
                  tab.id === 'home'   ? <HomeFilled size={21} />     :
                  tab.id === 'stocks' ? <StocksFilled size={21} />   :
                  tab.id === 'sip'    ? <WalletFilled size={21} />   :
                                        <LandmarkFilled size={21} />
                }
              />
            ))}

            <MoreTabBtn isActive={isMoreActive} isOpen={isDrawerOpen} onClick={toggleDrawer} />
          </div>
        </div>
      </nav>
    </>
  );
}

export default React.memo(MobileBottomNav);
