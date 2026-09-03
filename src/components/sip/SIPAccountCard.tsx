import React from 'react';
import { SIPAccount, DocumentMetadata } from '../../types/portfolio';
import { formatINR, formatPercent } from '../../utils/formatters';
import { openSecureDocument } from '../../utils/supabaseStorage';
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
        className="p-3.5 sm:p-4 hover:bg-[var(--surface-secondary)]/50 transition-colors select-none mobile-asset-card"
        {...longPressProps}
      >
        <div className="flex items-start justify-between gap-3 sm:gap-4 flex-wrap sm:flex-nowrap">
        {/* Left Side: Meta & Dates */}
        <div className="space-y-1.5 flex-1 min-w-[200px]">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="w-2 h-2 rounded-full bg-[var(--positive)] animate-pulse" aria-hidden="true" />
            <h4 className="text-sm font-bold text-[var(--text-primary)] truncate">{account.fund_name}</h4>
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
          
          <div className="flex items-center gap-2.5 text-xs text-[var(--text-tertiary)] flex-wrap">
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
        <div className="grid grid-cols-2 sm:flex sm:items-center gap-3 sm:gap-6 text-left sm:text-right w-full sm:w-auto mt-2 sm:mt-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-[var(--border-subtle)] shrink-0">
          <div>
            <p className="text-[10px] text-[var(--text-tertiary)] font-bold uppercase tracking-wider">Monthly SIP</p>
            <p className="text-xs font-bold text-[var(--text-secondary)] tnum">{formatINR(account.monthly_sip)}</p>
          </div>
          <div>
            <p className="text-[10px] text-[var(--text-tertiary)] font-bold uppercase tracking-wider">Exp. CAGR</p>
            <p className="text-xs font-bold text-[var(--accent-blue)] tnum">+{account.expected_cagr}%</p>
            {invested > 0 && (
              <p className={`text-[10px] font-semibold tnum ${isProfit ? 'text-[var(--positive)]' : 'text-[var(--negative)]'}`}>
                {isProfit ? '+' : ''}{formatPercent(plPercent, 1)}
              </p>
            )}
          </div>
          <div>
            <p className="text-[10px] text-[var(--text-tertiary)] font-bold uppercase tracking-wider">Invested</p>
            <p className="text-xs font-bold text-[var(--text-secondary)] tnum">{formatINR(invested)}</p>
          </div>
          <div>
            <p className="text-[10px] text-[var(--text-tertiary)] font-bold uppercase tracking-wider">Current Value</p>
            <p className="text-sm font-bold text-[var(--text-primary)] tnum">{formatINR(currentVal)}</p>
            {invested > 0 && (
              <p className={`text-[10px] font-semibold mt-0.5 tnum ${isProfit ? 'text-[var(--positive)]' : 'text-[var(--negative)]'}`}>
                {isProfit ? '+' : ''}{formatINR(profitLoss)}
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
            aria-label="Edit SIP"
          >
            <Edit2 size={13} />
          </button>
          <button
            onClick={() => onConfirmDelete(account)}
            className="w-8 h-8 rounded-[var(--radius-small)] border border-[var(--border-subtle)] bg-[var(--surface)] hover:bg-[var(--negative-soft)] flex items-center justify-center text-[var(--text-tertiary)] hover:text-[var(--negative)] transition-colors ios-press"
            aria-label="Delete SIP"
          >
            <Trash2 size={13} />
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
