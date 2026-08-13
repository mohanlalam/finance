import React, { useState } from 'react';
import { Insurance, DocumentMetadata } from '../../types/portfolio';
import { formatINR, getDocumentUrl } from '../../utils/formatters';
import { Edit2, Trash2, Shield, ShieldAlert, Calendar, FileText, StickyNote } from '../icons/AppIcons';

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
    <div className="p-4 sm:p-5 hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition-colors">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border border-slate-200/50 dark:border-slate-700/50 ${style.bg}`}>
            {isExpiringSoon ? <ShieldAlert size={18} className="text-rose-500" /> : <Shield size={18} className={style.text} />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-bold text-slate-800 dark:text-slate-100 text-base">{policy.policy_name}</h4>
              <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md ${style.bg}`}>
                {style.label}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {policy.provider} {policy.policy_number ? `• Policy #${policy.policy_number}` : ''}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-4">
          <div className="text-right">
            <p className="text-sm font-bold text-slate-800 dark:text-slate-100 tnum">{formatINR(policy.sum_assured)}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 tnum">
              Prem: {formatINR(policy.premium_amount)}
            </p>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => onOpenEdit(policy)}
              className="w-8 h-8 rounded-[10px] border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
              title="Edit policy"
            >
              <Edit2 size={13} />
            </button>
            <button
              type="button"
              onClick={() => onConfirmDelete(policy)}
              className="w-8 h-8 rounded-[10px] border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 transition-colors"
              title="Delete policy"
            >
              <Trash2 size={13} />
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-700/60 text-xs">
        <div className="flex items-center gap-3">
          {policy.renewal_date && (
            <span className={`inline-flex items-center gap-1 font-medium ${isExpiringSoon ? 'text-rose-600 dark:text-rose-400 font-bold' : 'text-slate-500 dark:text-slate-400'}`}>
              <Calendar size={12} />
              Renewal: {new Date(policy.renewal_date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
              {daysRemaining !== null && daysRemaining <= 60 && (
                <span className={`ml-1 text-[10px] px-1.5 py-0.5 rounded-full ${daysRemaining <= 0 ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300' : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'}`}>
                  {daysRemaining <= 0 ? 'Expired' : `${daysRemaining}d left`}
                </span>
              )}
            </span>
          )}
          {docs.map((doc) => (
            <a
              key={doc.id}
              href={getDocumentUrl(doc.file_path)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-rose-600 dark:text-rose-400 hover:underline font-medium"
            >
              <FileText size={12} />
              {doc.name}
            </a>
          ))}
        </div>

        {policy.notes && (
          <button
            type="button"
            onClick={() => setShowNotes(!showNotes)}
            className="inline-flex items-center gap-1 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 text-xs font-medium ml-auto"
          >
            <StickyNote size={12} />
            {showNotes ? 'Hide Notes' : 'View Notes'}
          </button>
        )}
      </div>

      {showNotes && policy.notes && (
        <p className="mt-2 p-2.5 bg-slate-50 dark:bg-slate-900/60 rounded-xl text-xs text-slate-600 dark:text-slate-300 border border-slate-100 dark:border-slate-700/50">
          {policy.notes}
        </p>
      )}
    </div>
  );
});

export default InsurancePolicyCard;
