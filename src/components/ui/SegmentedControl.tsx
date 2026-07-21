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
    <div className={`inline-flex p-1 bg-[#f2f2f7] dark:bg-zinc-800 rounded-xl gap-0.5 border border-slate-200/40 dark:border-zinc-700/30 ${className}`}>
      {options.map((opt) => {
        const isActive = opt.id === value;
        return (
          <button
            key={opt.id}
            onClick={() => onChange(opt.id)}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all duration-200 outline-none ${
              isActive
                ? 'bg-white text-[#1d1d1f] shadow-sm dark:bg-zinc-700 dark:text-[#f5f5f7]'
                : 'text-[#6e6e73] hover:text-[#1d1d1f] dark:text-[#98989d] dark:hover:text-[#f5f5f7]'
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
