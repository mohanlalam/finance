import React, { useState } from 'react';
import { Insurance, DocumentMetadata } from '../../types/portfolio';
import { formatINR } from '../../utils/formatters';
import { getPolicyRenewalStatus } from '../../utils/insuranceUtils';
import { useDocumentStorage } from '../../hooks/useDocumentStorage';
import { useToastActions } from '../../contexts/ToastContext';
import { Edit2, Trash2, Shield, ShieldAlert, Calendar, FileText, StickyNote, Paperclip } from '../icons/AppIcons';

interface InsurancePolicyCardProps {
  policy: Insurance;
  documents: DocumentMetadata[];
  onOpenEdit: (policy: Insurance) => void;
  onConfirmDelete: (policy: Insurance) => void;
}

const TYPE_STYLES: Record<Insurance['insurance_type'], { bg: string; text: string; label: string }> = {
  health: { bg: 'bg-[var(--accent-blue-soft)] text-[var(--accent-blue)]', text: 'text-[var(--accent-blue)]', label: 'Health' },
  term: { bg: 'bg-[var(--accent-violet)]/10 text-[var(--accent-violet)]', text: 'text-[var(--accent-violet)]', label: 'Term Life' },
  life: { bg: 'bg-[var(--positive-soft)] text-[var(--positive)]', text: 'text-[var(--positive)]', label: 'Life' },
  motor: { bg: 'bg-[var(--warning-soft)] text-[var(--warning)]', text: 'text-[var(--warning)]', label: 'Motor' },
  other: { bg: 'bg-[var(--surface-secondary)] text-[var(--text-secondary)]', text: 'text-[var(--text-secondary)]', label: 'General' },
};

