import { useEffect, useRef, useCallback, useState, ReactNode } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  maxWidth?: string;
  ariaLabel?: string;
  /** Prevent closing via backdrop / Escape while an async action is pending */
  preventClose?: boolean;
}

/**
 * Reusable modal wrapper with Apple bottom-sheet behavior on mobile:
 * - Slide-up drawer on mobile devices, centered panel on desktop
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
  children,
  maxWidth = 'max-w-md',
  ariaLabel = 'Dialog',
  preventClose = false,
}: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);
  const [isRendered, setIsRendered] = useState(isOpen);
  const [isExiting, setIsExiting] = useState(false);

  // Drag state
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const isDragging = useRef(false);
  const dragStart = useRef<{ mouseX: number; mouseY: number; offsetX: number; offsetY: number }>({
    mouseX: 0, mouseY: 0, offsetX: 0, offsetY: 0,
  });

  // Reset drag position when modal opens/closes
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
      }, 250);
      return () => clearTimeout(timer);
    }
  }, [isOpen, isRendered]);

  // Lock body scroll & store previous focus
  useEffect(() => {
    if (isRendered && !isExiting) {
      previouslyFocused.current = document.activeElement as HTMLElement;
      document.body.style.overflow = 'hidden';

      // Focus first focusable element inside modal
      requestAnimationFrame(() => {
        const focusable = contentRef.current?.querySelectorAll<HTMLElement>(
          'input, button, select, textarea, [tabindex]:not([tabindex="-1"])',
        );
        if (focusable && focusable.length > 0) {
          focusable[0].focus();
        }
      });
    } else if (!isRendered) {
      document.body.style.overflow = '';
      previouslyFocused.current?.focus();
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isRendered, isExiting]);

  // Escape key handler
  useEffect(() => {
    if (!isOpen) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape' && !preventClose) {
        onClose();
      }
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose, preventClose]);

  // Drag-to-move pointer handlers (supports mouse + touch + stylus)
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    // Don't drag if clicking interactive form controls
    const target = e.target as HTMLElement;
    if (target.closest('button, input, select, textarea, a, label, [role="button"]')) return;

    // Check if click is on header, drag handle, or top section of modal
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
  }, [isRendered]);

  // Focus trap
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      const focusable = contentRef.current?.querySelectorAll<HTMLElement>(
        'input:not([disabled]), button:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"]):not([disabled])',
      );

      if (!focusable || focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    },
    [],
  );

  if (!isRendered) return null;

  const hasDragOffset = dragOffset.x !== 0 || dragOffset.y !== 0;

  return (
    <div
      ref={overlayRef}
      className={`fixed inset-0 z-[300] flex items-start sm:items-center justify-center p-3 sm:p-6 overflow-y-auto ${isExiting ? 'animate-modal-backdrop-out' : 'animate-modal-backdrop'}`}
      role="dialog"
      aria-modal="true"
      aria-label={ariaLabel}
      onKeyDown={handleKeyDown}
    >
      {/* Backdrop (high blur frosted panel) */}
      <div
        className="absolute inset-0 bg-[#000000]/30 dark:bg-[#000000]/60 backdrop-blur-md"
        onClick={() => !preventClose && onClose()}
        aria-hidden="true"
      />

      {/* Content wrapper: slides up on mobile, scales on desktop, draggable */}
      <div
        ref={contentRef}
        className={`relative bg-[var(--surface)] text-[var(--text-primary)] rounded-2xl shadow-floating w-full ${maxWidth} max-h-[calc(100vh-5rem)] sm:max-h-[72vh] my-auto flex flex-col min-h-0 overflow-hidden ${isExiting ? 'animate-modal-content-out' : 'animate-modal-content'} border border-[var(--border-subtle)]`}
        style={hasDragOffset ? { transform: `translate3d(${dragOffset.x}px, ${dragOffset.y}px, 0)` } : undefined}
        onPointerDown={handlePointerDown}
      >
        {/* iOS bottom sheet drag handle indicator pill */}
        <div className="w-full flex justify-center pt-2 pb-0.5 sm:hidden cursor-grab active:cursor-grabbing modal-drag-handle" data-drag-handle="true" aria-hidden="true">
          <div className="w-10 h-1 rounded-full bg-[#e5e5ea] dark:bg-[#38383a] opacity-80" />
        </div>
        {children}
      </div>
    </div>
  );
}
