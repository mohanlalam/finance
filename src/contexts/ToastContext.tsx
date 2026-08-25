/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useCallback, ReactNode, useMemo } from 'react';
import { toUserErrorMessage } from '../shared/errors/AppError';

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
  addErrorToast: (error: unknown) => void;
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
  }, []);

  const addErrorToast = useCallback((error: unknown) => {
    const message = toUserErrorMessage(error);
    addToast(message, 'error');
  }, [addToast]);

  const stateValue = useMemo(() => ({ toasts }), [toasts]);
  const actionsValue = useMemo(() => ({ addToast, addErrorToast, removeToast }), [addToast, addErrorToast, removeToast]);

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
    addErrorToast: actionsContext.addErrorToast,
    removeToast: actionsContext.removeToast,
  }), [stateContext.toasts, actionsContext.addToast, actionsContext.addErrorToast, actionsContext.removeToast]);
}

export function useToastActions() {
  const context = useContext(ToastActionsContext);
  if (!context) {
    throw new Error('useToastActions must be used within a ToastProvider');
  }
  return context;
}
