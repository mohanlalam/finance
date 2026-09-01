import React from 'react';
import { FieldStatus } from '../../domains/smart-import/types';

interface ImportConfidenceBadgeProps {
  confidence?: number;
  status?: FieldStatus;
  source?: string;
  className?: string;
}

export const ImportConfidenceBadge: React.FC<ImportConfidenceBadgeProps> = ({
  confidence = 1.0,
  status = 'verified',
  source,
  className = '',
}) => {
  const pct = Math.round(confidence * 100);

  if (status === 'missing') {
    return (
      <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30 ${className}`}>
        Missing
      </span>
    );
  }

  if (confidence >= 0.92) {
    return (
      <span
        title={source ? `Extracted from: ${source}` : 'High AI confidence'}
        className={`inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 ${className}`}
      >
        <span>✓</span>
        <span>{pct}%</span>
      </span>
    );
  }

  if (confidence >= 0.75) {
    return (
      <span
        title={source ? `Extracted from: ${source}` : 'Needs visual verification'}
        className={`inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 ${className}`}
      >
        <span>⚠</span>
        <span>{pct}% Verify</span>
      </span>
    );
  }

  return (
    <span
      title={source ? `Extracted from: ${source}` : 'Low confidence — please check'}
      className={`inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30 ${className}`}
    >
      <span>⚠</span>
      <span>{pct}% Check</span>
    </span>
  );
};
