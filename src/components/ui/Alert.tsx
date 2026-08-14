import { ReactNode } from 'react';

export type AlertVariant = 'info' | 'success' | 'warning' | 'error' | 'neutral';

export interface AlertProps {
  /** Visual intent variant */
  variant?: AlertVariant;
  /** Bold heading title */
  title?: ReactNode;
  /** Main message content */
  children: ReactNode;
  /** Custom icon override */
  icon?: ReactNode;
  /** Callback when close button is clicked (renders close button if present) */
  onClose?: () => void;
  /** Custom action slot (e.g. 'Retry' button) */
  action?: ReactNode;
  /** Extra container className */
  className?: string;
}

export function Alert({
  variant = 'info',
  title,
  children,
  icon,
  onClose,
  action,
  className = '',
}: AlertProps) {
  // Default icons for variants
  const defaultIcons: Record<AlertVariant, ReactNode> = {
    info: (
      <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="16" x2="12" y2="12" />
        <line x1="12" y1="8" x2="12.01" y2="8" />
      </svg>
    ),
    success: (
      <svg className="w-4 h-4 text-emerald-600 dark:text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
        <polyline points="22 4 12 14.01 9 11.01" />
      </svg>
    ),
    warning: (
      <svg className="w-4 h-4 text-amber-600 dark:text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    ),
    error: (
      <svg className="w-4 h-4 text-rose-600 dark:text-rose-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="10" />
        <line x1="15" y1="9" x2="9" y2="15" />
        <line x1="9" y1="9" x2="15" y2="15" />
      </svg>
    ),
    neutral: (
      <svg className="w-4 h-4 text-slate-600 dark:text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="16" x2="12" y2="12" />
        <line x1="12" y1="8" x2="12.01" y2="8" />
      </svg>
    ),
  };

  const variantStyles: Record<AlertVariant, string> = {
    info: 'bg-blue-50/80 dark:bg-blue-950/30 border-blue-200/80 dark:border-blue-900/50 text-blue-950 dark:text-blue-100',
    success: 'bg-emerald-50/80 dark:bg-emerald-950/30 border-emerald-200/80 dark:border-emerald-900/50 text-emerald-950 dark:text-emerald-100',
    warning: 'bg-amber-50/80 dark:bg-amber-950/30 border-amber-200/80 dark:border-amber-900/50 text-amber-950 dark:text-amber-100',
    error: 'bg-rose-50/80 dark:bg-rose-950/30 border-rose-200/80 dark:border-rose-900/50 text-rose-950 dark:text-rose-100',
    neutral: 'bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100',
  };

  const isAssertive = variant === 'error' || variant === 'warning';

  return (
    <div
      role={isAssertive ? 'alert' : 'status'}
      aria-live={isAssertive ? 'assertive' : 'polite'}
      className={`relative flex items-start gap-3 p-3.5 sm:p-4 rounded-[12px] border transition-all text-xs sm:text-sm ${variantStyles[variant]} ${className}`}
    >
      {/* Icon */}
      <span className="shrink-0 mt-0.5" aria-hidden="true">
        {icon || defaultIcons[variant]}
      </span>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {title && (
          <h4 className="font-semibold text-current mb-0.5 tracking-tight">
            {title}
          </h4>
        )}
        <div className="text-current opacity-90 leading-relaxed font-normal">
          {children}
        </div>

        {action && (
          <div className="mt-2.5 flex items-center gap-2">
            {action}
          </div>
        )}
      </div>

      {/* Dismiss Button */}
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Dismiss alert"
          className="shrink-0 p-1 -mr-1 -mt-1 rounded-md text-current opacity-60 hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/10 transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-current"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      )}
    </div>
  );
}
