import React from 'react';
import { RDAccount, DocumentMetadata, RDPayload } from '../../types/portfolio';
import { formatINR, getDocumentUrl } from '../../utils/formatters';
import { getRDInvestedAmount, getRDEffectiveValue } from '../../utils/rdUtils';
import { CheckCircle, FileText, Edit2, Trash2, Clock, StickyNote } from 'lucide-react';
import RDInstallmentSchedule from './RDInstallmentSchedule';

interface RDAccountCardProps {
  account: RDAccount;
  documents: DocumentMetadata[];
  onOpenEdit: (account: RDAccount) => void;
  onConfirmDelete: (account: RDAccount) => void;
  onUpdate: (id: string, payload: Partial<RDPayload>) => Promise<void>;
}

export function RDAccountCard({
  account,
  documents,
  onOpenEdit,
  onConfirmDelete,
  onUpdate,
}: RDAccountCardProps) {
  const isMatured = account.status === 'matured';
  const invested = getRDInvestedAmount(account);
  const currentVal = getRDEffectiveValue(account);
  const interestEarned = Math.max(0, currentVal - invested);

  const linkedDocs = documents.filter(
    (d) => d.asset_type === 'rd' && d.asset_id === account.id
  );

  return (
    <div className="py-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-all px-4 sm:px-6 rounded-2xl border border-transparent hover:border-slate-100 dark:hover:border-slate-700/50">
      <div className="flex items-start justify-between gap-4 flex-wrap sm:flex-nowrap">
        {/* Left Side: Meta & Dates */}
        <div className="space-y-1.5 flex-1 min-w-[200px]">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="w-2.5 h-2.5 rounded-full bg-pink-500 animate-pulse" aria-hidden="true" />
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">{account.bank_name}</h4>
            {isMatured ? (
              <span className="text-[10px] font-bold bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-500 px-2 py-0.5 rounded-full flex items-center gap-0.5">
                <CheckCircle size={10} /> Matured
              </span>
            ) : (
              <span className="text-[10px] font-bold bg-pink-50 text-pink-600 dark:bg-pink-950/20 dark:text-pink-400 px-2 py-0.5 rounded-full flex items-center gap-0.5">
                <Clock size={10} /> Active
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-3 text-xs text-slate-400 dark:text-slate-500 flex-wrap">
            <span>Started: <strong className="text-slate-500 dark:text-slate-400">{account.start_date}</strong></span>
            <span className="hidden sm:inline">&bull;</span>
            <span>Matures: <strong className="text-slate-500 dark:text-slate-400">{account.maturity_date}</strong></span>
          </div>

          {account.notes && (
            <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 bg-slate-50 dark:bg-slate-900/40 px-2.5 py-1 rounded-lg w-fit mt-1">
              <StickyNote size={11} className="text-slate-400" />
              {account.notes}
            </p>
          )}
        </div>

        {/* Center: Balances & Math */}
        <div className="flex items-center gap-6 sm:gap-10 text-right flex-wrap sm:flex-nowrap shrink-0">
          <div>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">Monthly Deposit</p>
            <p className="text-xs font-bold text-slate-700 dark:text-slate-300">{formatINR(account.monthly_deposit)}</p>
          </div>
          <div>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">Interest Rate</p>
            <p className="text-xs font-extrabold text-indigo-650 dark:text-indigo-400">+{account.interest_rate}% p.a.</p>
          </div>
          <div>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">Total Invested</p>
            <p className="text-xs font-bold text-slate-700 dark:text-slate-300">{formatINR(invested)}</p>
          </div>
          <div>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">Current Value</p>
            <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{formatINR(currentVal)}</p>
            {interestEarned > 0 && (
              <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                +{formatINR(interestEarned)} interest
              </p>
            )}
          </div>
        </div>

        {/* Right Side: Action Buttons & Attachments */}
        <div className="flex items-center gap-2 shrink-0">
          {linkedDocs.length > 0 && (
            <a
              href={getDocumentUrl(linkedDocs[0].file_path)}
              target="_blank"
              rel="noopener noreferrer"
              title={`View Attached Document: ${linkedDocs[0].name}`}
              className="w-8 h-8 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-center text-slate-400 dark:text-slate-500 transition-colors"
            >
              <FileText size={15} />
            </a>
          )}
          <button
            onClick={() => onOpenEdit(account)}
            className="w-8 h-8 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400 transition-colors hover:text-indigo-600"
            aria-label="Edit Recurring Deposit"
          >
            <Edit2 size={14} />
          </button>
          <button
            onClick={() => onConfirmDelete(account)}
            className="w-8 h-8 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20 flex items-center justify-center text-slate-400 dark:text-slate-500 transition-colors hover:text-red-600"
            aria-label="Delete Recurring Deposit"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Installment schedule for active RDs */}
      {!isMatured && (
        <div className="mt-3">
          <RDInstallmentSchedule account={account} onUpdate={onUpdate} />
        </div>
      )}
    </div>
  );
}

export default React.memo(RDAccountCard);
