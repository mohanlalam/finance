import { useEffect, useRef, useCallback, useState, ReactNode } from 'react';
import { createPortal } from 'react-dom';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  maxWidth?: string;
  ariaLabel?: string;
  /** Prevent closing via backdrop / Escape while an async action is pending */
  preventClose?: boolean;
}

/**
 * Reusable modal wrapper with Apple bottom-sheet behavior on mobile:
 * - Slide-up drawer on mobile devices, centered panel on desktop
 * - React Portal rendering (escapes parent stacking contexts)
 * - Frosted backdrop blur filter
 * - Focus trap (Tab cycles within modal)
 * - Escape key to close
 * - Body scroll lock
 * - ARIA dialog semantics
 * - Drag-to-move on desktop (grab the header to reposition)
 * - Scrollable content area for tall forms
 */
export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = 'max-w-md',
  ariaLabel = 'Dialog',
  preventClose = false,
}: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);
  const pointerDownTarget = useRef<EventTarget | null>(null);

  const [isRendered, setIsRendered] = useState(isOpen);
  const [isExiting, setIsExiting] = useState(false);

  // Drag state refs to avoid effect re-binding churn
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const isDragging = useRef(false);
  const dragStart = useRef<{ mouseX: number; mouseY: number; offsetX: number; offsetY: number }>({
    mouseX: 0, mouseY: 0, offsetX: 0, offsetY: 0,
  });

  useEffect(() => {
    if (isOpen) {
      setIsRendered(true);
      setIsExiting(false);
      setDragOffset({ x: 0, y: 0 });
    } else if (isRendered) {
      setIsExiting(true);
      const timer = setTimeout(() => {
        setIsRendered(false);
        setIsExiting(false);
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [isOpen, isRendered]);

  // Lock body scroll & focus management
  useEffect(() => {
    if (isRendered && !isExiting) {
      if (document.activeElement instanceof HTMLElement) {
        previouslyFocused.current = document.activeElement;
      }
      document.body.style.overflow = 'hidden';

      const rafId = requestAnimationFrame(() => {
        const focusable = contentRef.current?.querySelectorAll<HTMLElement>(
          'input:not([disabled]), button:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"]):not([disabled])',
        );
        if (focusable && focusable.length > 0) {
          focusable[0].focus();
        } else {
          contentRef.current?.focus();
        }
      });
      return () => cancelAnimationFrame(rafId);
    } else if (!isRendered) {
      document.body.style.overflow = '';
      if (previouslyFocused.current && document.body.contains(previouslyFocused.current)) {
        previouslyFocused.current.focus();
      }
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isRendered, isExiting]);

  // Escape key handler checking defaultPrevented
  useEffect(() => {
    if (!isOpen) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape' && !preventClose && !e.defaultPrevented) {
        onClose();
      }
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose, preventClose]);

  // Pointer drag handlers - attached dynamically without dependencies churn
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('button, input, select, textarea, a, label, [role="button"]')) return;

    const isHeaderTarget =
      Boolean(target.closest('[data-drag-handle], .modal-drag-handle, header, div[class*="border-b"]')) ||
      (contentRef.current ? (e.clientY - contentRef.current.getBoundingClientRect().top <= 75) : false);

    if (!isHeaderTarget) return;

    isDragging.current = true;
    dragStart.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      offsetX: dragOffset.x,
      offsetY: dragOffset.y,
    };

    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'grabbing';

    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch { /* Fallback for browsers without pointer capture support */ }
  }, [dragOffset]);

  useEffect(() => {
    if (!isRendered) return;

    function handlePointerMove(e: PointerEvent) {
      if (!isDragging.current) return;
      const dx = e.clientX - dragStart.current.mouseX;
      const dy = e.clientY - dragStart.current.mouseY;
      setDragOffset({
        x: dragStart.current.offsetX + dx,
        y: dragStart.current.offsetY + dy,
      });
    }

    function handlePointerUp() {
      if (!isDragging.current) return;
      isDragging.current = false;
      document.body.style.userSelect = '';
      document.body.style.cursor = '';

      setDragOffset((prev) => {
        if (prev.y > 120 && !preventClose) {
          onClose();
          return { x: 0, y: 0 };
        }
        return { x: 0, y: 0 };
      });
    }

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerUp);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    };
  }, [isRendered, preventClose, onClose]);

  // Robust Focus Trap
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key !== 'Tab') return;

    const focusable = contentRef.current?.querySelectorAll<HTMLElement>(
      'input:not([disabled]), button:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"]):not([disabled])',
    );

    if (!focusable || focusable.length === 0) {
      e.preventDefault();
      return;
    }

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const active = document.activeElement;

    if (!contentRef.current?.contains(active)) {
      e.preventDefault();
      first.focus();
      return;
    }

    if (e.shiftKey) {
      if (active === first) {
        e.preventDefault();
        last.focus();
      }
    } else {
      if (active === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }, []);

  const handleBackdropPointerDown = useCallback((e: React.PointerEvent) => {
    pointerDownTarget.current = e.target;
  }, []);

  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    // Only close if BOTH pointerdown AND click happened directly on the backdrop overlay
    if (
      pointerDownTarget.current === e.currentTarget &&
      e.target === e.currentTarget &&
      !preventClose
    ) {
      onClose();
    }
    pointerDownTarget.current = null;
  }, [preventClose, onClose]);

  if (!isRendered) return null;

  const hasDragOffset = dragOffset.x !== 0 || dragOffset.y !== 0;

  const modalContentNode = (
    <div
      ref={overlayRef}
      className={`fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-6 overflow-y-auto ${isExiting ? 'animate-modal-backdrop-out' : 'animate-modal-backdrop'}`}
      onKeyDown={handleKeyDown}
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[var(--backdrop-overlay)] backdrop-blur-md"
        onPointerDown={handleBackdropPointerDown}
        onClick={handleBackdropClick}
        aria-hidden="true"
      />

      {/* Content wrapper */}
      <div
        ref={contentRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={title || ariaLabel}
        className={`relative z-10 bg-[var(--surface)] text-[var(--text-primary)] rounded-t-[20px] sm:rounded-[var(--radius-large)] rounded-b-none sm:rounded-b-[var(--radius-large)] shadow-2xl w-full ${maxWidth} max-h-[90dvh] sm:max-h-[88vh] mb-0 sm:my-auto pb-[max(env(safe-area-inset-bottom,0px),0.75rem)] sm:pb-0 flex flex-col min-h-0 overflow-hidden outline-none ${isExiting ? 'animate-modal-content-out' : 'animate-modal-content'} border border-[var(--border-subtle)]`}
        style={hasDragOffset ? { transform: `translate3d(${dragOffset.x}px, ${dragOffset.y}px, 0)` } : undefined}
        onPointerDown={handlePointerDown}
      >
        <div className="w-full flex justify-center pt-2.5 pb-1 sm:hidden cursor-grab active:cursor-grabbing modal-drag-handle animate-fade-in" data-drag-handle="true" aria-hidden="true">
          <div className="w-12 h-1.5 rounded-full bg-[var(--surface-tertiary)] opacity-90" />
        </div>
        {title && (
          <header className="px-5 py-3.5 sm:py-4 border-b border-[var(--border-subtle)] flex items-center justify-between shrink-0 bg-[var(--surface)]">
            <h3 className="text-base font-bold text-[var(--text-primary)] tracking-tight">{title}</h3>
            {!preventClose && (
              <button 
                onClick={onClose} 
                className="p-1.5 rounded-[var(--radius-pill)] text-[var(--text-secondary)] hover:bg-[var(--surface-secondary)] ios-press cursor-pointer"
                aria-label="Close dialog"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </header>
        )}
        <div className="overflow-y-auto flex-1 min-h-0 overscroll-contain px-0.5">
          {children}
        </div>
      </div>
    </div>
  );

  return createPortal(modalContentNode, document.body);
}
