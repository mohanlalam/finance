import React, { useRef, KeyboardEvent } from 'react';

export interface SegmentedControlOption<T> {
  id: T;
  label: React.ReactNode;
  disabled?: boolean;
}

export interface SegmentedControlProps<T extends string> {
  options: readonly SegmentedControlOption<T>[];
  value: T;
  onChange: (value: T) => void;
  name?: string;
  className?: string;
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  name,
  className = '',
}: SegmentedControlProps<T>) {
  const buttonRefs = useRef<Map<T, HTMLButtonElement>>(new Map());

  const enabledOptions = options.filter(o => !o.disabled);
  const currentIndex = enabledOptions.findIndex(o => o.id === value);

  const handleKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft' && e.key !== 'Home' && e.key !== 'End') {
      return;
    }

    e.preventDefault();
    let nextIndex = currentIndex;

    if (e.key === 'ArrowRight') {
      nextIndex = (currentIndex + 1) % enabledOptions.length;
    } else if (e.key === 'ArrowLeft') {
      nextIndex = (currentIndex - 1 + enabledOptions.length) % enabledOptions.length;
    } else if (e.key === 'Home') {
      nextIndex = 0;
    } else if (e.key === 'End') {
      nextIndex = enabledOptions.length - 1;
    }

    const nextOpt = enabledOptions[nextIndex];
    if (nextOpt) {
      onChange(nextOpt.id);
      buttonRefs.current.get(nextOpt.id)?.focus();
    }
  };

  return (
    <div
      role="radiogroup"
      aria-label={name}
      className={`inline-flex p-1 bg-slate-100 dark:bg-slate-800/90 rounded-xl gap-0.5 border border-slate-200/60 dark:border-slate-700/60 max-w-full overflow-x-auto scrollbar-none ${className}`}
    >
      {options.map((opt) => {
        const isActive = opt.id === value;
        return (
          <button
            key={opt.id}
            ref={(node) => {
              if (node) buttonRefs.current.set(opt.id, node);
              else buttonRefs.current.delete(opt.id);
            }}
            type="button"
            role="radio"
            aria-checked={isActive}
            tabIndex={isActive ? 0 : -1}
            disabled={opt.disabled}
            onClick={() => onChange(opt.id)}
            onKeyDown={handleKeyDown}
            className={`px-3 py-1.5 rounded-[9px] text-xs font-semibold ios-press transition-all duration-150 outline-none whitespace-nowrap focus-visible:ring-2 focus-visible:ring-blue-600 ${
              isActive
                ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-700 dark:text-slate-100'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
            } ${opt.disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
