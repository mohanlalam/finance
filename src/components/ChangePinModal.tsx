import React, { useState } from 'react';
import { X, Loader2, Key } from './icons/AppIcons';
import Modal from './Modal';
import { Button } from './ui/Button';
import { IconButton } from './ui/IconButton';
import { verifyPin, setCustomPin } from '../utils/auth';

interface ChangePinModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function ChangePinModal({ onClose, onSuccess }: ChangePinModalProps) {
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!currentPin || !newPin || !confirmPin) {
      setError('All fields are required');
      return;
    }

    if (newPin.length < 4) {
      setError('New PIN must be at least 4 digits');
      return;
    }

    if (newPin !== confirmPin) {
      setError('New PIN and Confirm PIN do not match');
      return;
    }

    setIsSubmitting(true);
    try {
      const isValid = await verifyPin(currentPin);
      if (!isValid) {
        setError('Incorrect current PIN');
        setIsSubmitting(false);
        return;
      }

      await setCustomPin(newPin);
      onSuccess();
    } catch {
      setError('An error occurred while changing PIN');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={true} onClose={onClose} ariaLabel="Change PIN" maxWidth="max-w-sm">
      <div className="px-6 py-4 border-b border-[var(--border-subtle)] flex items-center justify-between bg-[var(--surface-secondary)]">
        <div>
          <h3 className="text-card-title font-semibold text-[var(--text-primary)]">Change Security PIN</h3>
          <p className="text-supporting mt-0.5">Update the passcode for app unlock</p>
        </div>
        <IconButton
          icon={<X size={15} />}
          title="Close dialog"
          onClick={onClose}
          disabled={isSubmitting}
        />
      </div>
      <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
        {error && (
          <div className="bg-[var(--negative-soft)] text-[var(--negative)] border border-[var(--negative)]/30 p-3 rounded-[var(--radius-medium)] text-xs font-semibold" role="alert">
            {error}
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">
            Current PIN
          </label>
          <input
            type="password"
            inputMode="numeric"
            autoFocus
            value={currentPin}
            onChange={(e) => setCurrentPin(e.target.value.replace(/\D/g, ''))}
            className="w-full bg-[var(--surface-secondary)] border border-[var(--border-subtle)] rounded-[var(--radius-medium)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:border-[var(--accent-blue)] focus:ring-1 focus:ring-[var(--accent-blue)] transition-all outline-none"
            maxLength={10}
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">
            New PIN (min 4 digits)
          </label>
          <input
            type="password"
            inputMode="numeric"
            value={newPin}
            onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
            className="w-full bg-[var(--surface-secondary)] border border-[var(--border-subtle)] rounded-[var(--radius-medium)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:border-[var(--accent-blue)] focus:ring-1 focus:ring-[var(--accent-blue)] transition-all outline-none"
            maxLength={10}
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">
            Confirm New PIN
          </label>
          <input
            type="password"
            inputMode="numeric"
            value={confirmPin}
            onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
            className="w-full bg-[var(--surface-secondary)] border border-[var(--border-subtle)] rounded-[var(--radius-medium)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:border-[var(--accent-blue)] focus:ring-1 focus:ring-[var(--accent-blue)] transition-all outline-none"
            maxLength={10}
          />
        </div>

        <div className="flex gap-3 pt-2">
          <Button
            type="button"
            variant="secondary"
            disabled={isSubmitting}
            onClick={onClose}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={isSubmitting}
            className="flex-1"
          >
            {isSubmitting ? <Loader2 size={14} className="animate-spin mr-1.5" /> : <Key size={14} className="mr-1.5" />}
            {isSubmitting ? 'Saving...' : 'Change PIN'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
