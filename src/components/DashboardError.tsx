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
      className="min-h-screen bg-[var(--app-background)] flex items-center justify-center px-4 py-10"
      role="alert"
    >
      <div className="w-full max-w-md apple-card p-6 sm:p-8 text-center shadow-[var(--shadow-floating)]">
        <div
          className={`mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-[var(--radius-medium)] ${
            isAuthError
              ? 'bg-[var(--accent-blue-soft)] text-[var(--accent-blue)]'
              : 'bg-[var(--negative-soft)] text-[var(--negative)]'
          }`}
          aria-hidden="true"
        >
          {isAuthError ? <LockKeyhole size={24} /> : <AlertCircle size={24} />}
        </div>
        <h1 className="text-lg font-bold text-[var(--text-primary)]">
          {isAuthError ? 'PIN verification needed' : 'Unable to load dashboard'}
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">
          {message || 'Please try again. If the problem continues, check your connection.'}
        </p>
        <div className="mt-6 flex flex-col gap-2.5 sm:flex-row">
          {isAuthError && onUnlock ? (
            <button
              onClick={onUnlock}
              aria-label="Enter PIN to unlock"
              className="flex flex-1 items-center justify-center gap-2 rounded-[var(--radius-medium)] bg-[var(--accent-blue)] px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 ios-press cursor-pointer"
            >
              <LockKeyhole size={15} aria-hidden="true" />
              Enter PIN
            </button>
          ) : null}
          <button
            onClick={onRetry}
            aria-label="Retry loading dashboard"
            className="flex flex-1 items-center justify-center gap-2 rounded-[var(--radius-medium)] border border-[var(--border-subtle)] bg-[var(--surface)] px-4 py-2.5 text-sm font-semibold text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-secondary)] hover:text-[var(--text-primary)] ios-press cursor-pointer"
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
