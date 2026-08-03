import { useState, useEffect, useRef, useCallback } from 'react';
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
  const [isExiting, setIsExiting] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const timerRef = useRef<NodeJS.Timeout>();
  const startTimeRef = useRef<number>(Date.now());
  const remainingTimeRef = useRef<number>(3000);

  const handleClose = useCallback(() => {
    setIsExiting(true);
    setTimeout(() => {
      removeToast(toast.id);
    }, 250);
  }, [removeToast, toast.id]);

  useEffect(() => {
    if (!isHovered) {
      startTimeRef.current = Date.now();
      timerRef.current = setTimeout(handleClose, remainingTimeRef.current);
    } else {
      if (timerRef.current) clearTimeout(timerRef.current);
      remainingTimeRef.current -= Date.now() - startTimeRef.current;
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isHovered, handleClose]);

  const getToastStyles = () => {
    switch (toast.type) {
      case 'success':
        return {
          bg: 'bg-[#0f172a]/90 text-white border-emerald-500/40 dark:bg-[#1e293b]/95',
          icon: <IconCheck />,
        };
      case 'error':
        return {
          bg: 'bg-[#0f172a]/90 text-white border-red-500/40 dark:bg-[#1e293b]/95',
          icon: <IconError />,
        };
      case 'warning':
        return {
          bg: 'bg-[#0f172a]/90 text-white border-amber-500/40 dark:bg-[#1e293b]/95',
          icon: <IconWarning />,
        };
      case 'info':
      default:
        return {
          bg: 'bg-[#0f172a]/90 text-white border-blue-500/40 dark:bg-[#1e293b]/95',
          icon: <IconInfo />,
        };
    }
  };

  const styles = getToastStyles();

  return (
    <div
      role="alert"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`flex items-center gap-3 px-5 py-2.5 rounded-full border backdrop-blur-xl shadow-2xl pointer-events-auto max-w-sm w-auto transition-all duration-200 ${styles.bg} ${isExiting ? 'animate-slide-out scale-95 opacity-0' : 'animate-slide-in scale-100 opacity-100'}`}
    >
      {styles.icon}
      <p className="text-xs font-semibold tracking-tight text-white flex-1">{toast.message}</p>
      <button
        onClick={handleClose}
        className="text-white/60 hover:text-white transition-colors p-1 rounded-full hover:bg-white/10"
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
