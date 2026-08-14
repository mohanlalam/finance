import { ReactNode } from 'react';
import { Card } from './Card';
import { Skeleton } from './Skeleton';
import { Tooltip } from './Tooltip';
import { Sparkline } from './Sparkline';

export type TrendDirection = 'positive' | 'negative' | 'neutral';

export interface StatCardProps {
  /** Metric headline label */
  title: string;
  /** Primary metric value */
  value: ReactNode;
  /** Optional prefix (e.g. '₹' or '$') */
  prefix?: string;
  /** Secondary change / return (e.g. '+12.4%' or '₹1,500') */
  change?: ReactNode;
  /** Trend direction for color tokens */
  trend?: TrendDirection;
  /** Comparison text (e.g. 'all time' or 'vs yesterday') */
  changePeriod?: string;
  /** Top-right icon element */
  icon?: ReactNode;
  /** Data points for embedded sparkline */
  sparklineData?: number[];
  /** Sparkline line color */
  sparklineColor?: string;
  /** Loading skeleton state */
  isLoading?: boolean;
  /** Error state message */
  error?: string;
  /** Tooltip explanation */
  tooltip?: string;
  /** Optional click handler */
  onClick?: () => void;
  /** Extra container className */
  className?: string;
}

export function StatCard({
  title,
  value,
  prefix,
  change,
  trend = 'neutral',
  changePeriod,
  icon,
  sparklineData,
  sparklineColor,
  isLoading = false,
  error,
  tooltip,
  onClick,
  className = '',
}: StatCardProps) {
  if (isLoading) {
    return (
      <Card padding="md" className={`flex flex-col justify-between min-h-[140px] ${className}`}>
        <div className="flex items-center justify-between">
          <Skeleton width="45%" height="16px" className="rounded-md" />
          <Skeleton width="32px" height="32px" className="rounded-md" />
        </div>
        <div className="my-2">
          <Skeleton width="70%" height="28px" className="rounded-md" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton width="30%" height="18px" className="rounded-md" />
          <Skeleton width="40%" height="14px" className="rounded-md" />
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card padding="md" className={`border-rose-200 dark:border-rose-900/50 bg-rose-50/40 dark:bg-rose-950/20 ${className}`}>
        <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 mb-2">
          <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span className="text-xs font-semibold">{title}</span>
        </div>
        <p className="text-xs text-rose-600/80 dark:text-rose-400/80">{error}</p>
      </Card>
    );
  }

  const trendStyles: Record<TrendDirection, { pill: string; icon: ReactNode }> = {
    positive: {
      pill: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60',
      icon: (
        <svg className="w-3 h-3 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <polyline points="18 15 12 9 6 15" />
        </svg>
      ),
    },
    negative: {
      pill: 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200/60 dark:border-rose-800/60',
      icon: (
        <svg className="w-3 h-3 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      ),
    },
    neutral: {
      pill: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60',
      icon: null,
    },
  };

  return (
    <Card
      hoverable={Boolean(onClick)}
      onClick={onClick}
      padding="md"
      className={`flex flex-col justify-between relative overflow-hidden transition-all duration-150 ${className}`}
    >
      {/* Top row: Title + Tooltip + Icon */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider truncate">
            {title}
          </span>
          {tooltip && (
            <Tooltip content={tooltip} placement="top">
              <button
                type="button"
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 focus:outline-none"
                aria-label={`Info about ${title}`}
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="16" x2="12" y2="12" />
                  <line x1="12" y1="8" x2="12.01" y2="8" />
                </svg>
              </button>
            </Tooltip>
          )}
        </div>

        {icon && (
          <div className="w-8 h-8 rounded-[8px] bg-slate-100 dark:bg-slate-800/80 flex items-center justify-center text-slate-600 dark:text-slate-300 shrink-0">
            {icon}
          </div>
        )}
      </div>

      {/* Center: Metric Value */}
      <div className="my-1 flex items-baseline gap-1">
        {prefix && (
          <span className="text-base sm:text-lg font-medium text-slate-400 dark:text-slate-500 select-none text-financial">
            {prefix}
          </span>
        )}
        <div className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight text-financial">
          {value}
        </div>
      </div>

      {/* Bottom row: Trend Pill + Comparison Text + Sparkline */}
      <div className="mt-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          {change !== undefined && change !== null && (
            <span
              className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-semibold select-none text-financial ${trendStyles[trend].pill}`}
            >
              {trendStyles[trend].icon}
              <span>{change}</span>
            </span>
          )}

          {changePeriod && (
            <span className="text-[11px] text-slate-400 dark:text-slate-500 font-normal">
              {changePeriod}
            </span>
          )}
        </div>

        {/* Embedded Sparkline */}
        {sparklineData && sparklineData.length > 1 && (
          <div className="w-16 h-6 shrink-0 opacity-85">
            <Sparkline
              data={sparklineData}
              color={
                sparklineColor ||
                (trend === 'positive' ? '#10b981' : trend === 'negative' ? '#ef4444' : '#3b82f6')
              }
              height={24}
              width={64}
            />
          </div>
        )}
      </div>
    </Card>
  );
}