export const InsurancePolicyCard = React.memo(function InsurancePolicyCard({
  policy,
  documents,
  onOpenEdit,
  onConfirmDelete,
}: InsurancePolicyCardProps) {
  const { openDocument: openSecureDocument } = useDocumentStorage();
  const { addToast } = useToastActions();
  const [showNotes, setShowNotes] = useState(false);
  const [openingDocId, setOpeningDocId] = useState<string | null>(null);

  const style = TYPE_STYLES[policy.insurance_type] || TYPE_STYLES.other;
  const docs = documents.filter((d) => d.asset_type === 'insurance' && d.asset_id === policy.id);

  const renewalStatus = getPolicyRenewalStatus(policy);
  const isExpiringSoon = renewalStatus.isDueSoon || renewalStatus.isOverdue;
  const isOverdue = renewalStatus.isOverdue;
  const daysRemaining = renewalStatus.daysRemaining !== Infinity ? renewalStatus.daysRemaining : null;

  const handleOpenDocument = async (doc: DocumentMetadata) => {
    if (openingDocId) return;
    setOpeningDocId(doc.id);
    try {
      await openSecureDocument(doc.file_path);
    } catch (err) {
      console.error('Failed to open document:', err);
      const msg = err instanceof Error ? err.message : 'Failed to open document';
      addToast(`Could not open document: ${msg}`, 'error');
    } finally {
      setOpeningDocId(null);
    }
  };

  return (
    <div className="p-3.5 sm:p-4 hover:bg-[var(--surface-secondary)]/50 transition-colors mobile-asset-card">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2.5">
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <div className={`w-8 h-8 rounded-[var(--radius-small)] flex items-center justify-center shrink-0 border border-[var(--border-subtle)] ${style.bg}`}>
            {isExpiringSoon ? <ShieldAlert size={16} className="text-[var(--negative)]" /> : <Shield size={16} className={style.text} />}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="font-bold text-[var(--text-primary)] text-sm truncate">{policy.policy_name}</h4>
              <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-[var(--radius-pill)] ${style.bg} shrink-0`}>
                {style.label}
              </span>
              {docs.length > 0 ? (
                <button
                  type="button"
                  onClick={() => handleOpenDocument(docs[0])}
                  disabled={!!openingDocId}
                  className="text-[9px] font-bold px-1.5 py-0.5 rounded-[var(--radius-small)] bg-[var(--positive-soft)] text-[var(--positive)] border border-[var(--positive)]/30 shrink-0 hover:bg-[var(--positive)]/20 transition-colors cursor-pointer flex items-center gap-1 disabled:opacity-50"
                  title={docs.length === 1 ? `Open document: ${docs[0].name}` : `Open document: ${docs[0].name} (${docs.length} attached)`}
                  aria-label={docs.length === 1 ? `Open document: ${docs[0].name}` : `Open document: ${docs[0].name} (${docs.length} attached)`}
                >
                  {openingDocId && docs.some((d) => d.id === openingDocId) ? (
                    <span className="w-2.5 h-2.5 border-2 border-[var(--positive)] border-t-transparent rounded-full animate-spin shrink-0" />
                  ) : (
                    <Paperclip size={10} />
                  )}
                  <span>{docs.length} Doc{docs.length > 1 ? 's' : ''}</span>
                </button>
              ) : (
                <span className="text-[9px] font-medium px-1.5 py-0.5 rounded-[var(--radius-small)] bg-[var(--surface-secondary)] text-[var(--text-tertiary)] shrink-0">
                  No Doc
                </span>
              )}
            </div>
            <p className="text-xs text-[var(--text-tertiary)] mt-0.5 truncate">
              {policy.provider} {policy.policy_number ? `• Policy #${policy.policy_number}` : ''}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4 w-full sm:w-auto">
          <div className="text-left sm:text-right">
            <span className="text-[9px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider block sm:hidden">
              Sum Assured
            </span>
            <p className="text-sm font-bold text-[var(--text-primary)] tnum">{formatINR(policy.sum_assured)}</p>
            <p className="text-xs text-[var(--text-tertiary)] tnum">
              {policy.premium_amount && policy.premium_amount > 0 ? (
                `Prem: ${formatINR(policy.premium_amount)}/yr`
              ) : (
                <span className="italic opacity-70">Prem: —</span>
              )}
            </p>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => onOpenEdit(policy)}
              className="w-8 h-8 rounded-[var(--radius-small)] border border-[var(--border-subtle)] bg-[var(--surface)] hover:bg-[var(--surface-secondary)] flex items-center justify-center text-[var(--text-tertiary)] hover:text-[var(--negative)] hover:border-[var(--negative)] ios-press transition-colors"
              title="Edit policy & documents"
              aria-label={`Edit ${policy.policy_name}`}
            >
              <Edit2 size={13} />
            </button>
            <button
              type="button"
              onClick={() => onConfirmDelete(policy)}
              className="w-8 h-8 rounded-[var(--radius-small)] border border-[var(--border-subtle)] bg-[var(--surface)] hover:bg-[var(--negative-soft)] flex items-center justify-center text-[var(--text-tertiary)] hover:text-[var(--negative)] hover:border-[var(--negative)] ios-press transition-colors"
              title="Delete policy"
              aria-label={`Delete ${policy.policy_name}`}
            >
              <Trash2 size={13} />
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[var(--border-subtle)] text-xs">
        <div className="flex flex-wrap items-center gap-2">
          {policy.renewal_date && (
            <span className={`inline-flex items-center gap-1 font-medium mr-1 ${isExpiringSoon ? 'text-[var(--negative)] font-bold' : 'text-[var(--text-secondary)]'}`}>
              <Calendar size={12} />
              Renewal: {new Date(policy.renewal_date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
              {daysRemaining !== null && (isExpiringSoon || daysRemaining <= 60) && (
                <span className={`ml-1 text-[10px] px-1.5 py-0.5 rounded-[var(--radius-pill)] font-bold ${isOverdue ? 'bg-[var(--negative-soft)] text-[var(--negative)]' : 'bg-amber-100 dark:bg-amber-950/70 text-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-700'}`}>
                  {renewalStatus.statusText}
                </span>
              )}
            </span>
          )}
          {policy.renewal_date && (isExpiringSoon || (daysRemaining !== null && daysRemaining <= 60)) && (
            <button
              type="button"
              onClick={() => onOpenEdit(policy)}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[var(--radius-small)] bg-amber-600 hover:bg-amber-700 text-white font-bold text-[11px] shadow-xs cursor-pointer ios-press transition-colors"
              title="Pay or renew policy premium"
            >
              <span>Pay Premium</span>
            </button>
          )}
          {docs.map((doc) => (
            <button
              key={doc.id}
              type="button"
              onClick={() => handleOpenDocument(doc)}
              disabled={openingDocId === doc.id}
              className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[var(--radius-small)] bg-[var(--accent-blue-soft)] border border-[var(--accent-blue)]/30 text-[var(--accent-blue)] hover:underline font-medium text-[11px] max-w-[220px] truncate cursor-pointer ios-press disabled:opacity-50"
              title={`View ${doc.name}`}
              aria-label={`Open document: ${doc.name}`}
            >
              {openingDocId === doc.id ? (
                <span className="w-2.5 h-2.5 border-2 border-[var(--accent-blue)] border-t-transparent rounded-full animate-spin shrink-0" />
              ) : (
                <FileText size={11} className="shrink-0" />
              )}
              <span className="truncate">{doc.name}</span>
            </button>
          ))}
          {docs.length === 0 && (
            <button
              type="button"
              onClick={() => onOpenEdit(policy)}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-[var(--accent-blue)] hover:underline bg-[var(--accent-blue-soft)] px-2 py-0.5 rounded-[var(--radius-small)] border border-[var(--accent-blue)]/30 transition-colors cursor-pointer"
              title="Attach policy document"
            >
              <Paperclip size={11} />
              <span>+ Attach Doc</span>
            </button>
          )}
        </div>

        {policy.notes && (
          <button
            type="button"
            onClick={() => setShowNotes(!showNotes)}
            className="inline-flex items-center gap-1 text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-xs font-medium ml-auto"
          >
            <StickyNote size={12} />
            {showNotes ? 'Hide Notes' : 'View Notes'}
          </button>
        )}
      </div>

      {showNotes && policy.notes && (
        <p className="mt-2 p-2.5 bg-[var(--surface-secondary)] rounded-[var(--radius-medium)] text-xs text-[var(--text-secondary)] border border-[var(--border-subtle)]">
          {policy.notes}
        </p>
      )}
    </div>
  );
});

export default InsurancePolicyCard;
