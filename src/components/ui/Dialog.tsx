import React, {
  useEffect,
  useRef,
  useId,
  useCallback,
  ReactNode,
} from 'react';
import { createPortal } from 'react-dom';

export type DialogSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';

export interface DialogProps {
  /** Controlled open state */
  isOpen: boolean;
  /** Callback fired when dialog should close */
  onClose: () => void;
  /** Dialog title */
  title?: ReactNode;
  /** Optional subtitle or description */
  description?: ReactNode;
  /** Dialog content body */
  children: ReactNode;
  /** Optional footer action buttons */
  footer?: ReactNode;
  /** Dialog width sizing */
  size?: DialogSize;
  /** Whether to show the top-right close icon button */
  showCloseButton?: boolean;
  /** Whether pressing Escape key closes dialog */
  closeOnEsc?: boolean;
  /** Whether clicking the backdrop overlay closes dialog */
  closeOnBackdropClick?: boolean;
  /** Morph into native bottom sheet on mobile screens (<768px) */
  mobileSheet?: boolean;
  /** Extra container className */
  className?: string;
}

export function Dialog({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
  showCloseButton = true,
  closeOnEsc = true,
  closeOnBackdropClick = true,
  mobileSheet = true,
  className = '',
}: DialogProps) {
  const titleId = useId();
  const descriptionId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const previousActiveElementRef = useRef<HTMLElement | null>(null);

  // Focus trap and previous active element management
  useEffect(() => {
    if (isOpen) {
      previousActiveElementRef.current = document.activeElement as HTMLElement;

      // Lock body scroll
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';

      // Focus the first interactive element or dialog itself
      const timer = setTimeout(() => {
        if (dialogRef.current) {
          const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          );
          if (focusable.length > 0) {
            focusable[0].focus();
          } else {
            dialogRef.current.focus();
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

  // Handle ESC and Tab trapping
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape' && closeOnEsc) {
        e.stopPropagation();
        onClose();
        return;
      }

      if (e.key === 'Tab' && dialogRef.current) {
        const focusable = Array.from(
          dialogRef.current.querySelectorAll<HTMLElement>(
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

  const sizeClasses: Record<DialogSize, string> = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-2xl',
    full: 'max-w-4xl',
  };

  const dialogContent = (
    <div
      role="presentation"
      className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-slate-950/60 dark:bg-slate-950/80 backdrop-blur-xs transition-opacity duration-200 animate-in fade-in"
      onClick={(e) => {
        if (closeOnBackdropClick && e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        aria-describedby={description ? descriptionId : undefined}
        tabIndex={-1}
        onKeyDown={handleKeyDown}
        className={`relative w-full bg-white dark:bg-[#111726] border border-slate-200/80 dark:border-slate-800 shadow-2xl flex flex-col max-h-[90vh] sm:max-h-[85vh] outline-none ${
          mobileSheet
            ? 'rounded-t-[20px] sm:rounded-[16px] self-end sm:self-center animate-in slide-in-from-bottom sm:zoom-in-95'
            : 'rounded-[16px] animate-in zoom-in-95'
        } ${sizeClasses[size]} ${className}`}
      >
        {/* Mobile Grab Handle */}
        {mobileSheet && (
          <div className="sm:hidden flex justify-center pt-2.5 pb-1">
            <div className="w-10 h-1 rounded-full bg-slate-300 dark:bg-slate-700" aria-hidden="true" />
          </div>
        )}

        {/* Dialog Header */}
        {(title || showCloseButton) && (
          <div className="flex items-start justify-between px-5 pt-4 pb-3 border-b border-slate-100 dark:border-slate-800/80 shrink-0">
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
                aria-label="Close dialog"
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

        {/* Dialog Body */}
        <div className="px-5 py-4 overflow-y-auto flex-1 overscroll-contain">
          {children}
        </div>

        {/* Dialog Footer */}
        {footer && (
          <div className="px-5 py-3 bg-slate-50/80 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-end gap-2.5 rounded-b-[16px] shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(dialogContent, document.body) : null;
}
