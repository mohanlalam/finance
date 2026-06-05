import React from 'react';
import { FixedDeposit, DocumentMetadata } from '../../types/portfolio';
import { formatINR, getDocumentUrl, getFDEffectiveValue } from '../../utils/formatters';
import { CheckCircle, FileText, Edit2, Trash2, Clock, StickyNote } from 'lucide-react';

interface ModeConfig {
  title: string;
  principalLabel: string;
  themeColor: string;
  iconBg: string;
  iconClass: React.ElementType;
}

interface DepositDetailsCardProps {
  fd: FixedDeposit;
  cfg: ModeConfig;
  documents: DocumentMetadata[];
  onOpenEdit: (fd: FixedDeposit) => void;
  onConfirmDelete: (fd: FixedDeposit) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onUpdate: (assetType: string, id: string, payload: any) => Promise<void>;
}

export function DepositDetailsCard({
  fd,
  cfg,
  documents,
  onOpenEdit,
  onConfirmDelete,
}: DepositDetailsCardProps) {
  const IconComponent = cfg.iconClass;

  // Helper to compute progress bar percentage
  const getProgressPercent = (item: FixedDeposit) => {
    if (item.status === 'matured') return 100;
    if (!item.maturity_date) return 100;
    const start = new Date(item.start_date).getTime();
    const end = new Date(item.maturity_date).getTime();
    const now = Date.now();
    if (now >= end) return 100;
    if (now <= start) return 0;
    return ((now - start) / (end - start)) * 100;
  };

  const progress = getProgressPercent(fd);
  const fdDocs = documents.filter((d) => d.asset_type === 'fd' && d.asset_id === fd.id);
  const isMatured = fd.status === 'matured' || progress >= 100;

  return (
    <div className="p-6 hover:bg-slate-50/50 dark:hover:bg-slate-700/50 transition-colors" role="listitem">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isMatured ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400' : cfg.iconBg}`}>
            {isMatured ? <CheckCircle size={20} aria-hidden="true" /> : <IconComponent size={20} aria-hidden="true" />}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">{fd.bank_name}</h4>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isMatured ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'}`}>
                {isMatured ? 'Matured' : `${fd.interest_rate}% p.a.`}
              </span>
            </div>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
              {fd.start_date} &rarr; {fd.maturity_date || 'Ongoing'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 md:text-right">
          <div>
            <p className="text-xs text-slate-400 dark:text-slate-500">{cfg.principalLabel.replace(' (₹)', '')}</p>
            <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{formatINR(Number(fd.principal_amount))}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400 dark:text-slate-500">{fd.maturity_date ? 'Maturity Value' : 'Current Value'}</p>
            <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{formatINR(getFDEffectiveValue(fd))}</p>
          </div>
          <div className="col-span-2 sm:col-span-1 flex items-center justify-start md:justify-end gap-2">
            {fdDocs.map((doc) => (
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
              onClick={() => onOpenEdit(fd)}
              className="w-8 h-8 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 dark:text-slate-505 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-200 dark:hover:border-blue-800 transition-colors"
              title={`Edit ${cfg.title}`}
              aria-label={`Edit ${cfg.title} at ${fd.bank_name}`}
            >
              <Edit2 size={14} aria-hidden="true" />
            </button>
            <button
              onClick={() => onConfirmDelete(fd)}
              className="w-8 h-8 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 dark:text-slate-505 hover:text-red-500 dark:hover:text-red-400 hover:border-red-200 dark:hover:border-red-800 transition-colors"
              title={`Delete ${cfg.title}`}
              aria-label={`Delete ${cfg.title} at ${fd.bank_name}`}
            >
              <Trash2 size={14} aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>

      <div className="mt-4 space-y-4">
        <div>
          <div className="flex items-center justify-between text-[10px] text-slate-400 dark:text-slate-505 mb-1">
            <span className="flex items-center gap-1">
              <Clock size={10} aria-hidden="true" />
              Maturity Timeline
            </span>
            <span>{fd.maturity_date ? `${progress.toFixed(0)}% elapsed` : 'Ongoing accumulation'}</span>
          </div>
          {fd.maturity_date && (
            <div className="h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden" role="progressbar" aria-valuenow={Math.round(progress)} aria-valuemin={0} aria-valuemax={100} aria-label="Maturity timeline progress">
              <div
                className={`h-full rounded-full transition-all duration-300 ${isMatured ? 'bg-emerald-500' : 'bg-blue-500'}`}
                style={{ width: `${progress}%` }}
              />
            </div>
          )}
        </div>

        {fd.notes && (
          <p className="text-xs text-slate-400 dark:text-slate-500 flex items-start gap-1.5">
            <StickyNote size={11} className="shrink-0 mt-0.5" />
            <span className="italic">{fd.notes}</span>
          </p>
        )}
      </div>
    </div>
  );
}

export default React.memo(
  DepositDetailsCard,
  (prev, next) =>
    prev.fd.id === next.fd.id &&
    prev.fd.status === next.fd.status &&
    prev.fd.principal_amount === next.fd.principal_amount &&
    prev.fd.interest_rate === next.fd.interest_rate &&
    prev.fd.start_date === next.fd.start_date &&
    prev.fd.maturity_date === next.fd.maturity_date &&
    prev.fd.notes === next.fd.notes &&
    prev.documents.length === next.documents.length
);
