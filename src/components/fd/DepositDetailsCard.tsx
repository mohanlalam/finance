import React from 'react';
import { FixedDeposit, DocumentMetadata } from '../../types/portfolio';
import { formatINR, getDocumentUrl, getFDEffectiveValue } from '../../utils/formatters';
import { CheckCircle, FileText, Edit2, Trash2, Clock, StickyNote, Share2 } from '../icons/AppIcons';
import { useLongPress } from '../../hooks/useLongPress';
import { useToastActions } from '../../contexts/ToastContext';
import { ContextMenu } from '../ui/ContextMenu';

interface ModeConfig {
  title: string;
  principalLabel: string;
  themeColor: string;
  iconBg: string;
  iconClass: React.ElementType;
}

interface DepositDetailsCardProps {
  fd?: FixedDeposit;
  deposit?: FixedDeposit;
  cfg?: ModeConfig;
  documents: DocumentMetadata[];
  onOpenEdit: (fd: FixedDeposit) => void;
  onConfirmDelete: (fd: FixedDeposit) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onUpdate?: (assetType: string, id: string, payload: any) => Promise<void>;
}

export function DepositDetailsCard({
  fd: itemFd,
  deposit: itemDeposit,
  cfg = { title: 'Fixed Deposit', principalLabel: 'Principal', themeColor: 'text-amber-600', iconBg: 'bg-amber-500/10 text-amber-600', iconClass: CheckCircle },
  documents,
  onOpenEdit,
  onConfirmDelete,
}: DepositDetailsCardProps) {
  const fd = itemFd || itemDeposit!;
  const { addToast } = useToastActions();
  const IconComponent = cfg.iconClass;
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
    // Vibrate if supported
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }
  };

  const longPressProps = useLongPress({ onLongPress: handleLongPress, delay: 500 });

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
    <>
      <div 
        className="p-4 sm:p-6 hover:bg-[var(--surface-secondary)]/50 transition-colors select-none mobile-asset-card" 
        role="listitem"
        {...longPressProps}
      >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3 min-w-0">
          <div className={`w-10 h-10 rounded-[var(--radius-medium)] flex items-center justify-center shrink-0 ${isMatured ? 'bg-[var(--positive-soft)] text-[var(--positive)]' : 'bg-[var(--accent-blue-soft)] text-[var(--accent-blue)]'}`}>
            {isMatured ? <CheckCircle size={20} aria-hidden="true" /> : <IconComponent size={20} aria-hidden="true" />}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="text-sm font-bold text-[var(--text-primary)] truncate">{fd.bank_name}</h4>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-[var(--radius-pill)] shrink-0 ${isMatured ? 'bg-[var(--positive-soft)] text-[var(--positive)]' : 'bg-[var(--accent-blue-soft)] text-[var(--accent-blue)]'}`}>
                {isMatured ? 'Matured' : `${fd.interest_rate}% p.a.`}
              </span>
              {fdDocs.length > 0 ? (
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-[var(--radius-small)] bg-[var(--positive-soft)] text-[var(--positive)] border border-[var(--positive)]/30 shrink-0">
                  📎 {fdDocs.length} Doc{fdDocs.length > 1 ? 's' : ''}
                </span>
              ) : (
                <span className="text-[9px] font-medium px-1.5 py-0.5 rounded-[var(--radius-small)] bg-[var(--surface-secondary)] text-[var(--text-tertiary)] shrink-0">
                  No Doc
                </span>
              )}
            </div>
            <p className="text-xs text-[var(--text-tertiary)] mt-0.5 truncate">
              {fd.start_date} &rarr; {fd.maturity_date || 'Ongoing'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-6 md:text-right">
          <div className="min-w-0">
            <p className="text-xs text-[var(--text-tertiary)] truncate">{cfg.principalLabel.replace(' (₹)', '')}</p>
            <p className="text-sm font-bold text-[var(--text-primary)] truncate tnum">{formatINR(Number(fd.principal_amount))}</p>
          </div>
          <div className="min-w-0">
            <p className="text-xs text-[var(--text-tertiary)] truncate">{fd.maturity_date ? 'Maturity Value' : 'Current Value'}</p>
            <p className="text-sm font-bold text-[var(--text-primary)] truncate tnum">{formatINR(getFDEffectiveValue(fd))}</p>
          </div>
          <div className="col-span-2 sm:col-span-1 flex items-center justify-start md:justify-end gap-2">
            {fdDocs.map((doc) => (
              <a
                key={doc.id}
                href={getDocumentUrl(doc.file_path)}
                target="_blank"
                rel="noopener noreferrer"
                className="w-11 h-11 sm:w-8 sm:h-8 min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 rounded-[var(--radius-small)] border border-[var(--border-subtle)] bg-[var(--surface)] hover:bg-[var(--surface-secondary)] flex items-center justify-center text-[var(--text-tertiary)] hover:text-[var(--accent-blue)] hover:border-[var(--accent-blue)] ios-press transition-colors"
                title={doc.name}
                aria-label={`Open document: ${doc.name}`}
              >
                <FileText size={14} aria-hidden="true" />
              </a>
            ))}
            <button
              onClick={() => onOpenEdit(fd)}
              className="w-11 h-11 sm:w-8 sm:h-8 min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 rounded-[var(--radius-small)] border border-[var(--border-subtle)] bg-[var(--surface)] hover:bg-[var(--surface-secondary)] flex items-center justify-center text-[var(--text-tertiary)] hover:text-[var(--accent-blue)] hover:border-[var(--accent-blue)] ios-press transition-colors"
              title={`Edit ${cfg.title}`}
              aria-label={`Edit ${cfg.title} at ${fd.bank_name}`}
            >
              <Edit2 size={14} aria-hidden="true" />
            </button>
            <button
              onClick={() => onConfirmDelete(fd)}
              className="w-11 h-11 sm:w-8 sm:h-8 min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 rounded-[var(--radius-small)] border border-[var(--border-subtle)] bg-[var(--surface)] hover:bg-[var(--negative-soft)] flex items-center justify-center text-[var(--text-tertiary)] hover:text-[var(--negative)] hover:border-[var(--negative)] ios-press transition-colors"
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
          <div className="flex items-center justify-between text-[10px] text-[var(--text-tertiary)] mb-1">
            <span className="flex items-center gap-1">
              <Clock size={10} aria-hidden="true" />
              Maturity Timeline
            </span>
            <span>{fd.maturity_date ? `${progress.toFixed(0)}% elapsed` : 'Ongoing accumulation'}</span>
          </div>
          {fd.maturity_date && (
            <div className="h-1.5 bg-[var(--surface-secondary)] rounded-full overflow-hidden" role="progressbar" aria-valuenow={Math.round(progress)} aria-valuemin={0} aria-valuemax={100} aria-label="Maturity timeline progress">
              <div
                className={`h-full rounded-full transition-all duration-300 ${isMatured ? 'bg-[var(--positive)]' : 'bg-[var(--accent-blue)]'}`}
                style={{ width: `${progress}%` }}
              />
            </div>
          )}
        </div>

        {fd.notes && (
          <p className="text-xs text-[var(--text-tertiary)] flex items-start gap-1.5">
            <StickyNote size={11} className="shrink-0 mt-0.5" />
            <span className="italic">{fd.notes}</span>
          </p>
        )}
      </div>
      </div>
      <ContextMenu
        isOpen={contextMenu.isOpen}
        position={{ x: contextMenu.x, y: contextMenu.y }}
        onClose={() => setContextMenu({ ...contextMenu, isOpen: false })}
        items={[
          {
            label: 'Edit Details',
            icon: <Edit2 size={16} />,
            onClick: () => onOpenEdit(fd),
          },
          {
            label: 'Share Summary',
            icon: <Share2 size={16} />,
            onClick: () => {
              const summary = `${cfg.title} at ${fd.bank_name}\nPrincipal: ${formatINR(Number(fd.principal_amount))}\nMaturity: ${fd.maturity_date || 'Ongoing'}`;
              if (navigator.share) {
                navigator.share({ title: `${cfg.title} Summary`, text: summary }).catch(console.error);
              } else {
                navigator.clipboard.writeText(summary);
                addToast('Summary copied to clipboard!', 'success');
              }
            },
          },
          {
            label: 'Delete Account',
            icon: <Trash2 size={16} />,
            onClick: () => onConfirmDelete(fd),
            danger: true,
          },
        ]}
      />
    </>
  );
}

export default React.memo(
  DepositDetailsCard,
  (prev, next) => {
    const pf = prev.fd || prev.deposit;
    const nf = next.fd || next.deposit;
    if (!pf || !nf) return false;
    return (
      pf.id === nf.id &&
      pf.status === nf.status &&
      pf.principal_amount === nf.principal_amount &&
      pf.interest_rate === nf.interest_rate &&
      pf.start_date === nf.start_date &&
      pf.maturity_date === nf.maturity_date &&
      pf.notes === nf.notes &&
      prev.documents?.length === next.documents?.length
    );
  }
);
