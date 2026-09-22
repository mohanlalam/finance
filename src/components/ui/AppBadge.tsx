import React from 'react';

export type BadgeVariant = 'positive' | 'negative' | 'warning' | 'info' | 'encrypted' | 'urgency';

export interface AppBadgeProps {
  variant: BadgeVariant;
  children: React.ReactNode;
  icon?: React.ReactNode;
  isPulsing?: boolean;
  className?: string;
  onClick?: () => void;
}

const VARIANT_STYLES: Record<BadgeVariant, string> = {
  positive: 'bg-[var(--positive-soft)] text-[var(--positive)] border-[var(--positive)]/30',
  negative: 'bg-[var(--negative-soft)] text-[var(--negative)] border-[var(--negative)]/30',
  warning: 'bg-[var(--warning-soft)] text-[var(--warning)] border-[var(--warning)]/30',
  info: 'bg-[var(--accent-blue-soft)] text-[var(--accent-blue)] border-[var(--accent-blue)]/30',
  encrypted: 'bg-[var(--surface-secondary)] text-[var(--text-secondary)] border-[var(--border-subtle)] font-mono tracking-tight',
  urgency: 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30',
};

export const AppBadge: React.FC<AppBadgeProps> = ({
  variant,
  children,
  icon,
  isPulsing = false,
  className = '',
  onClick,
}) => {
  const baseClasses = `inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border transition-colors tnum shrink-0 ${VARIANT_STYLES[variant]} ${className}`;

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`${baseClasses} cursor-pointer hover:opacity-85 ios-press active:scale-[0.97]`}
      >
        {isPulsing && (
          <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse shrink-0" />
        )}
        {icon}
        <span>{children}</span>
      </button>
    );
  }

  return (
    <span className={baseClasses}>
      {isPulsing && (
        <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse shrink-0" />
      )}
      {icon}
      <span>{children}</span>
    </span>
  );
};

export default AppBadge;
