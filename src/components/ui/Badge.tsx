import React from 'react';

type BadgeVariant = 'positive' | 'negative' | 'warning' | 'neutral' | 'info';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  children: React.ReactNode;
  variant?: BadgeVariant;
}

export function Badge({ children, variant = 'neutral', className = '', ...props }: BadgeProps) {
  const variantClasses = {
    positive: 'bg-[#e8f8ef] text-[#16a765] dark:bg-emerald-950/40 dark:text-emerald-400',
    negative: 'bg-[#fff0ef] text-[#ff3b30] dark:bg-red-950/40 dark:text-red-400',
    warning: 'bg-[#fff5e6] text-[#ff9500] dark:bg-amber-950/40 dark:text-amber-400',
    info: 'bg-[#eaf3ff] text-[#007aff] dark:bg-blue-950/40 dark:text-blue-400',
    neutral: 'bg-[#f2f2f7] text-[#6e6e73] dark:bg-zinc-800 dark:text-zinc-400',
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold tnum leading-tight ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}
