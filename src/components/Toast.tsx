import { useToast, ToastMessage } from '../contexts/ToastContext';

// Inline SVGs for Toast Icons to prevent bundle-size bloat
function IconCheck() {
  return (
    <svg className="w-5 h-5 text-emerald-400 shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function IconError() {
  return (
    <svg className="w-5 h-5 text-red-400 shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  );
}

function IconWarning() {
  return (
    <svg className="w-5 h-5 text-amber-400 shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  );
}

function IconInfo() {
  return (
    <svg className="w-5 h-5 text-blue-400 shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function IconClose() {
  return (
    <svg className="w-4 h-4 shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

function ToastItem({ toast }: { toast: ToastMessage }) {
  const { removeToast } = useToast();

  const getToastStyles = () => {
    switch (toast.type) {
      case 'success':
        return {
          bg: 'bg-emerald-950/80 border-emerald-500/30 text-emerald-100',
          icon: <IconCheck />,
          shadow: 'shadow-emerald-900/10'
        };
      case 'error':
        return {
          bg: 'bg-red-950/80 border-red-500/30 text-red-100',
          icon: <IconError />,
          shadow: 'shadow-red-900/10'
        };
      case 'warning':
        return {
          bg: 'bg-amber-950/80 border-amber-500/30 text-amber-100',
          icon: <IconWarning />,
          shadow: 'shadow-amber-900/10'
        };
      case 'info':
      default:
        return {
          bg: 'bg-slate-900/80 border-blue-500/30 text-blue-100',
          icon: <IconInfo />,
          shadow: 'shadow-blue-900/10'
        };
    }
  };

  const styles = getToastStyles();

  return (
    <div
      role="alert"
      className={`flex items-center gap-3 px-4 py-3 rounded-xl border backdrop-blur-md shadow-lg animate-slide-in pointer-events-auto max-w-sm w-full md:w-auto transition-all ${styles.bg} ${styles.shadow}`}
    >
      {styles.icon}
      <p className="text-xs font-semibold flex-1 tracking-wide">{toast.message}</p>
      <button
        onClick={() => removeToast(toast.id)}
        className="text-slate-400 hover:text-slate-200 transition-colors p-1 rounded-lg hover:bg-white/5"
        aria-label="Close notification"
      >
        <IconClose />
      </button>
    </div>
  );
}

export default function ToastContainer() {
  const { toasts } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      className="fixed top-4 left-1/2 -translate-x-1/2 z-[500] flex flex-col gap-2 w-full max-w-[90%] md:max-w-md items-center pointer-events-none"
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </div>
  );
}
