import React, { ButtonHTMLAttributes } from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({
  children,
  variant = 'secondary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  className = '',
  disabled,
  ...props
}, ref) => {
  const baseClasses = 'inline-flex items-center justify-center font-semibold rounded-[var(--radius-medium)] ios-press transition-all duration-150 outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-blue)] focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed select-none whitespace-nowrap leading-none';
  
  const variantClasses: Record<ButtonVariant, string> = {
    primary: 'bg-[var(--accent-blue)] text-white hover:opacity-95 active:opacity-90 shadow-xs focus-visible:ring-[var(--accent-blue)]',
    secondary: 'bg-[var(--surface)] text-[var(--text-primary)] hover:bg-[var(--surface-secondary)] active:bg-[var(--surface-tertiary)] border border-[var(--border-subtle)] shadow-xs focus-visible:ring-[var(--accent-blue)]',
    ghost: 'bg-transparent text-[var(--text-secondary)] hover:bg-[var(--surface-secondary)] hover:text-[var(--text-primary)] focus-visible:ring-[var(--accent-blue)]',
    danger: 'bg-[var(--negative)] text-white hover:opacity-95 active:opacity-90 shadow-xs focus-visible:ring-[var(--negative)]',
    success: 'bg-[var(--positive)] text-white hover:opacity-95 active:opacity-90 shadow-xs focus-visible:ring-[var(--positive)]',
  };

  const sizeClasses: Record<ButtonSize, string> = {
    sm: 'h-9 px-3 text-xs gap-1.5',
    md: 'h-10 px-4 text-sm gap-2',
    lg: 'h-12 px-5 text-base gap-2.5',
  };

  const isDisabled = disabled || isLoading;

  return (
    <button
      ref={ref}
      disabled={isDisabled}
      aria-disabled={isDisabled}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...props}
    >
      {isLoading ? (
        <svg className="animate-spin h-4 w-4 shrink-0 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      ) : leftIcon ? (
        <span className="shrink-0 inline-flex items-center justify-center" aria-hidden="true">{leftIcon}</span>
      ) : null}
      
      <span className="truncate inline-flex items-center justify-center gap-1.5">{children}</span>
      
      {!isLoading && rightIcon && (
        <span className="shrink-0 inline-flex items-center justify-center" aria-hidden="true">{rightIcon}</span>
      )}
    </button>
  );
});

Button.displayName = 'Button';

