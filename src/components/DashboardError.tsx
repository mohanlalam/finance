import React from 'react';
import { AlertCircle, LockKeyhole, RefreshCw } from './icons/AppIcons';

interface DashboardErrorProps {
  message: string;
  isAuthError?: boolean;
  onRetry: () => void;
  onUnlock?: () => void;
}

function DashboardError({ message, isAuthError = false, onRetry, onUnlock }: DashboardErrorProps) {
  return (
    <div
      className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center px-4 py-10"
      role="alert"
    >
      <div className="w-full max-w-md rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 text-center shadow-sm">
        <div
          className={`mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg ${
            isAuthError
              ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
              : 'bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400'
          }`}
          aria-hidden="true"
        >
          {isAuthError ? <LockKeyhole size={24} /> : <AlertCircle size={24} />}
        </div>
        <h1 className="text-lg font-bold text-slate-800 dark:text-slate-100">
          {isAuthError ? 'PIN verification needed' : 'Unable to load dashboard'}
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
          {message || 'Please try again. If the problem continues, check the Supabase configuration.'}
        </p>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row">
          {isAuthError && onUnlock ? (
            <button
              onClick={onUnlock}
              aria-label="Enter PIN to unlock"
              className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
            >
              <LockKeyhole size={15} aria-hidden="true" />
              Enter PIN
            </button>
          ) : null}
          <button
            onClick={onRetry}
            aria-label="Retry loading dashboard"
            className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-slate-200 dark:border-slate-700 px-4 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-200 transition-colors hover:bg-slate-50 dark:hover:bg-slate-700"
          >
            <RefreshCw size={15} aria-hidden="true" />
            Try Again
          </button>
        </div>
      </div>
    </div>
  );
}

export default React.memo(DashboardError);
