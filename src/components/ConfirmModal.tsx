import { useCallback } from 'react';
import { AlertTriangle, Trash2, X } from './icons/AppIcons';
import Modal from './Modal';
import { Button } from './ui/Button';
import { IconButton } from './ui/IconButton';

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
    icon: <Trash2 size={20} className="text-[var(--negative)]" />,
    iconBg: 'bg-[var(--negative-soft)]',
    btnVariant: 'danger' as const,
  },
  warning: {
    icon: <AlertTriangle size={20} className="text-[var(--warning)]" />,
    iconBg: 'bg-[var(--warning-soft)]',
    btnVariant: 'secondary' as const,
  },
  info: {
    icon: <AlertTriangle size={20} className="text-[var(--accent-blue)]" />,
    iconBg: 'bg-[var(--accent-blue-soft)]',
    btnVariant: 'primary' as const,
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
      <div className="p-4 sm:p-6">
        <div className="flex items-start gap-4">
          <div className={`w-10 h-10 rounded-[var(--radius-pill)] ${styles.iconBg} flex items-center justify-center shrink-0`}>
            {styles.icon}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-bold text-[var(--text-primary)] leading-snug">
              {title}
            </h3>
            <p className="text-sm text-[var(--text-secondary)] mt-1 leading-relaxed">
              {message}
            </p>
          </div>
          <IconButton
            icon={<X size={15} />}
            title="Close"
            onClick={onClose}
            disabled={isLoading}
          />
        </div>

        <div className="flex gap-3 mt-6">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={isLoading}
            className="flex-1"
          >
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant={styles.btnVariant}
            onClick={handleConfirm}
            disabled={isLoading}
            className="flex-1"
          >
            {isLoading ? 'Please wait…' : confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
