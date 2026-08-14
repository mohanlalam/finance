import React, { InputHTMLAttributes, forwardRef, useId, useState, useCallback } from 'react';

export type InputSize = 'sm' | 'md' | 'lg';
export type InputVariant = 'default' | 'filled' | 'flush';

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size' | 'prefix'> {
  /** Label for the input */
  label?: React.ReactNode;
  /** Helper text displayed below input */
  helperText?: React.ReactNode;
  /** Error message displayed below input */
  error?: React.ReactNode;
  /** Size of the input */
  size?: InputSize;
  /** Visual style variant */
  variant?: InputVariant;
  /** Element placed inside the input on the left (e.g. Search icon) */
  leftIcon?: React.ReactNode;
  /** Element placed inside the input on the right (e.g. Currency badge) */
  rightIcon?: React.ReactNode;
  /** Text prefix displayed before input (e.g. '₹' or 'https://') */
  prefix?: React.ReactNode;
  /** Text suffix displayed after input (e.g. '.com' or '%') */
  suffix?: React.ReactNode;
  /** Shows a loading spinner on the right */
  isLoading?: boolean;
  /** Enables a clear button when input has value */
  clearable?: boolean;
  /** Callback when clear button is clicked */
  onClear?: () => void;
  /** Full width container */
  fullWidth?: boolean;
  /** Extra container className */
  containerClassName?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({
  id: customId,
  label,
  helperText,
  error,
  size = 'md',
  variant = 'default',
  leftIcon,
  rightIcon,
  prefix,
  suffix,
  isLoading = false,
  clearable = false,
  onClear,
  fullWidth = true,
  className = '',
  containerClassName = '',
  disabled = false,
  required = false,
  value,
  onChange,
  ...props
}, ref) => {
  const generatedId = useId();
  const inputId = customId || generatedId;
  const helperId = `${inputId}-helper`;
  const errorId = `${inputId}-error`;

  const [isFocused, setIsFocused] = useState(false);

  const hasValue = value !== undefined && value !== '' && value !== null;
  const isInvalid = Boolean(error);

  const handleClear = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onClear) {
      onClear();
    }
  }, [onClear]);

  // Size styling maps
  const sizeClasses: Record<InputSize, { container: string; input: string; icon: string }> = {
    sm: {
      container: 'min-h-[34px] px-2.5 text-xs',
      input: 'py-1 text-xs',
      icon: 'w-3.5 h-3.5',
    },
    md: {
      container: 'min-h-[42px] px-3.5 text-sm',
      input: 'py-2 text-sm',
      icon: 'w-4 h-4',
    },
    lg: {
      container: 'min-h-[48px] px-4 text-base',
      input: 'py-2.5 text-base',
      icon: 'w-5 h-5',
    },
  };

  // Variant styling maps
  const variantClasses: Record<InputVariant, string> = {
    default: 'bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-xs',
    filled: 'bg-slate-100/90 dark:bg-slate-800/80 border border-transparent hover:border-slate-300 dark:hover:border-slate-700',
    flush: 'bg-transparent border-b border-slate-200 dark:border-slate-800 rounded-none px-0 shadow-none',
  };

  const focusClasses = isInvalid
    ? 'border-rose-500 ring-2 ring-rose-500/20 dark:border-rose-500 dark:ring-rose-500/30'
    : isFocused
    ? 'border-blue-600 ring-2 ring-blue-600/20 dark:border-blue-500 dark:ring-blue-500/30'
    : '';

  const disabledClasses = disabled
    ? 'opacity-60 bg-slate-50 dark:bg-slate-900/40 cursor-not-allowed select-none'
    : '';

  return (
    <div className={`${fullWidth ? 'w-full' : 'inline-block'} ${containerClassName}`}>
      {/* Label */}
      {label && (
        <div className="flex items-center justify-between mb-1.5">
          <label
            htmlFor={inputId}
            className="block text-xs font-semibold text-slate-700 dark:text-slate-300 tracking-tight"
          >
            {label}
            {required && <span className="text-rose-500 ml-0.5" aria-hidden="true">*</span>}
          </label>
        </div>
      )}

      {/* Input Container */}
      <div
        className={`relative flex items-center transition-all duration-150 rounded-[10px] ${sizeClasses[size].container} ${variantClasses[variant]} ${focusClasses} ${disabledClasses}`}
      >
        {/* Prefix text or left icon */}
        {leftIcon && (
          <span className={`mr-2.5 shrink-0 text-slate-400 dark:text-slate-500 ${sizeClasses[size].icon}`} aria-hidden="true">
            {leftIcon}
          </span>
        )}

        {prefix && (
          <span className="mr-1.5 text-slate-400 dark:text-slate-500 font-medium select-none text-financial" aria-hidden="true">
            {prefix}
          </span>
        )}

        {/* Core Input Element */}
        <input
          ref={ref}
          id={inputId}
          disabled={disabled}
          required={required}
          value={value}
          onChange={onChange}
          onFocus={(e) => {
            setIsFocused(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            props.onBlur?.(e);
          }}
          aria-invalid={isInvalid}
          aria-required={required}
          aria-describedby={
            [
              error ? errorId : null,
              helperText ? helperId : null,
            ].filter(Boolean).join(' ') || undefined
          }
          className={`w-full bg-transparent text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 font-normal outline-none text-financial ${sizeClasses[size].input} ${className}`}
          {...props}
        />

        {/* Suffix text */}
        {suffix && (
          <span className="ml-1.5 text-slate-400 dark:text-slate-500 font-medium select-none text-financial" aria-hidden="true">
            {suffix}
          </span>
        )}

        {/* Loading Spinner */}
        {isLoading && (
          <span className="ml-2 shrink-0 text-blue-600 dark:text-blue-400" aria-label="Loading">
            <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          </span>
        )}

        {/* Clear Button */}
        {!isLoading && clearable && hasValue && !disabled && (
          <button
            type="button"
            onClick={handleClear}
            className="ml-1.5 p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-700/60 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Clear input"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}

        {/* Right Icon */}
        {!isLoading && rightIcon && (
          <span className={`ml-2 shrink-0 text-slate-400 dark:text-slate-500 ${sizeClasses[size].icon}`} aria-hidden="true">
            {rightIcon}
          </span>
        )}
      </div>

      {/* Error or Helper Text */}
      {error ? (
        <p id={errorId} role="alert" className="mt-1.5 text-xs text-rose-600 dark:text-rose-400 font-medium flex items-center gap-1">
          <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span>{error}</span>
        </p>
      ) : helperText ? (
        <p id={helperId} className="mt-1.5 text-xs text-slate-500 dark:text-slate-400 font-normal">
          {helperText}
        </p>
      ) : null}
    </div>
  );
});

Input.displayName = 'Input';
