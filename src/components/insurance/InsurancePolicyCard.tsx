import React, { useState } from 'react';
import { Insurance, DocumentMetadata } from '../../types/portfolio';
import { formatINR } from '../../utils/formatters';
import { openSecureDocument } from '../../utils/supabaseStorage';
import { Edit2, Trash2, Shield, ShieldAlert, Calendar, FileText, StickyNote, Paperclip } from '../icons/AppIcons';

interface InsurancePolicyCardProps {
  policy: Insurance;
  documents: DocumentMetadata[];
  onOpenEdit: (policy: Insurance) => void;
  onConfirmDelete: (policy: Insurance) => void;
}

const TYPE_STYLES: Record<Insurance['insurance_type'], { bg: string; text: string; label: string }> = {
  health: { bg: 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300', text: 'text-blue-600', label: 'Health' },
  term: { bg: 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300', text: 'text-purple-600', label: 'Term Life' },
  life: { bg: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300', text: 'text-emerald-600', label: 'Life' },
  motor: { bg: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300', text: 'text-amber-600', label: 'Motor' },
  other: { bg: 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300', text: 'text-slate-600', label: 'General' },
};

export const InsurancePolicyCard = React.memo(function InsurancePolicyCard({
  policy,
  documents,
  onOpenEdit,
  onConfirmDelete,
}: InsurancePolicyCardProps) {
  const [showNotes, setShowNotes] = useState(false);

  const style = TYPE_STYLES[policy.insurance_type] || TYPE_STYLES.other;
  const docs = documents.filter((d) => d.asset_type === 'insurance' && d.asset_id === policy.id);

  // Expiry / Renewal alert logic (30 days threshold)
  let isExpiringSoon = false;
  let daysRemaining: number | null = null;
  if (policy.renewal_date) {
    const renewalTime = new Date(policy.renewal_date).getTime();
    const nowTime = new Date().getTime();
    daysRemaining = Math.ceil((renewalTime - nowTime) / (1000 * 60 * 60 * 24));
    isExpiringSoon = daysRemaining <= 30;
  }

  return (
    <div className="p-4 sm:p-5 hover:bg-[var(--surface-secondary)]/50 transition-colors mobile-asset-card">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-[var(--radius-medium)] flex items-center justify-center shrink-0 border border-[var(--border-subtle)] ${style.bg}`}>
            {isExpiringSoon ? <ShieldAlert size={18} className="text-[var(--negative)]" /> : <Shield size={18} className={style.text} />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-bold text-[var(--text-primary)] text-base">{policy.policy_name}</h4>
              <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-[var(--radius-pill)] ${style.bg}`}>
                {style.label}
              </span>
              {docs.length > 0 ? (
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-[var(--radius-small)] bg-[var(--positive-soft)] text-[var(--positive)] border border-[var(--positive)]/30 shrink-0">
                  📎 {docs.length} Doc{docs.length > 1 ? 's' : ''}
                </span>
              ) : (
                <span className="text-[9px] font-medium px-1.5 py-0.5 rounded-[var(--radius-small)] bg-[var(--surface-secondary)] text-[var(--text-tertiary)] shrink-0">
                  No Bond
                </span>
              )}
            </div>
            <p className="text-xs text-[var(--text-tertiary)] mt-0.5">
              {policy.provider} {policy.policy_number ? `• Policy #${policy.policy_number}` : ''}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4 w-full sm:w-auto">
          <div className="text-left sm:text-right">
            <span className="text-[9px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider block sm:hidden">
              Sum Assured
            </span>
            <p className="text-sm font-black text-[var(--text-primary)] text-financial tnum">{formatINR(policy.sum_assured)}</p>
            <p className="text-xs text-[var(--text-tertiary)] tnum">
              Prem: {formatINR(policy.premium_amount)}/yr
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onOpenEdit(policy)}
              className="w-11 h-11 sm:w-8 sm:h-8 min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 rounded-[var(--radius-small)] border border-[var(--border-subtle)] bg-[var(--surface)] hover:bg-[var(--surface-secondary)] flex items-center justify-center text-[var(--text-tertiary)] hover:text-[var(--negative)] hover:border-[var(--negative)] ios-press transition-colors"
              title="Edit policy & documents"
              aria-label={`Edit ${policy.policy_name}`}
            >
              <Edit2 size={13} />
            </button>
            <button
              type="button"
              onClick={() => onConfirmDelete(policy)}
              className="w-11 h-11 sm:w-8 sm:h-8 min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 rounded-[var(--radius-small)] border border-[var(--border-subtle)] bg-[var(--surface)] hover:bg-[var(--negative-soft)] flex items-center justify-center text-[var(--text-tertiary)] hover:text-[var(--negative)] hover:border-[var(--negative)] ios-press transition-colors"
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
              {daysRemaining !== null && daysRemaining <= 60 && (
                <span className={`ml-1 text-[10px] px-1.5 py-0.5 rounded-[var(--radius-pill)] ${daysRemaining <= 0 ? 'bg-[var(--negative-soft)] text-[var(--negative)]' : 'bg-[var(--warning-soft)] text-[var(--warning)]'}`}>
                  {daysRemaining <= 0 ? 'Expired' : `${daysRemaining}d left`}
                </span>
              )}
            </span>
          )}
          {docs.map((doc) => (
            <button
              key={doc.id}
              type="button"
              onClick={() => openSecureDocument(doc.file_path)}
              className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[var(--radius-small)] bg-[var(--negative-soft)] border border-[var(--negative)]/30 text-[var(--negative)] hover:underline font-medium text-[11px] max-w-[220px] truncate cursor-pointer ios-press"
              title={`View ${doc.name}`}
              aria-label={`Open document: ${doc.name}`}
            >
              <FileText size={11} className="shrink-0" />
              <span className="truncate">{doc.name}</span>
            </button>
          ))}
          {docs.length === 0 && (
            <button
              type="button"
              onClick={() => onOpenEdit(policy)}
              className="inline-flex items-center gap-1 text-[11px] text-[var(--text-tertiary)] hover:text-[var(--negative)] transition-colors"
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
