import React from 'react';
import { ImportSaveStep } from '../../domains/smart-import/types';
import { RefreshCw, Check, AlertCircle } from '../icons/AppIcons';

interface ImportSaveProgressProps {
  step: ImportSaveStep;
  message: string;
}

const STEP_ORDER: { step: ImportSaveStep; label: string }[] = [
  { step: 'VALIDATING', label: 'Validate Data' },
  { step: 'SAVING_ASSET', label: 'Save Holding' },
  { step: 'UPLOADING_DOCUMENT', label: 'Upload Document' },
  { step: 'LINKING_DOCUMENT', label: 'Link Vault' },
  { step: 'SYNCING_PORTFOLIO', label: 'Sync Portfolio' },
];

export const ImportSaveProgress: React.FC<ImportSaveProgressProps> = ({ step, message }) => {
  if (step === 'IDLE') return null;

  const currentIdx = STEP_ORDER.findIndex((s) => s.step === step);
  const isError = step === 'ERROR';
  const isSuccess = step === 'SUCCESS';

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 p-4 space-y-3 animate-fade-in">
      <div className="flex items-center gap-3">
        {isSuccess ? (
          <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-600 flex items-center justify-center">
            <Check size={18} />
          </div>
        ) : isError ? (
          <div className="w-8 h-8 rounded-full bg-rose-500/20 text-rose-600 flex items-center justify-center">
            <AlertCircle size={18} />
          </div>
        ) : (
          <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-600 flex items-center justify-center animate-spin">
            <RefreshCw size={16} />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h5 className="text-xs font-bold text-slate-800 dark:text-slate-200">
            {isSuccess ? 'Import Complete' : isError ? 'Import Failed' : 'Saving Asset & Linking Document'}
          </h5>
          <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
            {message}
          </p>
        </div>
      </div>

      {!isSuccess && !isError && (
        <div className="grid grid-cols-5 gap-1.5 pt-1">
          {STEP_ORDER.map((item, idx) => {
            const isDone = currentIdx > idx;
            const isCurrent = currentIdx === idx;
            return (
              <div key={item.step} className="space-y-1">
                <div
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    isDone
                      ? 'bg-emerald-500'
                      : isCurrent
                      ? 'bg-amber-500 animate-pulse'
                      : 'bg-slate-200 dark:bg-slate-700'
                  }`}
                />
                <span className={`text-[9px] block text-center truncate ${
                  isCurrent ? 'font-bold text-amber-600 dark:text-amber-400' : 'text-slate-400'
                }`}>
                  {item.label}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
