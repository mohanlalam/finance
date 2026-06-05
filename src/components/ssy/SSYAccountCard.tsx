import React from 'react';
import { SSYAccount, DocumentMetadata, SSYPayload } from '../../types/portfolio';
import { formatINR, getDocumentUrl } from '../../utils/formatters';
import { getSSYEffectiveValue } from '../../utils/ssyUtils';
import { CheckCircle, FileText, Edit2, Trash2, Clock, AlertCircle, StickyNote, Heart } from 'lucide-react';
import SSYSchedule from './SSYSchedule';

interface SSYAccountCardProps {
  account: SSYAccount;
  documents: DocumentMetadata[];
  onOpenEdit: (account: SSYAccount) => void;
  onConfirmDelete: (account: SSYAccount) => void;
  onUpdate: (id: string, payload: Partial<SSYPayload>) => Promise<void>;
}

function calculateCurrentAge(dobString: string): number {
  const dob = new Date(dobString);
  const today = new Date();
  if (isNaN(dob.getTime())) return 0;
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
    age--;
  }
  return age;
}

export function SSYAccountCard({
  account,
  documents,
  onOpenEdit,
  onConfirmDelete,
  onUpdate,
}: SSYAccountCardProps) {
  // Helper to compute progress bar percentage (21 years maturity)
  const getProgressPercent = (item: SSYAccount) => {
    if (item.status === 'matured') return 100;
    if (!item.maturity_date) return 100;
    const start = new Date(item.start_date).getTime();
    const end = new Date(item.maturity_date).getTime();
    const now = Date.now();
    if (now >= end) return 100;
    if (now <= start) return 0;
    return ((now - start) / (end - start)) * 100;
  };

  const progress = getProgressPercent(account);
  // Match documents for ssy_account or ssy
  const ssyDocs = documents.filter(
    (d) => (d.asset_type === 'ssy') && d.asset_id === account.id
  );
  const isMatured = account.status === 'matured' || progress >= 100;

  return (
    <div className="glass-panel border border-slate-200/50 dark:border-slate-800/40 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300" role="listitem">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
              isMatured
                ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400'
                : 'bg-pink-50 dark:bg-pink-950/20 text-pink-600 dark:text-pink-400'
            }`}
          >
            {isMatured ? <CheckCircle size={20} aria-hidden="true" /> : <Heart size={20} aria-hidden="true" />}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">{account.bank_name}</h4>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  isMatured
                    ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                    : 'bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-400'
                }`}
              >
                {isMatured ? 'Matured' : `${account.interest_rate}% p.a.`}
              </span>
            </div>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
              {account.start_date} &rarr; {account.maturity_date || 'Ongoing'}
            </p>
            {account.girl_dob && (
              <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 mt-1 flex items-center gap-1">
                <span>
                  Girl Child DOB: {account.girl_dob} (Current Age: {calculateCurrentAge(account.girl_dob)} years)
                </span>
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 md:text-right">
          <div>
            <p className="text-xs text-slate-400 dark:text-slate-500">Target Annual Deposit</p>
            <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
              {formatINR(Number(account.annual_deposit))}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-400 dark:text-slate-500">Current Valuation</p>
            <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
              {formatINR(getSSYEffectiveValue(account))}
            </p>
          </div>
          <div className="col-span-2 sm:col-span-1 flex items-center justify-start md:justify-end gap-2">
            {ssyDocs.map((doc) => (
              <a
                key={doc.id}
                href={getDocumentUrl(doc.file_path)}
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-200 dark:hover:border-indigo-800 transition-colors"
                title={doc.name}
                aria-label={`Open document: ${doc.name}`}
              >
                <FileText size={14} aria-hidden="true" />
              </a>
            ))}
            <button
              onClick={() => onOpenEdit(account)}
              className="w-8 h-8 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-200 dark:hover:border-blue-800 transition-colors"
              title="Edit SSY Account"
              aria-label={`Edit SSY Account at ${account.bank_name}`}
            >
              <Edit2 size={14} aria-hidden="true" />
            </button>
            <button
              onClick={() => onConfirmDelete(account)}
              className="w-8 h-8 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 hover:border-red-200 dark:hover:border-red-800 transition-colors"
              title="Delete SSY Account"
              aria-label={`Delete SSY Account at ${account.bank_name}`}
            >
              <Trash2 size={14} aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>

      {/* Progress Bar / Ledger Schedule */}
      <div className="mt-4 space-y-4">
        <div>
          <div className="flex items-center justify-between text-[10px] text-slate-400 dark:text-slate-500 mb-1">
            <span className="flex items-center gap-1">
              <Clock size={10} aria-hidden="true" />
              Maturity Timeline (21 Years)
            </span>
            <span>{account.maturity_date ? `${progress.toFixed(0)}% elapsed` : 'Ongoing accumulation'}</span>
          </div>
          {account.maturity_date && (
            <div
              className="h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden"
              role="progressbar"
              aria-valuenow={Math.round(progress)}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Maturity timeline progress"
            >
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  isMatured ? 'bg-emerald-500' : 'bg-pink-500'
                }`}
                style={{ width: `${progress}%` }}
              />
            </div>
          )}
        </div>

        {(Number(account.annual_deposit) < 250 || Number(account.annual_deposit) > 150000) && (
          <div className="bg-amber-50/50 dark:bg-amber-950/20 border border-amber-250/50 dark:border-amber-900/30 text-amber-800 dark:text-amber-400 rounded-xl p-3 text-[11px] flex items-start gap-2">
            <AlertCircle size={14} className="mt-0.5 shrink-0" />
            <span>
              SSY guidelines: Annual deposits must be between ₹250 and ₹1,50,000 per financial year. Adjust this
              account's annual contribution to conform.
            </span>
          </div>
        )}

        <SSYSchedule account={account} onUpdate={onUpdate} />

        {account.notes && (
          <p className="text-xs text-slate-400 dark:text-slate-500 flex items-start gap-1.5">
            <StickyNote size={11} className="shrink-0 mt-0.5" />
            <span className="italic">{account.notes}</span>
          </p>
        )}
      </div>
    </div>
  );
}

export default React.memo(SSYAccountCard);
