import React, { ReactNode } from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  hoverable?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  onClick?: (e: React.MouseEvent<HTMLDivElement> | React.KeyboardEvent<HTMLDivElement>) => void;
}

export function Card({
  children,
  hoverable = false,
  padding = 'md',
  className = '',
  onClick,
  ...props
}: CardProps) {
  const paddingClasses = {
    none: '',
    sm: 'p-3',
    md: 'p-4 sm:p-5',
    lg: 'p-6 sm:p-8',
  };

  const isInteractive = hoverable || Boolean(onClick);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (isInteractive && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      onClick?.(e);
    }
  };

  return (
    <div
      role={isInteractive ? 'button' : undefined}
      tabIndex={isInteractive ? 0 : undefined}
      onClick={isInteractive ? onClick : undefined}
      onKeyDown={isInteractive ? handleKeyDown : undefined}
      className={`apple-card ${isInteractive ? 'apple-card-hover cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900' : ''} ${paddingClasses[padding]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export interface CardHeaderProps {
  title: ReactNode;
  subtitle?: ReactNode;
  action?: ReactNode;
  as?: 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
  className?: string;
}

export function CardHeader({
  title,
  subtitle,
  action,
  as: HeadingTag = 'h3',
  className = ''
}: CardHeaderProps) {
  return (
    <div className={`flex items-center justify-between gap-3 mb-3 min-w-0 ${className}`}>
      <div className="min-w-0 flex-1">
        <HeadingTag className="text-card-title font-semibold text-slate-800 dark:text-slate-200 truncate">
          {title}
        </HeadingTag>
        {subtitle && <p className="text-supporting mt-0.5 truncate">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0 flex items-center gap-2">{action}</div>}
    </div>
  );
}
