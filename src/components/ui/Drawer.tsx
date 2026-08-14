import React, {
  useEffect,
  useRef,
  useId,
  useCallback,
  ReactNode,
} from 'react';
import { createPortal } from 'react-dom';

export type DrawerPlacement = 'right' | 'left' | 'bottom';
export type DrawerSize = 'sm' | 'md' | 'lg' | 'full';

export interface DrawerProps {
  /** Controlled open state */
  isOpen: boolean;
  /** Callback when drawer requests to close */
  onClose: () => void;
  /** Title for the drawer */
  title?: ReactNode;
  /** Optional subtitle or descriptive text */
  description?: ReactNode;
  /** Drawer placement edge */
  placement?: DrawerPlacement;
  /** Width / height sizing */
  size?: DrawerSize;
  /** Drawer body content */
  children: ReactNode;
  /** Optional sticky footer actions */
  footer?: ReactNode;
  /** Whether to show close button */
  showCloseButton?: boolean;
  /** ESC key closes drawer */
  closeOnEsc?: boolean;
  /** Backdrop click closes drawer */
  closeOnBackdropClick?: boolean;
  /** Additional drawer container className */
  className?: string;
}

export function Drawer({
  isOpen,
  onClose,
  title,
  description,
  placement = 'right',
  size = 'md',
  children,
  footer,
  showCloseButton = true,
  closeOnEsc = true,
  closeOnBackdropClick = true,
  className = '',
}: DrawerProps) {
  const titleId = useId();
  const descriptionId = useId();
  const drawerRef = useRef<HTMLDivElement>(null);
  const previousActiveElementRef = useRef<HTMLElement | null>(null);

  // Focus trap and previous active element management
  useEffect(() => {
    if (isOpen) {
      previousActiveElementRef.current = document.activeElement as HTMLElement;

      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';

      const timer = setTimeout(() => {
        if (drawerRef.current) {
          const focusable = drawerRef.current.querySelectorAll<HTMLElement>(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          );
          if (focusable.length > 0) {
            focusable[0].focus();
          } else {
            drawerRef.current.focus();
          }
        }
      }, 50);

      return () => {
        clearTimeout(timer);
        document.body.style.overflow = originalOverflow;
        if (previousActiveElementRef.current && typeof previousActiveElementRef.current.focus === 'function') {
          previousActiveElementRef.current.focus();
        }
      };
    }
  }, [isOpen]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape' && closeOnEsc) {
        e.stopPropagation();
        onClose();
        return;
      }

      if (e.key === 'Tab' && drawerRef.current) {
        const focusable = Array.from(
          drawerRef.current.querySelectorAll<HTMLElement>(
            'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
          )
        );

        if (focusable.length === 0) return;

        const firstElement = focusable[0];
        const lastElement = focusable[focusable.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    },
    [closeOnEsc, onClose]
  );

  if (!isOpen) return null;

  // Placement styles
  const placementClasses: Record<DrawerPlacement, Record<DrawerSize, string>> = {
    right: {
      sm: 'inset-y-0 right-0 max-w-xs w-full animate-in slide-in-from-right duration-250',
      md: 'inset-y-0 right-0 max-w-md w-full animate-in slide-in-from-right duration-250',
      lg: 'inset-y-0 right-0 max-w-xl w-full animate-in slide-in-from-right duration-250',
      full: 'inset-y-0 right-0 max-w-4xl w-full animate-in slide-in-from-right duration-250',
    },
    left: {
      sm: 'inset-y-0 left-0 max-w-xs w-full animate-in slide-in-from-left duration-250',
      md: 'inset-y-0 left-0 max-w-md w-full animate-in slide-in-from-left duration-250',
      lg: 'inset-y-0 left-0 max-w-xl w-full animate-in slide-in-from-left duration-250',
      full: 'inset-y-0 left-0 max-w-4xl w-full animate-in slide-in-from-left duration-250',
    },
    bottom: {
      sm: 'inset-x-0 bottom-0 max-h-[40vh] w-full rounded-t-[20px] animate-in slide-in-from-bottom duration-250',
      md: 'inset-x-0 bottom-0 max-h-[65vh] w-full rounded-t-[20px] animate-in slide-in-from-bottom duration-250',
      lg: 'inset-x-0 bottom-0 max-h-[85vh] w-full rounded-t-[20px] animate-in slide-in-from-bottom duration-250',
      full: 'inset-x-0 bottom-0 max-h-[95vh] w-full rounded-t-[20px] animate-in slide-in-from-bottom duration-250',
    },
  };

  const drawerElement = (
    <div
      role="presentation"
      className="fixed inset-0 z-50 bg-slate-950/50 dark:bg-slate-950/75 backdrop-blur-xs transition-opacity duration-200 animate-in fade-in"
      onClick={(e) => {
        if (closeOnBackdropClick && e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        aria-describedby={description ? descriptionId : undefined}
        tabIndex={-1}
        onKeyDown={handleKeyDown}
        className={`fixed bg-white dark:bg-[#101625] border-l border-slate-200/80 dark:border-slate-800 shadow-2xl flex flex-col outline-none z-50 ${placementClasses[placement][size]} ${className}`}
      >
        {/* Grab Handle for bottom placement */}
        {placement === 'bottom' && (
          <div className="flex justify-center pt-2.5 pb-1">
            <div className="w-12 h-1 rounded-full bg-slate-300 dark:bg-slate-700" aria-hidden="true" />
          </div>
        )}

        {/* Drawer Header */}
        {(title || showCloseButton) && (
          <div className="flex items-start justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800/80 shrink-0">
            <div className="min-w-0 pr-4">
              {title && (
                <h2
                  id={titleId}
                  className="text-base sm:text-lg font-semibold text-slate-900 dark:text-slate-100 tracking-tight truncate"
                >
                  {title}
                </h2>
              )}
              {description && (
                <p id={descriptionId} className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {description}
                </p>
              )}
            </div>

            {showCloseButton && (
              <button
                type="button"
                onClick={onClose}
                aria-label="Close drawer"
                className="shrink-0 p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            )}
          </div>
        )}

        {/* Drawer Content */}
        <div className="px-5 py-4 overflow-y-auto flex-1 overscroll-contain">
          {children}
        </div>

        {/* Drawer Footer */}
        {footer && (
          <div className="px-5 py-3.5 bg-slate-50/90 dark:bg-slate-900/60 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-end gap-2.5 shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(drawerElement, document.body) : null;
}
