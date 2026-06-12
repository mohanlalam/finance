import { createContext, useContext, useState, useCallback, ReactNode, useMemo } from 'react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastMessage {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastStateContextProps {
  toasts: ToastMessage[];
}

interface ToastActionsContextProps {
  addToast: (message: string, type?: ToastType) => void;
  removeToast: (id: string) => void;
}

const ToastStateContext = createContext<ToastStateContextProps | undefined>(undefined);
const ToastActionsContext = createContext<ToastActionsContextProps | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const addToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);

    // Auto-dismiss after 3 seconds (3000ms)
    setTimeout(() => {
      removeToast(id);
    }, 3000);
  }, [removeToast]);

  const stateValue = useMemo(() => ({ toasts }), [toasts]);
  const actionsValue = useMemo(() => ({ addToast, removeToast }), [addToast, removeToast]);

  return (
    <ToastStateContext.Provider value={stateValue}>
      <ToastActionsContext.Provider value={actionsValue}>
        {children}
      </ToastActionsContext.Provider>
    </ToastStateContext.Provider>
  );
}

export function useToast() {
  const stateContext = useContext(ToastStateContext);
  const actionsContext = useContext(ToastActionsContext);
  if (!stateContext || !actionsContext) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return useMemo(() => ({
    toasts: stateContext.toasts,
    addToast: actionsContext.addToast,
    removeToast: actionsContext.removeToast,
  }), [stateContext.toasts, actionsContext.addToast, actionsContext.removeToast]);
}

export function useToastActions() {
  const context = useContext(ToastActionsContext);
  if (!context) {
    throw new Error('useToastActions must be used within a ToastProvider');
  }
  return context;
}
