import React from 'react';

interface SegmentedControlOption<T> {
  id: T;
  label: React.ReactNode;
}

interface SegmentedControlProps<T> {
  options: readonly SegmentedControlOption<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  className = '',
}: SegmentedControlProps<T>) {
  return (
    <div className={`inline-flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl gap-0.5 border border-slate-200/50 dark:border-slate-700/50 ${className}`}>
      {options.map((opt) => {
        const isActive = opt.id === value;
        return (
          <button
            key={opt.id}
            onClick={() => onChange(opt.id)}
            className={`px-3 py-1 rounded-[10px] text-xs font-semibold ios-press transition-all duration-200 outline-none ${
              isActive
                ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-700 dark:text-slate-100'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
