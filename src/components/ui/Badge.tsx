import React from 'react';

type BadgeVariant = 'positive' | 'negative' | 'warning' | 'neutral' | 'info';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  children: React.ReactNode;
  variant?: BadgeVariant;
}

export function Badge({ children, variant = 'neutral', className = '', ...props }: BadgeProps) {
  const variantClasses = {
    positive: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400',
    negative: 'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400',
    warning: 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400',
    info: 'bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400',
    neutral: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
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
