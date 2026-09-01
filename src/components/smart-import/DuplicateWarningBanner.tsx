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
    <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3.5 text-amber-800 dark:text-amber-300 animate-slide-up space-y-2">
      <div className="flex items-start gap-2.5">
        <AlertCircle size={18} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <h5 className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
            Possible Duplicate Holding Detected
          </h5>
          <p className="text-xs mt-0.5 text-slate-700 dark:text-slate-300">
            {duplicate.details}
          </p>
          <div className="mt-2 flex items-center gap-2">
            <span className="text-[11px] font-semibold bg-amber-500/20 px-2 py-0.5 rounded text-amber-700 dark:text-amber-300">
              Matched: {duplicate.matchedFields.join(', ')}
            </span>
          </div>
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-1 border-t border-amber-500/20">
        <button
          type="button"
          onClick={onDismiss}
          className="text-xs font-semibold px-2.5 py-1 rounded bg-amber-600/20 hover:bg-amber-600/30 text-amber-800 dark:text-amber-200 transition-colors"
        >
          Save Anyway
        </button>
      </div>
    </div>
  );
};
