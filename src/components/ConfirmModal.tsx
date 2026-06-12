import { useCallback } from 'react';
import { AlertTriangle, Trash2, X } from './icons/AppIcons';
import Modal from './Modal';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Visual variant — affects the confirm button color */
  variant?: 'danger' | 'warning' | 'info';
  isLoading?: boolean;
}

const VARIANT_STYLES = {
  danger: {
    icon: <Trash2 size={20} className="text-red-500 dark:text-red-400" />,
    iconBg: 'bg-red-50 dark:bg-red-950/30',
    btn: 'bg-red-600 hover:bg-red-700 focus-visible:ring-red-500',
  },
  warning: {
    icon: <AlertTriangle size={20} className="text-amber-500 dark:text-amber-400" />,
    iconBg: 'bg-amber-50 dark:bg-amber-950/30',
    btn: 'bg-amber-600 hover:bg-amber-700 focus-visible:ring-amber-500',
  },
  info: {
    icon: <AlertTriangle size={20} className="text-blue-500 dark:text-blue-400" />,
    iconBg: 'bg-blue-50 dark:bg-blue-950/30',
    btn: 'bg-blue-600 hover:bg-blue-700 focus-visible:ring-blue-500',
  },
};

/**
 * Styled in-app confirmation dialog — replaces browser `confirm()` and `alert()`.
 * Supports danger / warning / info variants, async confirm callbacks, and loading state.
 */
export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
  isLoading = false,
}: ConfirmModalProps) {
  const styles = VARIANT_STYLES[variant];

  const handleConfirm = useCallback(async () => {
    await onConfirm();
  }, [onConfirm]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="max-w-sm"
      ariaLabel={title}
      preventClose={isLoading}
    >
      <div className="p-6">
        <div className="flex items-start gap-4">
          <div className={`w-10 h-10 rounded-full ${styles.iconBg} flex items-center justify-center shrink-0`}>
            {styles.icon}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 leading-snug">
              {title}
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
              {message}
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="w-7 h-7 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-center text-slate-400 dark:text-slate-500 transition-colors shrink-0 disabled:opacity-40"
            aria-label="Close"
          >
            <X size={14} />
          </button>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold text-sm rounded-xl py-2.5 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isLoading}
            className={`flex-1 text-white font-semibold text-sm rounded-xl py-2.5 transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${styles.btn}`}
          >
            {isLoading ? 'Please wait…' : confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}
