import React, { SelectHTMLAttributes, forwardRef, useId } from 'react';

export type SelectSize = 'sm' | 'md' | 'lg';

export interface SelectOption {
  value: string | number;
  label: string;
  disabled?: boolean;
}

export interface SelectOptionGroup {
  label: string;
  options: SelectOption[];
}

export interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  /** Label for the select field */
  label?: React.ReactNode;
  /** Helper text displayed below */
  helperText?: React.ReactNode;
  /** Error message displayed below */
  error?: React.ReactNode;
  /** Size variant */
  size?: SelectSize;
  /** Flat options array or grouped options array */
  options?: (SelectOption | SelectOptionGroup)[];
  /** Placeholder option text when no value selected */
  placeholder?: string;
  /** Left icon element */
  leftIcon?: React.ReactNode;
  /** Loading state indicator */
  isLoading?: boolean;
  /** Full width container */
  fullWidth?: boolean;
  /** Extra container className */
  containerClassName?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(({
  id: customId,
  label,
  helperText,
  error,
  size = 'md',
  options,
  placeholder,
  leftIcon,
  isLoading = false,
  fullWidth = true,
  className = '',
  containerClassName = '',
  disabled = false,
  required = false,
  children,
  ...props
}, ref) => {
  const generatedId = useId();
  const selectId = customId || generatedId;
  const helperId = `${selectId}-helper`;
  const errorId = `${selectId}-error`;

  const isInvalid = Boolean(error);

  const sizeClasses: Record<SelectSize, { container: string; select: string; icon: string }> = {
    sm: {
      container: 'min-h-[34px] text-xs',
      select: 'py-1 pl-2.5 pr-8 text-xs',
      icon: 'w-3.5 h-3.5',
    },
    md: {
      container: 'min-h-[42px] text-sm',
      select: 'py-2 pl-3.5 pr-9 text-sm',
      icon: 'w-4 h-4',
    },
    lg: {
      container: 'min-h-[48px] text-base',
      select: 'py-2.5 pl-4 pr-10 text-base',
      icon: 'w-5 h-5',
    },
  };

  const borderClasses = isInvalid
    ? 'border-rose-500 ring-2 ring-rose-500/20 dark:border-rose-500 dark:ring-rose-500/30'
    : 'border-slate-200 dark:border-slate-800 focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-600/20 dark:focus-within:border-blue-500 dark:focus-within:ring-blue-500/30';

  const disabledClasses = disabled || isLoading
    ? 'opacity-60 bg-slate-50 dark:bg-slate-900/40 cursor-not-allowed select-none'
    : 'bg-white dark:bg-slate-900/90 hover:border-slate-300 dark:hover:border-slate-700';

  return (
    <div className={`${fullWidth ? 'w-full' : 'inline-block'} ${containerClassName}`}>
      {/* Label */}
      {label && (
        <label
          htmlFor={selectId}
          className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 tracking-tight"
        >
          {label}
          {required && <span className="text-rose-500 ml-0.5" aria-hidden="true">*</span>}
        </label>
      )}

      {/* Select Box */}
      <div
        className={`relative flex items-center rounded-[10px] border transition-all duration-150 shadow-xs ${sizeClasses[size].container} ${borderClasses} ${disabledClasses}`}
      >
        {/* Left Icon */}
        {leftIcon && (
          <span className={`absolute left-3 pointer-events-none text-slate-400 dark:text-slate-500 ${sizeClasses[size].icon}`} aria-hidden="true">
            {leftIcon}
          </span>
        )}

        <select
          ref={ref}
          id={selectId}
          disabled={disabled || isLoading}
          required={required}
          aria-invalid={isInvalid}
          aria-required={required}
          aria-describedby={
            [
              error ? errorId : null,
              helperText ? helperId : null,
            ].filter(Boolean).join(' ') || undefined
          }
          className={`w-full bg-transparent appearance-none text-slate-900 dark:text-slate-100 font-normal outline-none cursor-pointer disabled:cursor-not-allowed ${leftIcon ? 'pl-9' : ''} ${sizeClasses[size].select} ${className}`}
          {...props}
        >
          {placeholder && (
            <option value="" disabled className="text-slate-400 dark:text-slate-600 bg-white dark:bg-slate-900">
              {placeholder}
            </option>
          )}

          {options
            ? options.map((opt, idx) => {
                if ('options' in opt) {
                  return (
                    <optgroup key={`group-${idx}`} label={opt.label} className="font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900">
                      {opt.options.map((childOpt) => (
                        <option
                          key={String(childOpt.value)}
                          value={childOpt.value}
                          disabled={childOpt.disabled}
                          className="font-normal text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-900"
                        >
                          {childOpt.label}
                        </option>
                      ))}
                    </optgroup>
                  );
                }
                return (
                  <option
                    key={String(opt.value)}
                    value={opt.value}
                    disabled={opt.disabled}
                    className="text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-900"
                  >
                    {opt.label}
                  </option>
                );
              })
            : children}
        </select>

        {/* Right Arrow / Spinner */}
        <div className="absolute right-3 pointer-events-none flex items-center text-slate-400 dark:text-slate-500">
          {isLoading ? (
            <svg className="animate-spin h-4 w-4 text-blue-600 dark:text-blue-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          ) : (
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          )}
        </div>
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

Select.displayName = 'Select';
