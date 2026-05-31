import { AlertCircle, LockKeyhole, RefreshCw } from 'lucide-react';

interface DashboardErrorProps {
  message: string;
  isAuthError?: boolean;
  onRetry: () => void;
  onUnlock?: () => void;
}

export default function DashboardError({ message, isAuthError = false, onRetry, onUnlock }: DashboardErrorProps) {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 text-center shadow-sm">
        <div className={`mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg ${isAuthError ? 'bg-blue-50 text-blue-600' : 'bg-red-50 text-red-500'}`}>
          {isAuthError ? <LockKeyhole size={24} /> : <AlertCircle size={24} />}
        </div>
        <h1 className="text-lg font-bold text-slate-800">
          {isAuthError ? 'PIN verification needed' : 'Unable to load dashboard'}
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          {message || 'Please try again. If the problem continues, check the Supabase configuration.'}
        </p>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row">
          {isAuthError && onUnlock ? (
            <button
              onClick={onUnlock}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
            >
              <LockKeyhole size={15} />
              Enter PIN
            </button>
          ) : null}
          <button
            onClick={onRetry}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
          >
            <RefreshCw size={15} />
            Try Again
          </button>
        </div>
      </div>
    </div>
  );
}

