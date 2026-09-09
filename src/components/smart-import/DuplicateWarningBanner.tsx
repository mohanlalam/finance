import React from 'react';
import { DuplicateMatch } from '../../domains/smart-import/types';
import { AlertCircle } from '../icons/AppIcons';

interface DuplicateWarningBannerProps {
  duplicate: DuplicateMatch | null;
  onDismiss: () => void;
}

export const DuplicateWarningBanner: React.FC<DuplicateWarningBannerProps> = ({
  duplicate,
  onDismiss,
}) => {
  if (!duplicate) return null;

  return (
    <div className="rounded-[var(--radius-medium)] border border-[var(--warning)]/30 bg-[var(--warning-soft)] p-3.5 text-[var(--warning)] animate-slide-up space-y-2">
      <div className="flex items-start gap-2.5">
        <AlertCircle size={18} className="text-[var(--warning)] shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <h5 className="text-xs font-bold uppercase tracking-wider text-[var(--warning)]">
            Possible Duplicate Holding Detected
          </h5>
          <p className="text-xs mt-0.5 text-[var(--text-secondary)]">
            {duplicate.details}
          </p>
          <div className="mt-2 flex items-center gap-2">
            <span className="text-[11px] font-semibold bg-[var(--warning)]/20 px-2 py-0.5 rounded text-[var(--warning)]">
              Matched: {duplicate.matchedFields.join(', ')}
            </span>
          </div>
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-1 border-t border-[var(--warning)]/20">
        <button
          type="button"
          onClick={onDismiss}
          className="text-xs font-semibold px-2.5 py-1 rounded-[var(--radius-small)] bg-[var(--warning)]/20 hover:bg-[var(--warning)]/30 text-[var(--warning)] transition-colors cursor-pointer"
        >
          Save Anyway
        </button>
      </div>
    </div>
  );
};
