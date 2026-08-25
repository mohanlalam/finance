import React from 'react';
import { SIPAccount, DocumentMetadata } from '../../types/portfolio';
import { formatINR, getDocumentUrl, formatPercent } from '../../utils/formatters';
import { getSIPInvestedAmount, getSIPEffectiveValue } from '../../domains/assets/sip/calculations/sipValuation';

import { FileText, Edit2, Trash2, StickyNote, Wifi, Share2 } from '../icons/AppIcons';
import { useLongPress } from '../../hooks/useLongPress';
import { ContextMenu } from '../ui/ContextMenu';
import { useToastActions } from '../../contexts/ToastContext';

interface SIPAccountCardProps {
  account: SIPAccount;
  documents: DocumentMetadata[];
  onOpenEdit: (account: SIPAccount) => void;
  onConfirmDelete: (account: SIPAccount) => void;
}

export function SIPAccountCard({
  account,
  documents,
  onOpenEdit,
  onConfirmDelete,
}: SIPAccountCardProps) {
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

  const invested = getSIPInvestedAmount(account);
  const currentVal = getSIPEffectiveValue(account);
  const profitLoss = currentVal - invested;
  const plPercent = invested > 0 ? (profitLoss / invested) * 100 : 0;
  const isProfit = profitLoss >= 0;

  const linkedDocs = documents.filter(
    (d) => d.asset_type === 'sip' && d.asset_id === account.id
  );

  return (
    <>
      <div 
        className="py-4 hover:bg-[var(--surface-secondary)]/50 transition-all px-4 sm:px-6 rounded-[var(--radius-large)] border border-transparent hover:border-[var(--border-subtle)] select-none mobile-asset-card"
        {...longPressProps}
      >
        <div className="flex items-start justify-between gap-4 flex-wrap sm:flex-nowrap">
        {/* Left Side: Meta & Dates */}
        <div className="space-y-1.5 flex-1 min-w-[200px]">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="w-2.5 h-2.5 rounded-full bg-[var(--positive)] animate-pulse" aria-hidden="true" />
            <h4 className="text-sm font-bold text-[var(--text-primary)]">{account.fund_name}</h4>
            {account.mf_scheme_code ? (
              account.navIsStale ? (
                <span className="text-[10px] font-bold bg-[var(--warning-soft)] text-[var(--warning)] px-2 py-0.5 rounded-[var(--radius-pill)] flex items-center gap-0.5 border border-[var(--warning)]/30">
                  <Wifi size={10} className="text-[var(--warning)] animate-pulse" /> Stale (AMFI Offline)
                </span>
              ) : (
                <span className="text-[10px] font-bold bg-[var(--positive-soft)] text-[var(--positive)] px-2 py-0.5 rounded-[var(--radius-pill)] flex items-center gap-0.5 border border-[var(--positive)]/30">
                  <Wifi size={10} /> Live
                </span>
              )
            ) : (
              <span className="text-[10px] font-bold bg-[var(--surface-secondary)] text-[var(--text-tertiary)] px-2 py-0.5 rounded-[var(--radius-pill)] flex items-center gap-0.5 border border-[var(--border-subtle)]">
                Manual
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-3 text-xs text-[var(--text-tertiary)] flex-wrap">
            <span>Started: <strong className="text-[var(--text-secondary)]">{account.start_date}</strong></span>
            {account.next_sip_date && (
              <>
                <span className="hidden sm:inline">&bull;</span>
                <span>Next SIP: <strong className="text-[var(--text-secondary)]">{account.next_sip_date}</strong></span>
              </>
            )}
            {account.units > 0 && (
              <>
                <span className="hidden sm:inline">&bull;</span>
                <span>Units: <strong className="text-[var(--text-secondary)] tnum">{account.units.toFixed(3)}</strong></span>
              </>
            )}
          </div>

          {account.notes && (
            <p className="text-xs text-[var(--text-secondary)] flex items-center gap-1 bg-[var(--surface-secondary)] px-2.5 py-1 rounded-[var(--radius-small)] w-fit mt-1">
              <StickyNote size={11} className="text-[var(--text-tertiary)]" />
              {account.notes}
            </p>
          )}
        </div>

        {/* Center: Balances & CAGR */}
        <div className="flex items-center gap-6 sm:gap-8 text-right flex-wrap sm:flex-nowrap shrink-0">
          <div>
            <p className="text-[10px] text-[var(--text-tertiary)] font-bold uppercase tracking-wider">Monthly SIP</p>
            <p className="text-xs font-bold text-[var(--text-secondary)] tnum">{formatINR(account.monthly_sip)}</p>
          </div>
          <div>
            <p className="text-[10px] text-[var(--text-tertiary)] font-bold uppercase tracking-wider">Exp. CAGR / Return</p>
            <p className="text-xs font-extrabold text-[var(--accent-blue)] tnum">+{account.expected_cagr}%</p>
            {invested > 0 && (
              <p className={`text-[10px] font-bold tnum ${isProfit ? 'text-[var(--positive)]' : 'text-[var(--negative)]'}`}>
                {formatPercent(plPercent, 1)} act
              </p>
            )}
          </div>
          <div>
            <p className="text-[10px] text-[var(--text-tertiary)] font-bold uppercase tracking-wider">Est. Invested</p>
            <p className="text-xs font-bold text-[var(--text-secondary)] tnum">{formatINR(invested)}</p>
          </div>
          <div>
            <p className="text-[10px] text-[var(--text-tertiary)] font-bold uppercase tracking-wider">Current Value</p>
            <p className="text-sm font-bold text-[var(--text-primary)] tnum">{formatINR(currentVal)}</p>
            {invested > 0 && (
              <p className={`text-[10px] font-bold mt-0.5 tnum ${isProfit ? 'text-[var(--positive)]' : 'text-[var(--negative)]'}`}>
                {isProfit ? '+' : ''}{formatINR(profitLoss)}
              </p>
            )}
          </div>
        </div>

        {/* Right Side: Action Buttons & Attachments */}
        <div className="flex items-center gap-1.5 shrink-0">
          {linkedDocs.length > 0 && (
            <a
              href={getDocumentUrl(linkedDocs[0].file_path)}
              target="_blank"
              rel="noopener noreferrer"
              title={`View Attached Document: ${linkedDocs[0].name}`}
              className="w-11 h-11 sm:w-8 sm:h-8 min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 rounded-[var(--radius-small)] hover:bg-[var(--surface-secondary)] flex items-center justify-center text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors ios-press"
            >
              <FileText size={15} />
            </a>
          )}
          <button
            onClick={() => onOpenEdit(account)}
            className="w-11 h-11 sm:w-8 sm:h-8 min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 rounded-[var(--radius-small)] hover:bg-[var(--surface-secondary)] flex items-center justify-center text-[var(--text-tertiary)] hover:text-[var(--accent-blue)] transition-colors ios-press"
            aria-label="Edit SIP"
          >
            <Edit2 size={14} />
          </button>
          <button
            onClick={() => onConfirmDelete(account)}
            className="w-11 h-11 sm:w-8 sm:h-8 min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 rounded-[var(--radius-small)] hover:bg-[var(--negative-soft)] flex items-center justify-center text-[var(--text-tertiary)] hover:text-[var(--negative)] transition-colors ios-press"
            aria-label="Delete SIP"
          >
            <Trash2 size={14} />
          </button>
        </div>
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
            onClick: () => onOpenEdit(account),
          },
          {
            label: 'Share Summary',
            icon: <Share2 size={16} />,
            onClick: () => {
              const summary = `SIP in ${account.fund_name}\nMonthly: ${formatINR(account.monthly_sip)}\nValue: ${formatINR(currentVal)}`;
              if (navigator.share) {
                navigator.share({ title: `SIP Summary`, text: summary }).catch(console.error);
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
  SIPAccountCard,
  (prev, next) =>
    prev.account.id === next.account.id &&
    prev.account.monthly_sip === next.account.monthly_sip &&
    prev.account.expected_cagr === next.account.expected_cagr &&
    prev.account.units === next.account.units &&
    prev.account.start_date === next.account.start_date &&
    prev.account.next_sip_date === next.account.next_sip_date &&
    prev.account.fallback_valuation === next.account.fallback_valuation &&
    prev.account.navIsStale === next.account.navIsStale &&
    prev.account.notes === next.account.notes &&
    prev.documents.length === next.documents.length
);
