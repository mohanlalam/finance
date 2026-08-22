import React, { useState, useEffect } from 'react';
import { X, Loader2, Key, Fingerprint } from './icons/AppIcons';
import Modal from './Modal';
import { Button } from './ui/Button';
import { IconButton } from './ui/IconButton';
import { verifyPin, setCustomPin, ensureHashedPin, hashPin } from '../utils/auth';
import { 
  isBiometricsSupported, 
  isBiometricsEnrolled, 
  registerBiometrics, 
  disableBiometrics 
} from '../utils/biometrics';

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
  const [biometricsAvailable, setBiometricsAvailable] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [biometricMsg, setBiometricMsg] = useState('');

  useEffect(() => {
    isBiometricsSupported().then((supported) => {
      setBiometricsAvailable(supported);
      if (supported) {
        setBiometricEnabled(isBiometricsEnrolled());
      }
    });
  }, []);

  const handleToggleBiometrics = async () => {
    setError('');
    setBiometricMsg('');

    if (biometricEnabled) {
      disableBiometrics();
      setBiometricEnabled(false);
      setBiometricMsg('Biometric unlock disabled');
    } else {
      try {
        let pinHash = await ensureHashedPin();
        if (!pinHash && currentPin) {
          const isValid = await verifyPin(currentPin);
          if (isValid) {
            pinHash = await hashPin(currentPin);
          }
        }
        if (!pinHash) {
          setError('Enter and verify current PIN first to enable biometrics');
          return;
        }
        const success = await registerBiometrics(pinHash);
        if (success) {
          setBiometricEnabled(true);
          setBiometricMsg('Biometric unlock enabled successfully');
        } else {
          setError('Biometric enrollment was cancelled or not supported on this device');
        }
      } catch {
        setError('Failed to setup biometric unlock');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setBiometricMsg('');

    if (!currentPin || !newPin || !confirmPin) {
      setError('All fields are required');
      return;
    }

    if (newPin.length < 4 || newPin.length > 10) {
      setError('New PIN must be between 4 and 10 digits');
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
          <h3 className="text-card-title font-semibold text-[var(--text-primary)]">Security & Passcode</h3>
          <p className="text-supporting mt-0.5">Manage PIN & biometric authentication</p>
        </div>
        <IconButton
          icon={<X size={15} />}
          title="Close dialog"
          onClick={onClose}
          disabled={isSubmitting}
        />
      </div>

      <div className="px-6 py-5 space-y-5">
        {error && (
          <div className="bg-[var(--negative-soft)] text-[var(--negative)] border border-[var(--negative)]/30 p-3 rounded-[var(--radius-medium)] text-xs font-semibold" role="alert">
            {error}
          </div>
        )}

        {biometricMsg && (
          <div className="bg-[var(--positive-soft)] text-[var(--positive)] border border-[var(--positive)]/30 p-3 rounded-[var(--radius-medium)] text-xs font-semibold" role="status">
            {biometricMsg}
          </div>
        )}

        {/* Biometric Toggle Section */}
        {biometricsAvailable && (
          <div className="p-3.5 rounded-[var(--radius-medium)] bg-[var(--surface-secondary)] border border-[var(--border-subtle)] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-[var(--accent-blue-soft)] text-[var(--accent-blue)] flex items-center justify-center shrink-0">
                <Fingerprint size={20} />
              </div>
              <div>
                <p className="text-xs font-bold text-[var(--text-primary)]">Biometric Unlock</p>
                <p className="text-[11px] text-[var(--text-tertiary)]">FaceID, TouchID or Fingerprint</p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleToggleBiometrics}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                biometricEnabled ? 'bg-[var(--accent-blue)]' : 'bg-[var(--border-subtle)]'
              }`}
              role="switch"
              aria-checked={biometricEnabled}
              aria-label="Toggle Biometric Unlock"
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                  biometricEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        )}

        <div className="relative flex items-center justify-center">
          <div className="border-t border-[var(--border-subtle)] w-full" />
          <span className="bg-[var(--surface)] px-3 text-[10px] uppercase tracking-wider font-extrabold text-[var(--text-tertiary)] absolute">
            Change 4-Digit PIN
          </span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
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
              {isSubmitting ? 'Saving...' : 'Update PIN'}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
