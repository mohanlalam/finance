import React, { useState } from 'react';
import { GoldHolding, DocumentMetadata } from '../../types/portfolio';
import { formatINR, formatPercent, pnlColor, getDocumentUrl } from '../../utils/formatters';
import { Edit2, Trash2, Scale, Coins, FileText, StickyNote } from '../icons/AppIcons';

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
    <div className="p-4 sm:p-5 hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition-colors">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/50 dark:border-amber-800/40 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
            <Coins size={18} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-bold text-slate-800 dark:text-slate-100 text-base">{holding.item_name}</h4>
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300">
                {holding.purity}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
              <Scale size={12} className="text-slate-400" />
              {holding.weight_grams} grams
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-4">
          <div className="text-right">
            <p className="text-sm font-bold text-slate-800 dark:text-slate-100 tnum">{formatINR(currentValuation)}</p>
            <p className={`text-xs font-semibold tnum ${pnlColor(pnl)}`}>
              {pnl >= 0 ? '+' : ''}{formatINR(pnl)} ({formatPercent(pnlPct)})
            </p>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => onOpenEdit(holding)}
              className="w-8 h-8 rounded-[10px] border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 dark:text-slate-500 hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
              title="Edit holding"
            >
              <Edit2 size={13} />
            </button>
            <button
              type="button"
              onClick={() => onConfirmDelete(holding)}
              className="w-8 h-8 rounded-[10px] border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 transition-colors"
              title="Delete holding"
            >
              <Trash2 size={13} />
            </button>
          </div>
        </div>
      </div>

      {(docs.length > 0 || holding.notes) && (
        <div className="flex items-center gap-3 pt-2 border-t border-slate-100 dark:border-slate-700/60 text-xs">
          {docs.map((doc) => (
            <a
              key={doc.id}
              href={getDocumentUrl(doc.file_path)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 hover:underline font-medium"
            >
              <FileText size={12} />
              {doc.name}
            </a>
          ))}
          {holding.notes && (
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
      )}

      {showNotes && holding.notes && (
        <p className="mt-2 p-2.5 bg-slate-50 dark:bg-slate-900/60 rounded-xl text-xs text-slate-600 dark:text-slate-300 border border-slate-100 dark:border-slate-700/50">
          {holding.notes}
        </p>
      )}
    </div>
  );
});

export default GoldHoldingCard;
