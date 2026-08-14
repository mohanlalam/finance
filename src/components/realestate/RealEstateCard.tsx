import React, { useState } from 'react';
import { RealEstate, DocumentMetadata } from '../../types/portfolio';
import { formatINR, formatPercent, pnlColor, getDocumentUrl } from '../../utils/formatters';
import { Edit2, Trash2, Home, MapPin, FileText, StickyNote, Paperclip } from '../icons/AppIcons';

interface RealEstateCardProps {
  property: RealEstate;
  documents: DocumentMetadata[];
  onOpenEdit: (property: RealEstate) => void;
  onConfirmDelete: (property: RealEstate) => void;
}

export const RealEstateCard = React.memo(function RealEstateCard({
  property,
  documents,
  onOpenEdit,
  onConfirmDelete,
}: RealEstateCardProps) {
  const [showNotes, setShowNotes] = useState(false);

  const purchasePrice = property.purchase_price || 0;
  const currentValuation = property.current_valuation || 0;
  const pnl = currentValuation - purchasePrice;
  const pnlPct = purchasePrice > 0 ? (pnl / purchasePrice) * 100 : 0;
  const docs = documents.filter((d) => d.asset_type === 'real_estate' && d.asset_id === property.id);

  return (
    <div className="p-4 sm:p-5 hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition-colors">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/50 dark:border-emerald-800/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
            <Home size={18} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-bold text-slate-800 dark:text-slate-100 text-base">{property.property_name}</h4>
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300">
                {property.property_type}
              </span>
            </div>
            {property.location && (
              <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                <MapPin size={12} className="text-slate-400" />
                {property.location}
              </p>
            )}
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
              onClick={() => onOpenEdit(property)}
              className="w-8 h-8 rounded-[10px] border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 dark:text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
              title="Edit property & documents"
            >
              <Edit2 size={13} />
            </button>
            <button
              type="button"
              onClick={() => onConfirmDelete(property)}
              className="w-8 h-8 rounded-[10px] border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 transition-colors"
              title="Delete property"
            >
              <Trash2 size={13} />
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-700/60 text-xs">
        {docs.map((doc) => (
          <a
            key={doc.id}
            href={getDocumentUrl(doc.file_path)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/50 dark:border-emerald-800/40 text-emerald-700 dark:text-emerald-300 hover:underline font-medium text-[11px] max-w-[220px] truncate"
            title={`View ${doc.name}`}
          >
            <FileText size={11} className="shrink-0" />
            <span className="truncate">{doc.name}</span>
          </a>
        ))}
        {docs.length === 0 && (
          <button
            type="button"
            onClick={() => onOpenEdit(property)}
            className="inline-flex items-center gap-1 text-[11px] text-slate-400 dark:text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
            title="Attach supporting document"
          >
            <Paperclip size={11} />
            <span>+ Attach Doc</span>
          </button>
        )}
        {property.notes && (
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

      {showNotes && property.notes && (
        <p className="mt-2 p-2.5 bg-slate-50 dark:bg-slate-900/60 rounded-xl text-xs text-slate-600 dark:text-slate-300 border border-slate-100 dark:border-slate-700/50">
          {property.notes}
        </p>
      )}
    </div>
  );
});

export default RealEstateCard;
