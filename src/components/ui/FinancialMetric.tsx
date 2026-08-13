import React from 'react';
import { Card } from './Card';
import { Badge } from './Badge';
import { AnimatedNumber } from './AnimatedNumber';
import { Skeleton } from './Skeleton';
import { formatINR, formatPercent } from '../../utils/formatters';
import { usePrivacy } from '../../contexts/PrivacyContext';

export interface FinancialMetricProps {
  label: string;
  value: number;
  invested?: number;
  deltaPercent?: number;
  icon?: React.ReactNode;
  subtext?: string;
  isLoading?: boolean;
  isCurrency?: boolean;
  className?: string;
}

export function FinancialMetric({
  label,
  value,
  invested,
  deltaPercent,
  icon,
  subtext,
  isLoading = false,
  isCurrency = true,
  className = '',
}: FinancialMetricProps) {
  const { isBalancesHidden } = usePrivacy();

  if (isLoading) {
    return (
      <Card padding="md" className={`flex flex-col gap-2 ${className}`}>
        <div className="flex items-center justify-between">
          <Skeleton variant="text" width={100} height={14} />
          <Skeleton variant="circular" width={24} height={24} />
        </div>
        <Skeleton variant="text" width={140} height={28} />
        <Skeleton variant="text" width={80} height={12} />
      </Card>
    );
  }

  const isPositive = value >= 0;
  const isDeltaPositive = deltaPercent !== undefined ? deltaPercent >= 0 : isPositive;

  return (
    <Card padding="md" className={`flex flex-col justify-between gap-1.5 ${className}`}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-label-small uppercase tracking-wider text-[var(--text-secondary)] font-bold truncate">
          {label}
        </span>
        {icon && (
          <span className="w-6 h-6 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0" aria-hidden="true">
            {icon}
          </span>
        )}
      </div>

      <div className="flex items-baseline justify-between gap-2 my-0.5">
        <p className="text-financial tnum font-extrabold text-[var(--text-primary)] tracking-tight">
          {isBalancesHidden ? (
            <span aria-label="Amount hidden">••••••</span>
          ) : (
            <AnimatedNumber
              value={value}
              formatter={isCurrency ? formatINR : (val) => val.toLocaleString()}
            />
          )}
        </p>

        {deltaPercent !== undefined && (
          <Badge
            variant={isDeltaPositive ? 'positive' : 'negative'}
            className="shrink-0"
          >
            {isDeltaPositive ? '+' : ''}{formatPercent(deltaPercent, 1)}
          </Badge>
        )}
      </div>

      <div className="flex items-center justify-between text-supporting text-xs text-[var(--text-tertiary)]">
        <span>{subtext || (invested !== undefined ? `Cost: ${isBalancesHidden ? '••••••' : formatINR(invested)}` : '')}</span>
      </div>
    </Card>
  );
}
