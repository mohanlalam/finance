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
      <div className="px-6 py-4 border-b border-[var(--border-subtle)] flex justify-between items-center bg-slate-50/50 dark:bg-zinc-800/10">
        <div>
          <h3 className="text-card-title font-semibold text-slate-800 dark:text-slate-200">Add Family Member</h3>
          <p className="text-supporting mt-0.5">A new portfolio shell will appear in the family tabs</p>
        </div>
        <IconButton
          icon={<X size={15} />}
          title="Close dialog"
          onClick={onClose}
          disabled={submitting}
        />
      </div>
      <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">Display Label</label>
          <input
            type="text"
            placeholder="e.g. Father's Portfolio"
            value={newFamilyLabel}
            onChange={(e) => setNewFamilyLabel(e.target.value)}
            className="w-full bg-[#f2f2f7] dark:bg-zinc-800 border border-transparent rounded-[14px] px-3 py-2 text-sm text-[var(--text-primary)] placeholder-slate-450 dark:placeholder-zinc-650 focus:bg-white dark:focus:bg-zinc-700/80 focus:ring-2 focus:ring-[#007aff] transition-all duration-150 outline-none"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
            Machine Key <span className="text-slate-400 dark:text-slate-550 font-normal">(optional)</span>
          </label>
          <input
            type="text"
            placeholder="e.g. father"
            value={newFamilyName}
            onChange={(e) => setNewFamilyName(e.target.value)}
            className="w-full bg-[#f2f2f7] dark:bg-zinc-800 border border-transparent rounded-[14px] px-3 py-2 text-sm text-[var(--text-primary)] placeholder-slate-450 dark:placeholder-zinc-650 focus:bg-white dark:focus:bg-zinc-700/80 focus:ring-2 focus:ring-[#007aff] transition-all duration-150 outline-none"
          />
        </div>

        {error && (
          <p className="text-xs text-red-500 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/50 rounded-[14px] px-3 py-2" role="alert">
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
