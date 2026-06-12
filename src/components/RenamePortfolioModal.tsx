import React, { useState, useEffect } from 'react';
import { X, Check, Loader2 } from './icons/AppIcons';
import Modal from './Modal';

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
      <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
        <div>
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">Rename Portfolio</h3>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Change the display name for this family member</p>
        </div>
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-center text-slate-400 dark:text-slate-500 transition-colors"
          aria-label="Close dialog"
        >
          <X size={16} />
        </button>
      </div>
      <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">Display Name</label>
          <input
            type="text"
            autoFocus
            placeholder="e.g. Father's Portfolio"
            value={renameLabel}
            onChange={(e) => setRenameLabel(e.target.value)}
            className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-colors"
          />
        </div>

        {error && (
          <p className="text-xs text-red-500 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/50 rounded-xl px-3 py-2" role="alert">
            {error}
          </p>
        )}

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            disabled={submitting}
            onClick={onClose}
            className="flex-1 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold text-sm rounded-xl py-2.5 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting || !renameLabel.trim()}
            className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white font-semibold text-sm rounded-xl py-2.5 hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {submitting ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
            {submitting ? 'Saving...' : 'Save'}
          </button>
        </div>
      </form>
    </Modal>
  );
});
