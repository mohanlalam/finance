import React, { useState } from 'react';
import { GoldHolding, DocumentMetadata } from '../../types/portfolio';
import { formatINR, formatPercent, pnlColor } from '../../utils/formatters';
import { useDocumentStorage } from '../../hooks/useDocumentStorage';
import { useToastActions } from '../../contexts/ToastContext';
import { deriveGoldRates, calculateGoldValuation, getPurityMultiplier } from '../../utils/goldPricing';
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
  const { openDocument: openSecureDocument } = useDocumentStorage();
  const { addToast } = useToastActions();
  const [showNotes, setShowNotes] = useState(false);
  const [openingDocId, setOpeningDocId] = useState<string | null>(null);

  const weight = Number(holding.weight_grams) || 0;
  const rates = deriveGoldRates();
  const purityMultiplier = getPurityMultiplier(holding.purity);
  const liveRatePerGram = Math.round(rates.rate24kPerGram * purityMultiplier);

  // Compute live market valuation from spot bullion rate
  const liveValuation = weight > 0 ? calculateGoldValuation(weight, holding.purity, rates.rate24kPerGram) : 0;

  // Auto-heal corrupted database valuations (e.g. ghost ₹806 / ₹15/g when actual value is ~₹7.86 Lakhs)
  const rawValuation = Number(holding.current_valuation) || 0;
  const isCorruptValuation = weight > 0 && rawValuation > 0 && (rawValuation / weight) < 2000;
  const currentValuation = (isCorruptValuation || rawValuation <= 0) ? liveValuation : rawValuation;

  const purchasePrice = holding.purchase_price || 0;
  const pnl = currentValuation - purchasePrice;
  const pnlPct = purchasePrice > 0 ? (pnl / purchasePrice) * 100 : 0;
  const docs = documents.filter((d) => d.asset_type === 'gold' && d.asset_id === holding.id);

  const buyPricePerGram = weight > 0 && purchasePrice > 0 ? Math.round(purchasePrice / weight) : null;
  const curPricePerGram = liveRatePerGram > 0 ? liveRatePerGram : (weight > 0 && currentValuation > 0 ? Math.round(currentValuation / weight) : null);

  const handleOpenDocument = async (doc: DocumentMetadata) => {
    if (openingDocId) return;
    setOpeningDocId(doc.id);
    try {
      await openSecureDocument(doc.file_path);
    } catch (err) {
      console.error('Failed to open document:', err);
      const msg = err instanceof Error ? err.message : 'Failed to open document';
      addToast(`Could not open document: ${msg}`, 'error');
    } finally {
      setOpeningDocId(null);
    }
  };

  return (
    <div className="p-3.5 sm:p-4 bg-[var(--surface-gold-soft)] dark:bg-transparent hover:bg-amber-100/50 dark:hover:bg-[var(--surface-secondary)]/50 transition-colors mobile-asset-card">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2.5">
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <div className="w-8 h-8 rounded-[var(--radius-small)] bg-[var(--warning-soft)] border border-[var(--warning)]/30 flex items-center justify-center text-[var(--warning)] shrink-0">
            <Coins size={16} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="font-bold text-[var(--text-primary)] text-sm truncate">{holding.item_name}</h4>
              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-[var(--radius-pill)] bg-[var(--warning-soft)] text-[var(--warning)] shrink-0">
                {holding.purity}
              </span>
              {docs.length > 0 ? (
                <button
                  type="button"
                  onClick={() => handleOpenDocument(docs[0])}
                  disabled={!!openingDocId}
                  className="text-[9px] font-bold px-1.5 py-0.5 rounded-[var(--radius-small)] bg-[var(--positive-soft)] text-[var(--positive)] border border-[var(--positive)]/30 shrink-0 hover:bg-[var(--positive)]/20 transition-colors cursor-pointer flex items-center gap-1 disabled:opacity-50"
                  title={docs.length === 1 ? `Open document: ${docs[0].name}` : `Open document: ${docs[0].name} (${docs.length} attached)`}
                  aria-label={docs.length === 1 ? `Open document: ${docs[0].name}` : `Open document: ${docs[0].name} (${docs.length} attached)`}
                >
                  {openingDocId && docs.some((d) => d.id === openingDocId) ? (
                    <span className="w-2.5 h-2.5 border-2 border-[var(--positive)] border-t-transparent rounded-full animate-spin shrink-0" />
                  ) : (
                    <Paperclip size={10} />
                  )}
                  <span>{docs.length} Doc{docs.length > 1 ? 's' : ''}</span>
                </button>
              ) : (
                <span className="text-[9px] font-medium px-1.5 py-0.5 rounded-[var(--radius-small)] bg-[var(--surface-secondary)] text-[var(--text-tertiary)] shrink-0">
                  No Bill
                </span>
              )}
            </div>
            <p className="text-xs text-[var(--text-tertiary)] flex items-center gap-1.5 mt-0.5 tnum truncate">
              <Scale size={11} className="text-[var(--text-tertiary)] shrink-0" />
              <span>{holding.weight_grams}g</span>
              {buyPricePerGram && (
                <>
                  <span className="text-[var(--border-subtle)]">•</span>
                  <span>Buy: {formatINR(buyPricePerGram)}/g</span>
                </>
              )}
              {curPricePerGram && (
                <>
                  <span className="text-[var(--border-subtle)]">•</span>
                  <span className="text-amber-600 dark:text-amber-400 font-semibold">Live: {formatINR(curPricePerGram)}/g</span>
                </>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4 w-full sm:w-auto">
          <div className="text-left sm:text-right">
            <span className="text-[9px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider block sm:hidden">
              Current Value
            </span>
            <p className="text-sm font-bold text-[var(--text-primary)] tnum">{formatINR(currentValuation)}</p>
            <p className={`text-xs font-semibold tnum ${pnlColor(pnl)}`}>
              {pnl >= 0 ? '+' : ''}{formatINR(pnl)} ({formatPercent(pnlPct)})
            </p>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => onOpenEdit(holding)}
              className="w-8 h-8 rounded-[var(--radius-small)] border border-[var(--border-subtle)] bg-[var(--surface)] hover:bg-[var(--surface-secondary)] flex items-center justify-center text-[var(--text-tertiary)] hover:text-[var(--warning)] hover:border-[var(--warning)] ios-press transition-colors"
              title="Edit holding & documents"
              aria-label={`Edit ${holding.item_name}`}
            >
              <Edit2 size={13} />
            </button>
            <button
              type="button"
              onClick={() => onConfirmDelete(holding)}
              className="w-8 h-8 rounded-[var(--radius-small)] border border-[var(--border-subtle)] bg-[var(--surface)] hover:bg-[var(--negative-soft)] flex items-center justify-center text-[var(--text-tertiary)] hover:text-[var(--negative)] hover:border-[var(--negative)] ios-press transition-colors"
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
          <button
            key={doc.id}
            type="button"
            onClick={() => handleOpenDocument(doc)}
            disabled={openingDocId === doc.id}
            className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[var(--radius-small)] bg-[var(--warning-soft)] border border-[var(--warning)]/30 text-[var(--warning)] hover:underline font-medium text-[11px] max-w-[220px] truncate cursor-pointer ios-press disabled:opacity-50"
            title={`View ${doc.name}`}
            aria-label={`Open document: ${doc.name}`}
          >
            {openingDocId === doc.id ? (
              <span className="w-2.5 h-2.5 border-2 border-[var(--warning)] border-t-transparent rounded-full animate-spin shrink-0" />
            ) : (
              <FileText size={11} className="shrink-0" />
            )}
            <span className="truncate">{doc.name}</span>
          </button>
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
