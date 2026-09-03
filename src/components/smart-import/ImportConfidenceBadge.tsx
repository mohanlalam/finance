import React, { useState, useRef, useEffect } from 'react';
import { FieldStatus } from '../../domains/smart-import/types';
import { Eye, CheckCircle2, AlertTriangle } from '../icons/AppIcons';

interface ImportConfidenceBadgeProps {
  confidence?: number;
  status?: FieldStatus;
  source?: string;
  snippet?: string;
  boundingBox?: [number, number, number, number];
  pageIndex?: number;
  fieldLabel?: string;
  className?: string;
}

export const ImportConfidenceBadge: React.FC<ImportConfidenceBadgeProps> = ({
  confidence = 1.0,
  status = 'verified',
  source,
  snippet,
  boundingBox,
  pageIndex = 1,
  fieldLabel,
  className = '',
}) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const pct = Math.round(confidence * 100);

  // Close tooltip on outside click
  useEffect(() => {
    if (!showTooltip) return;
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowTooltip(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [showTooltip]);

  if (status === 'missing') {
    return (
      <span
        className={`inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30 select-none ${className}`}
      >
        Missing
      </span>
    );
  }

  const isHigh = confidence >= 0.90;
  const isMedium = confidence >= 0.70;

  const badgeColor = isHigh
    ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/25'
    : isMedium
    ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 hover:bg-amber-500/25'
    : 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30 hover:bg-rose-500/25';

  const badgeIcon = isHigh ? (
    <CheckCircle2 size={10} />
  ) : (
    <AlertTriangle size={10} />
  );

  return (
    <div className="relative inline-flex items-center" ref={containerRef}>
      <button
        type="button"
        onClick={() => setShowTooltip((prev) => !prev)}
        aria-label="View evidence in document"
        title="Click to view extraction evidence and document coordinates"
        className={`inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded border transition-all cursor-pointer select-none ios-press ${badgeColor} ${className}`}
      >
        {badgeIcon}
        <span>{pct}%</span>
        <Eye size={9} className="opacity-70 ml-0.5" />
      </button>

      {/* Visual Hallucination Safeguard / Evidence Popover */}
      {showTooltip && (
        <div className="absolute right-0 top-full mt-1.5 z-50 w-72 p-3 rounded-[var(--radius-small)] bg-[var(--surface)] border border-[var(--border-subtle)] shadow-xl text-left animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-[var(--border-subtle)]">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--accent-blue)]">
                Document Evidence
              </span>
              <span
                className={`text-[9px] font-bold px-1 py-0.2 rounded border ${badgeColor}`}
              >
                {pct}% {isHigh ? 'High Confidence' : isMedium ? 'Verify' : 'Low Confidence'}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setShowTooltip(false)}
              className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)] text-xs cursor-pointer"
            >
              ✕
            </button>
          </div>

          {fieldLabel && (
            <p className="text-[10px] font-semibold text-[var(--text-secondary)] mb-1">
              Field: <span className="text-[var(--text-primary)] font-bold">{fieldLabel}</span>
            </p>
          )}

          {/* Verbatim Document Snippet */}
          <div className="p-2 rounded bg-[var(--surface-secondary)] border border-[var(--border-subtle)] mb-2">
            <p className="text-[9.5px] font-mono text-[var(--text-secondary)] leading-relaxed italic">
              "{snippet || source || 'Direct visual text extraction'}"
            </p>
          </div>

          {/* Document Anchor & Bounding Box Coordinates */}
          <div className="flex items-center justify-between text-[9px] text-[var(--text-tertiary)] font-mono">
            <span>Page: {pageIndex}</span>
            {boundingBox ? (
              <span>
                Box: [{boundingBox[0]}, {boundingBox[1]}, {boundingBox[2]}, {boundingBox[3]}]
              </span>
            ) : (
              <span>Verified Anchor</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
