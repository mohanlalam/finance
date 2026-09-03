import React, { useState, useEffect } from 'react';
import { X, Check, Loader2 } from './icons/AppIcons';
import Modal from './Modal';
import { Button } from './ui/Button';
import { IconButton } from './ui/IconButton';

interface RenamePortfolioModalProps {
  isOpen: boolean;
  target: { id: string; name: string; label: string } | null;
  onClose: () => void;
  onSubmit: (portfolioId: string, label: string) => Promise<void>;
}

export default React.memo(function RenamePortfolioModal({
  isOpen,
  target,
  onClose,
  onSubmit,
}: RenamePortfolioModalProps) {
  const [renameLabel, setRenameLabel] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (target) {
      setRenameLabel(target.label);
      setError('');
    }
  }, [target]);

  if (!target) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!target || !renameLabel.trim()) {
      setError('Display name is required');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await onSubmit(target.id, renameLabel.trim());
      onClose();
      setRenameLabel('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to rename portfolio');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      ariaLabel="Rename Portfolio"
      preventClose={submitting}
      maxWidth="max-w-sm"
    >
      <div className="px-6 py-4 border-b border-[var(--border-subtle)] flex justify-between items-center bg-[var(--surface-secondary)]">
        <div>
          <h3 className="text-card-title font-semibold text-[var(--text-primary)]">Rename Portfolio</h3>
          <p className="text-supporting mt-0.5">Change the display name for this family member</p>
        </div>
        <IconButton
          icon={<X size={15} />}
          title="Close dialog"
          onClick={onClose}
          disabled={submitting}
        />
      </div>
      <form onSubmit={handleSubmit} className="px-4 py-4 sm:px-6 sm:py-5 space-y-3.5 sm:space-y-4">
        <div>
          <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">Display Name</label>
          <input
            type="text"
            autoFocus
            placeholder="e.g. Father's Portfolio"
            value={renameLabel}
            onChange={(e) => setRenameLabel(e.target.value)}
            className="w-full bg-[var(--surface-secondary)] border border-[var(--border-subtle)] rounded-[var(--radius-medium)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:border-[var(--accent-blue)] focus:ring-1 focus:ring-[var(--accent-blue)] transition-all outline-none"
          />
        </div>

        {error && (
          <p className="text-xs text-[var(--negative)] bg-[var(--negative-soft)] border border-[var(--negative)]/30 rounded-[var(--radius-medium)] px-3 py-2" role="alert">
            {error}
          </p>
        )}

        <div className="flex gap-3 pt-2">
          <Button
            type="button"
            variant="secondary"
            disabled={submitting}
            onClick={onClose}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={submitting || !renameLabel.trim()}
            className="flex-1"
          >
            {submitting ? <Loader2 size={14} className="animate-spin mr-1.5" /> : <Check size={14} className="mr-1.5" />}
            {submitting ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </form>
    </Modal>
  );
});
