import React from 'react';
import { RDAccount, DocumentMetadata, RDPayload } from '../../types/portfolio';
import { formatINR } from '../../utils/formatters';
import { useDocumentStorage } from '../../hooks/useDocumentStorage';
import { getRDInvestedAmount, getRDEffectiveValue } from '../../domains/assets/rd/calculations/rdCompounding';

import { CheckCircle, FileText, Edit2, Trash2, Clock, Share2 } from '../icons/AppIcons';
import RDInstallmentSchedule from './RDInstallmentSchedule';
import { useLongPress } from '../../hooks/useLongPress';
import { ContextMenu } from '../ui/ContextMenu';
import { useToastActions } from '../../contexts/ToastContext';

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
  const { openDocument: openSecureDocument } = useDocumentStorage();
  const { addToast } = useToastActions();
  const [contextMenu, setContextMenu] = React.useState<{ isOpen: boolean; x: number; y: number }>({
    isOpen: false,
    x: 0,
    y: 0,
  });

  const handleLongPress = (e: React.TouchEvent | React.MouseEvent) => {
    let clientX = 0;
    let clientY = 0;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    setContextMenu({ isOpen: true, x: clientX, y: clientY });
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }
  };

  const longPressProps = useLongPress({ onLongPress: handleLongPress, delay: 500 });

  const isMatured = account.status === 'matured';
  const invested = getRDInvestedAmount(account);
  const currentVal = getRDEffectiveValue(account);
  const interestEarned = Math.max(0, currentVal - invested);

  const linkedDocs = documents.filter(
    (d) => d.asset_type === 'rd' && d.asset_id === account.id
  );

  const startTs = Date.parse(account.start_date);
  const matTs = Date.parse(account.maturity_date);
  const now = Date.now();
  const totalDuration = !isNaN(startTs) && !isNaN(matTs) ? matTs - startTs : 0;
  const elapsed = totalDuration > 0 ? Math.max(0, Math.min(totalDuration, now - startTs)) : 0;
  const progressPct = totalDuration > 0 ? Math.round((elapsed / totalDuration) * 100) : 0;
  const daysRemaining = !isNaN(matTs) ? Math.ceil((matTs - now) / (1000 * 3600 * 24)) : null;

  return (
    <>
      <div 
        className="p-3.5 sm:p-4 hover:bg-[var(--surface-secondary)]/50 transition-colors select-none mobile-asset-card"
        {...longPressProps}
      >
        <div className="flex items-start justify-between gap-3 sm:gap-4 flex-wrap sm:flex-nowrap">
        {/* Left Side: Meta & Dates */}
        <div className="space-y-1.5 flex-1 min-w-[200px]">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`w-2 h-2 rounded-full ${isMatured ? 'bg-[var(--text-tertiary)]' : 'bg-[var(--positive)] animate-pulse'}`} aria-hidden="true" />
            <h4 className="text-sm font-bold text-[var(--text-primary)] truncate">{account.bank_name}</h4>
            {isMatured ? (
              <span className="text-[10px] font-bold bg-[var(--surface-secondary)] text-[var(--text-secondary)] px-2 py-0.5 rounded-[var(--radius-pill)] flex items-center gap-0.5 border border-[var(--border-subtle)]">
                <CheckCircle size={10} /> Matured
              </span>
            ) : (
              <span className="text-[10px] font-bold bg-[var(--positive-soft)] text-[var(--positive)] px-2 py-0.5 rounded-[var(--radius-pill)] flex items-center gap-0.5 border border-[var(--positive)]/30">
                <Clock size={10} /> Active
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-2.5 text-xs text-[var(--text-tertiary)] flex-wrap">
            <span>Started: <strong className="text-[var(--text-secondary)]">{account.start_date}</strong></span>
            <span className="hidden sm:inline">&bull;</span>
            <span>Matures: <strong className="text-[var(--text-secondary)]">{account.maturity_date}</strong></span>
            {!isMatured && daysRemaining !== null && (
              <>
                <span className="hidden sm:inline">&bull;</span>
                <span className="font-semibold text-[var(--accent-blue)]">
                  {daysRemaining <= 0 ? 'Matures today' : `${daysRemaining}d left`}
                </span>
              </>
            )}
          </div>

          {!isMatured && totalDuration > 0 && (
            <div className="pt-1 max-w-xs">
              <div className="flex justify-between items-center text-[10px] text-[var(--text-tertiary)] mb-1">
                <span>Tenure Progress</span>
                <span className="font-bold text-[var(--text-secondary)] tnum">{progressPct}%</span>
              </div>
              <div className="w-full bg-[var(--surface-secondary)] h-1.5 rounded-[var(--radius-pill)] overflow-hidden">
                <div 
                  className="bg-[var(--accent-blue)] h-full rounded-[var(--radius-pill)] transition-all duration-300"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Center: Balances & Math */}
        <div className="grid grid-cols-2 sm:flex sm:items-center gap-3 sm:gap-6 text-left sm:text-right w-full sm:w-auto mt-2 sm:mt-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-[var(--border-subtle)] shrink-0">
          <div>
            <p className="text-[10px] text-[var(--text-tertiary)] font-bold uppercase tracking-wider">Monthly</p>
            <p className="text-xs font-bold text-[var(--text-secondary)] tnum">{formatINR(account.monthly_deposit)}</p>
          </div>
          <div>
            <p className="text-[10px] text-[var(--text-tertiary)] font-bold uppercase tracking-wider">Rate</p>
            <p className="text-xs font-bold text-[var(--accent-blue)] tnum">+{account.interest_rate}% p.a.</p>
          </div>
          <div>
            <p className="text-[10px] text-[var(--text-tertiary)] font-bold uppercase tracking-wider">Invested</p>
            <p className="text-xs font-bold text-[var(--text-secondary)] tnum">{formatINR(invested)}</p>
          </div>
          <div>
            <p className="text-[10px] text-[var(--text-tertiary)] font-bold uppercase tracking-wider">Current Value</p>
            <p className="text-sm font-bold text-[var(--text-primary)] tnum">{formatINR(currentVal)}</p>
            {interestEarned > 0 && (
              <p className="text-[10px] font-semibold text-[var(--positive)] mt-0.5 tnum">
                +{formatINR(interestEarned)} interest
              </p>
            )}
          </div>
        </div>

        {/* Right Side: Action Buttons & Attachments */}
        <div className="flex items-center gap-1.5 shrink-0">
          {linkedDocs.length > 0 && (
            <button
              type="button"
              onClick={() => openSecureDocument(linkedDocs[0].file_path)}
              title={`View Attached Document: ${linkedDocs[0].name}`}
              aria-label={`Open document: ${linkedDocs[0].name}`}
              className="w-8 h-8 rounded-[var(--radius-small)] border border-[var(--border-subtle)] bg-[var(--surface)] hover:bg-[var(--surface-secondary)] flex items-center justify-center text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors ios-press cursor-pointer"
            >
              <FileText size={13} />
            </button>
          )}
          <button
            onClick={() => onOpenEdit(account)}
            className="w-8 h-8 rounded-[var(--radius-small)] border border-[var(--border-subtle)] bg-[var(--surface)] hover:bg-[var(--surface-secondary)] flex items-center justify-center text-[var(--text-tertiary)] hover:text-[var(--accent-blue)] transition-colors ios-press"
            aria-label="Edit Recurring Deposit"
          >
            <Edit2 size={13} />
          </button>
          <button
            onClick={() => onConfirmDelete(account)}
            className="w-8 h-8 rounded-[var(--radius-small)] border border-[var(--border-subtle)] bg-[var(--surface)] hover:bg-[var(--negative-soft)] flex items-center justify-center text-[var(--text-tertiary)] hover:text-[var(--negative)] transition-colors ios-press"
            aria-label="Delete Recurring Deposit"
          >
            <Trash2 size={13} />
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
      <ContextMenu
        isOpen={contextMenu.isOpen}
        position={{ x: contextMenu.x, y: contextMenu.y }}
        onClose={() => setContextMenu({ ...contextMenu, isOpen: false })}
        items={[
          {
            label: 'Edit Details',
            icon: <Edit2 size={16} />,
            onClick: () => onOpenEdit(account),
          },
          {
            label: 'Share Summary',
            icon: <Share2 size={16} />,
            onClick: () => {
              const summary = `Recurring Deposit at ${account.bank_name}\nMonthly: ${formatINR(account.monthly_deposit)}\nValue: ${formatINR(currentVal)}`;
              if (navigator.share) {
                navigator.share({ title: `RD Summary`, text: summary }).catch(console.error);
              } else {
                navigator.clipboard.writeText(summary);
                addToast('Summary copied to clipboard!', 'success');
              }
            },
          },
          {
            label: 'Delete Account',
            icon: <Trash2 size={16} />,
            onClick: () => onConfirmDelete(account),
            danger: true,
          },
        ]}
      />
    </>
  );
}

export default React.memo(
  RDAccountCard,
  (prev, next) =>
    prev.account.id === next.account.id &&
    prev.account.status === next.account.status &&
    prev.account.monthly_deposit === next.account.monthly_deposit &&
    prev.account.interest_rate === next.account.interest_rate &&
    prev.account.start_date === next.account.start_date &&
    prev.account.maturity_date === next.account.maturity_date &&
    prev.account.notes === next.account.notes &&
    (prev.account.contributions?.length ?? 0) === (next.account.contributions?.length ?? 0) &&
    prev.documents.length === next.documents.length
);
