import React, { useState } from 'react';
import { GoldHolding, DocumentMetadata } from '../../types/portfolio';
import { formatINR, formatPercent, pnlColor, getDocumentUrl } from '../../utils/formatters';
import { Edit2, Trash2, Scale, Coins, FileText, StickyNote, Paperclip } from '../icons/AppIcons';

interface GoldHoldingCardProps {
  holding: GoldHolding;
  documents: DocumentMetadata[];
  onOpenEdit: (holding: GoldHolding) => void;
  onConfirmDelete: (holding: GoldHolding) => void;
}

export const GoldHoldingCard = React.memo(function GoldHoldingCard({
  holding,
  documents,
  onOpenEdit,
  onConfirmDelete,
}: GoldHoldingCardProps) {
  const [showNotes, setShowNotes] = useState(false);

  const purchasePrice = holding.purchase_price || 0;
  const currentValuation = holding.current_valuation || 0;
  const pnl = currentValuation - purchasePrice;
  const pnlPct = purchasePrice > 0 ? (pnl / purchasePrice) * 100 : 0;
  const docs = documents.filter((d) => d.asset_type === 'gold' && d.asset_id === holding.id);

  return (
    <div className="p-4 sm:p-5 hover:bg-[var(--surface-secondary)]/50 transition-colors">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-[var(--radius-medium)] bg-[var(--warning-soft)] border border-[var(--warning)]/30 flex items-center justify-center text-[var(--warning)] shrink-0">
            <Coins size={18} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-bold text-[var(--text-primary)] text-base">{holding.item_name}</h4>
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-[var(--radius-pill)] bg-[var(--warning-soft)] text-[var(--warning)]">
                {holding.purity}
              </span>
              {holding.isLiveValuation && (
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-[var(--radius-small)] bg-[var(--warning-soft)] text-[var(--warning)] border border-[var(--warning)]/30 shrink-0">
                  MCX Live
                </span>
              )}
              {docs.length > 0 ? (
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-[var(--radius-small)] bg-[var(--positive-soft)] text-[var(--positive)] border border-[var(--positive)]/30 shrink-0">
                  📎 {docs.length} Doc{docs.length > 1 ? 's' : ''}
                </span>
              ) : (
                <span className="text-[9px] font-medium px-1.5 py-0.5 rounded-[var(--radius-small)] bg-[var(--surface-secondary)] text-[var(--text-tertiary)] shrink-0">
                  No Bill
                </span>
              )}
            </div>
            <p className="text-xs text-[var(--text-tertiary)] flex items-center gap-1 mt-0.5">
              <Scale size={12} className="text-[var(--text-tertiary)]" />
              {holding.weight_grams} grams
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-4">
          <div className="text-right">
            <p className="text-sm font-bold text-[var(--text-primary)] tnum">{formatINR(currentValuation)}</p>
            <p className={`text-xs font-semibold tnum ${pnlColor(pnl)}`}>
              {pnl >= 0 ? '+' : ''}{formatINR(pnl)} ({formatPercent(pnlPct)})
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onOpenEdit(holding)}
              className="w-11 h-11 sm:w-8 sm:h-8 min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 rounded-[var(--radius-small)] border border-[var(--border-subtle)] bg-[var(--surface)] hover:bg-[var(--surface-secondary)] flex items-center justify-center text-[var(--text-tertiary)] hover:text-[var(--warning)] hover:border-[var(--warning)] ios-press transition-colors"
              title="Edit holding & documents"
              aria-label={`Edit ${holding.item_name}`}
            >
              <Edit2 size={13} />
            </button>
            <button
              type="button"
              onClick={() => onConfirmDelete(holding)}
              className="w-11 h-11 sm:w-8 sm:h-8 min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 rounded-[var(--radius-small)] border border-[var(--border-subtle)] bg-[var(--surface)] hover:bg-[var(--negative-soft)] flex items-center justify-center text-[var(--text-tertiary)] hover:text-[var(--negative)] hover:border-[var(--negative)] ios-press transition-colors"
              title="Delete holding"
              aria-label={`Delete ${holding.item_name}`}
            >
              <Trash2 size={13} />
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[var(--border-subtle)] text-xs">
        {docs.map((doc) => (
          <a
            key={doc.id}
            href={getDocumentUrl(doc.file_path)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[var(--radius-small)] bg-[var(--warning-soft)] border border-[var(--warning)]/30 text-[var(--warning)] hover:underline font-medium text-[11px] max-w-[220px] truncate"
            title={`View ${doc.name}`}
          >
            <FileText size={11} className="shrink-0" />
            <span className="truncate">{doc.name}</span>
          </a>
        ))}
        {docs.length === 0 && (
          <button
            type="button"
            onClick={() => onOpenEdit(holding)}
            className="inline-flex items-center gap-1 text-[11px] text-[var(--text-tertiary)] hover:text-[var(--warning)] transition-colors"
            title="Attach supporting document"
          >
            <Paperclip size={11} />
            <span>+ Attach Doc</span>
          </button>
        )}
        {holding.notes && (
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

      {showNotes && holding.notes && (
        <p className="mt-2 p-2.5 bg-[var(--surface-secondary)] rounded-[var(--radius-medium)] text-xs text-[var(--text-secondary)] border border-[var(--border-subtle)]">
          {holding.notes}
        </p>
      )}
    </div>
  );
});

export default GoldHoldingCard;
