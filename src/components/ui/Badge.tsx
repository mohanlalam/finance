import React from 'react';

export type BadgeVariant = 'positive' | 'negative' | 'warning' | 'neutral' | 'info';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  children: React.ReactNode;
  variant?: BadgeVariant;
  icon?: React.ReactNode;
}

export function Badge({ children, variant = 'neutral', icon, className = '', ...props }: BadgeProps) {
  // Enhanced color classes to guarantee >= 4.5:1 WCAG AA contrast ratio on light backgrounds
  const variantClasses: Record<BadgeVariant, string> = {
    positive: 'bg-emerald-100/70 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/50 dark:border-emerald-800/40',
    negative: 'bg-rose-100/70 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200/50 dark:border-rose-800/40',
    warning: 'bg-amber-100/70 text-amber-900 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200/50 dark:border-amber-800/40',
    info: 'bg-blue-100/70 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200/50 dark:border-blue-800/40',
    neutral: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60',
  };

  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold tnum leading-tight select-none ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {icon && <span className="shrink-0 text-[10px]" aria-hidden="true">{icon}</span>}
      <span>{children}</span>
    </span>
  );
}
