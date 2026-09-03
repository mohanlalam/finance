import React, { useState } from 'react';
import { X, UserPlus, Loader2 } from './icons/AppIcons';
import Modal from './Modal';
import { Button } from './ui/Button';
import { IconButton } from './ui/IconButton';

interface AddFamilyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (label: string, name: string) => Promise<void>;
}

export default React.memo(function AddFamilyModal({
  isOpen,
  onClose,
  onSubmit,
}: AddFamilyModalProps) {
  const [newFamilyLabel, setNewFamilyLabel] = useState('');
  const [newFamilyName, setNewFamilyName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!newFamilyLabel.trim()) {
      setError('Display label is required');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const computedName = (newFamilyName.trim() || newFamilyLabel.trim())
        .toLowerCase()
        .replace(/\s+/g, '-');
      await onSubmit(newFamilyLabel.trim(), computedName);
      onClose();
      setNewFamilyLabel('');
      setNewFamilyName('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add family member');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      ariaLabel="Add Family Member"
      preventClose={submitting}
    >
      <div className="px-6 py-4 border-b border-[var(--border-subtle)] flex justify-between items-center bg-[var(--surface-secondary)]">
        <div>
          <h3 className="text-card-title font-semibold text-[var(--text-primary)]">Add Family Member</h3>
          <p className="text-supporting mt-0.5">A new portfolio shell will appear in the family tabs</p>
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
          <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">Display Label</label>
          <input
            type="text"
            placeholder="e.g. Father's Portfolio"
            value={newFamilyLabel}
            onChange={(e) => setNewFamilyLabel(e.target.value)}
            className="w-full bg-[var(--surface-secondary)] border border-[var(--border-subtle)] rounded-[var(--radius-medium)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:border-[var(--accent-blue)] focus:ring-1 focus:ring-[var(--accent-blue)] transition-all outline-none"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">
            Machine Key <span className="text-[var(--text-tertiary)] font-normal">(optional)</span>
          </label>
          <input
            type="text"
            placeholder="e.g. father"
            value={newFamilyName}
            onChange={(e) => setNewFamilyName(e.target.value)}
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
            disabled={submitting}
            className="flex-1"
          >
            {submitting ? <Loader2 size={14} className="animate-spin mr-1.5" /> : <UserPlus size={14} className="mr-1.5" />}
            {submitting ? 'Adding...' : 'Add Member'}
          </Button>
        </div>
      </form>
    </Modal>
  );
});
