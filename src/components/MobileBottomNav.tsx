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
} from './icons/AppIcons';
import { triggerHaptic } from '../utils/haptics';
import { lockScroll, unlockScroll } from '../utils/scrollLock';

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

/* ── Main tab list — WhatsApp iOS style ──────────────────────────────────── */
const mainTabs: { id: AssetTab; label: string; accent: string }[] = [
  { id: 'home',   label: 'Home',     accent: 'var(--accent-blue)' },
  { id: 'stocks', label: 'Stocks',   accent: 'var(--positive)' },
  { id: 'sip',    label: 'Funds',    accent: 'var(--asset-sip)' },
  { id: 'fd',     label: 'Deposits', accent: 'var(--asset-fd)' },
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

/* ── More Grid Icons for More Tab ────────────────────────────────────────── */
function MoreGridFilled({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" stroke="none" aria-hidden="true">
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
    </svg>
  );
}

function MoreGridOutline({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
    </svg>
  );
}

/* ── Individual tab button — Asset-Colored Pill wrapping BOTH Icon & Label ── */
function TabBtn({
  label, isActive, badge, onClick, icon, activeIcon, accent,
}: {
  id: AssetTab; label: string; isActive: boolean;
  badge?: number; onClick: () => void;
  icon: React.ReactNode; activeIcon: React.ReactNode;
  accent: string;
}) {
  const activeColor = accent;
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
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        minHeight: 44,
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        outline: 'none',
        WebkitTapHighlightColor: 'transparent',
        userSelect: 'none',
        touchAction: 'manipulation',
        padding: '2px',
      }}
    >
      {/* Pill container — When active, surrounds BOTH icon AND name in asset color */}
      <span
        style={{
          width: '100%',
          maxWidth: 66,
          height: 46,
          borderRadius: 14,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 1.5,
          padding: '2px 4px',
          background: isActive
            ? `color-mix(in srgb, ${activeColor} 18%, transparent)`
            : 'transparent',
          border: isActive
            ? `0.5px solid color-mix(in srgb, ${activeColor} 35%, transparent)`
            : '0.5px solid transparent',
          boxShadow: isActive
            ? `0 2px 10px color-mix(in srgb, ${activeColor} 18%, transparent)`
            : 'none',
          transform: isActive ? 'scale(1.02)' : 'scale(1)',
          transition: 'background 0.22s ease, border-color 0.22s ease, box-shadow 0.22s ease, transform 0.22s cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}
      >
        {/* Icon wrapper */}
        <span
          style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 26,
            height: 22,
          }}
        >
          <span
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: isActive ? activeColor : 'var(--text-tertiary)',
              transform: isActive ? 'scale(1.06)' : 'scale(1)',
              transition: 'color 0.18s ease, transform 0.2s ease',
            }}
          >
            {isActive ? activeIcon : icon}
          </span>

          {/* Badge — cleanly anchored to top-right of icon */}
          {badge != null && badge > 0 && (
            <span
              role="status"
              aria-label={`${badge} notifications`}
              style={{
                position: 'absolute',
                top: -3,
                right: -8,
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

        {/* Label — INSIDE the active pill */}
        <span
          style={{
            fontSize: 10.5,
            fontWeight: isActive ? 600 : 500,
            letterSpacing: '-0.01em',
            color: isActive ? activeColor : 'var(--text-tertiary)',
            lineHeight: 1,
            whiteSpace: 'nowrap',
            transition: 'color 0.18s ease, font-weight 0.18s ease',
          }}
        >
          {label}
        </span>
      </span>
    </button>
  );
}

/* ── "More" tab button — Asset-Colored Pill wrapping BOTH Icon & "More" ──── */
function MoreTabBtn({
  isActive,
  isOpen,
  activeAsset,
  onClick,
}: {
  isActive: boolean;
  isOpen: boolean;
  activeAsset: AssetTab;
  onClick: () => void;
}) {
  const lit = isActive || isOpen;
  const activeTabObj = moreTabs.find((t) => t.id === activeAsset);
  const activeColor = activeTabObj ? activeTabObj.color : 'var(--accent-rose)';

  return (
    <button
      type="button"
      onClick={onClick}
      aria-haspopup="dialog"
      aria-expanded={isOpen}
      aria-label={lit ? 'More (active)' : 'More asset categories'}
      title="More asset categories"
      className="ios-press"
      style={{
        position: 'relative',
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        minHeight: 44,
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        outline: 'none',
        WebkitTapHighlightColor: 'transparent',
        userSelect: 'none',
        touchAction: 'manipulation',
        padding: '2px',
      }}
    >
      {/* Pill container — When active, surrounds BOTH icon AND "More" text in asset color */}
      <span
        style={{
          width: '100%',
          maxWidth: 66,
          height: 46,
          borderRadius: 14,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 1.5,
          padding: '2px 4px',
          background: lit
            ? `color-mix(in srgb, ${activeColor} 18%, transparent)`
            : 'transparent',
          border: lit
            ? `0.5px solid color-mix(in srgb, ${activeColor} 35%, transparent)`
            : '0.5px solid transparent',
          boxShadow: lit
            ? `0 2px 10px color-mix(in srgb, ${activeColor} 18%, transparent)`
            : 'none',
          transform: lit ? 'scale(1.02)' : 'scale(1)',
          transition: 'background 0.22s ease, border-color 0.22s ease, box-shadow 0.22s ease, transform 0.22s cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}
      >
        {/* Icon wrapper */}
        <span
          style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 26,
            height: 22,
          }}
        >
          <span
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: lit ? activeColor : 'var(--text-tertiary)',
              transform: isOpen ? 'rotate(90deg) scale(1.06)' : lit ? 'scale(1.06)' : 'scale(1)',
              transition: 'color 0.18s ease, transform 0.22s cubic-bezier(0.34, 1.56, 0.64, 1)',
            }}
          >
            {lit ? <MoreGridFilled size={20} /> : <MoreGridOutline size={20} />}
          </span>
        </span>

        {/* Label: More — INSIDE the active pill */}
        <span
          style={{
            fontSize: 10.5,
            fontWeight: lit ? 600 : 500,
            letterSpacing: '-0.01em',
            color: lit ? activeColor : 'var(--text-tertiary)',
            lineHeight: 1,
            whiteSpace: 'nowrap',
            transition: 'color 0.18s ease, font-weight 0.18s ease',
          }}
        >
          More
        </span>
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
    const threshold = 20; // 20px prevents dock flicker on slow scroll momentum

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

  // Scroll lock + parent notify — use shared reference-counted lock
  useEffect(() => {
    onDrawerStateChange?.(isDrawerOpen);
    if (isDrawerOpen) {
      lockScroll();
      return () => unlockScroll();
    }
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
            position: 'fixed', inset: 0, zIndex: 300,
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
            position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 310,
            background: 'color-mix(in srgb, var(--surface-solid) 80%, transparent)',
            backdropFilter: 'blur(32px) saturate(1.8)',
            WebkitBackdropFilter: 'blur(32px) saturate(1.8)',
            borderRadius: '28px 28px 0 0',
            borderTop: '0.5px solid rgba(255,255,255,0.25)',
            boxShadow: '0 -12px 48px rgba(0,0,0,0.24)',
            transform: sheetIn ? 'translateY(0)' : 'translateY(105%)',
            transition: 'transform 0.36s cubic-bezier(0.16,1,0.3,1)',
            willChange: 'transform',
            paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 16px)',
            maxHeight: '88vh',
            display: 'flex', flexDirection: 'column',
          }}
        >
          <span className="sr-only" role="status" aria-live="polite">More asset categories drawer opened</span>

          {/* Drag handle — touch-enabled for swipe-down dismiss */}
          <div
            role="button"
            aria-label="Swipe down to close"
            tabIndex={-1}
            onTouchStart={(e) => {
              const touch = e.touches[0];
              (e.currentTarget as HTMLElement).dataset.swipeStartY = String(touch.clientY);
            }}
            onTouchMove={(e) => {
              const startY = parseFloat((e.currentTarget as HTMLElement).dataset.swipeStartY || '0');
              const delta = e.touches[0].clientY - startY;
              if (delta > 0) {
                // Provide visual resistance feedback during drag
                if (sheetRef.current) {
                  sheetRef.current.style.transform = `translateY(${Math.min(delta * 0.5, 60)}px)`;
                  sheetRef.current.style.transition = 'none';
                }
              }
            }}
            onTouchEnd={(e) => {
              const startY = parseFloat((e.currentTarget as HTMLElement).dataset.swipeStartY || '0');
              const delta = e.changedTouches[0].clientY - startY;
              // Restore sheet transition
              if (sheetRef.current) {
                sheetRef.current.style.transform = '';
                sheetRef.current.style.transition = '';
              }
              // Velocity-based dismiss: > 80px swipe down closes the sheet
              if (delta > 80) {
                triggerHaptic('selection');
                closeDrawer();
              }
            }}
            style={{
              width: 36, height: 4, borderRadius: 999,
              background: 'color-mix(in srgb, var(--text-primary) 18%, transparent)',
              margin: '10px auto 0', flexShrink: 0,
              cursor: 'grab', touchAction: 'none',
              padding: '12px 40px', // Extend hit area vertically
              boxSizing: 'content-box',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <div style={{ width: 36, height: 4, borderRadius: 999, background: 'color-mix(in srgb, var(--text-primary) 18%, transparent)' }} />
          </div>

          {/* Sheet header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 18px 8px', flexShrink: 0 }}>
            <div>
              <p style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em', lineHeight: 1.1 }}>More</p>
              <p style={{ fontSize: 11.5, color: 'var(--text-tertiary)', marginTop: 1 }}>Asset categories</p>
            </div>
            <button
              ref={closeBtnRef}
              type="button"
              onClick={closeDrawer}
              aria-label="Close"
              className="ios-press"
              style={{
                width: 36, height: 36, borderRadius: 999,
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
            <div style={{ padding: '0 12px 8px', flexShrink: 0 }}>
              <button
                type="button"
                onClick={() => { triggerHaptic('selection'); closeDrawer(); onOpenSmartImport(); }}
                className="ios-press"
                style={{
                  width: '100%',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '10px 12px', borderRadius: 14,
                  background: 'color-mix(in srgb, var(--surface-secondary) 75%, transparent)',
                  backdropFilter: 'blur(16px)',
                  WebkitBackdropFilter: 'blur(16px)',
                  border: '0.5px solid color-mix(in srgb, var(--accent-blue) 25%, var(--border-subtle))',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                  cursor: 'pointer', outline: 'none', WebkitTapHighlightColor: 'transparent',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 34, height: 34, borderRadius: 10, flexShrink: 0,
                    background: 'color-mix(in srgb, var(--accent-blue) 14%, var(--surface-secondary))',
                    border: '0.5px solid color-mix(in srgb, var(--accent-blue) 25%, transparent)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'var(--accent-blue)',
                  }}>
                    <Sparkles size={16} aria-hidden="true" />
                  </div>
                  <div style={{ textAlign: 'left' }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>Smart AI Import</p>
                    <p style={{ fontSize: 10.5, color: 'var(--text-tertiary)', marginTop: 0.5 }}>Auto-extract details from a doc or photo</p>
                  </div>
                </div>
                <span style={{ color: 'var(--text-tertiary)', flexShrink: 0, display: 'flex' }}><ChevronRight size={14} aria-hidden="true" /></span>
              </button>
            </div>
          )}

          {/* Divider */}
          <div style={{ height: 0.5, background: 'var(--border-subtle)', opacity: 0.5, marginInline: 12, flexShrink: 0 }} />

          {/* Category rows — Calm functional glass tile cards */}
          <div style={{ overflowY: 'auto', padding: '8px 12px 4px', flex: 1, overscrollBehavior: 'contain' }}>
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
                    padding: '9px 12px', marginBottom: 5, borderRadius: 13, minHeight: 44,
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
                  <div style={{ display: 'flex', alignItems: 'center', gap: 11, minWidth: 0 }}>
                    {/* Clean icon container */}
                    <div style={{
                      width: 34, height: 34, borderRadius: 9, flexShrink: 0,
                      background: `color-mix(in srgb, ${tab.color} 12%, var(--surface-secondary))`,
                      border: `0.5px solid color-mix(in srgb, ${tab.color} 20%, transparent)`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: tab.color,
                    }}>
                      {tab.icon}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <p style={{
                        fontSize: 13.5, fontWeight: active ? 600 : 500,
                        color: active ? 'var(--accent-blue)' : 'var(--text-primary)',
                        letterSpacing: '-0.01em',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>{tab.label}</p>
                      <p style={{
                        fontSize: 11, color: 'var(--text-tertiary)', marginTop: 0.5,
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
          paddingBottom: 'max(env(safe-area-inset-bottom, 0px) + 8px, 12px)',
          paddingLeft: 14,
          paddingRight: 14,
          paddingTop: 0,
          pointerEvents: 'none',
          transform: isVisible ? 'translateY(0)' : 'translateY(calc(100% + 24px))',
          opacity: isVisible ? 1 : 0,
          transition: 'transform 0.36s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.24s ease',
        }}
      >
        <div
          style={{
            maxWidth: 410,
            margin: '0 auto',
            pointerEvents: 'auto',
            background: 'var(--nav-glass-bg)',
            backdropFilter: 'blur(28px) saturate(1.8)',
            WebkitBackdropFilter: 'blur(28px) saturate(1.8)',
            borderRadius: 9999,
            border: '0.5px solid var(--nav-glass-border)',
            boxShadow: 'var(--nav-glass-shadow)',
            userSelect: 'none',
            overflow: 'hidden',
            padding: '3px 6px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              height: 52,
            }}
          >
            {mainTabs.map((tab) => (
              <TabBtn
                key={tab.id}
                id={tab.id}
                label={tab.label}
                accent={tab.accent}
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
                  tab.id === 'home'   ? <HomeFilled size={21} />     :
                  tab.id === 'stocks' ? <StocksFilled size={21} />   :
                  tab.id === 'sip'    ? <WalletFilled size={21} />   :
                                        <LandmarkFilled size={21} />
                }
              />
            ))}

            <MoreTabBtn
              isActive={isMoreActive}
              isOpen={isDrawerOpen}
              activeAsset={activeAsset}
              onClick={toggleDrawer}
            />
          </div>
        </div>
      </nav>
    </>
  );
}

export default React.memo(MobileBottomNav);
