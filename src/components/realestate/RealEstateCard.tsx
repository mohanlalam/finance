import React, { useState } from 'react';
import { RealEstate, DocumentMetadata } from '../../types/portfolio';
import { formatINR, formatPercent, pnlColor } from '../../utils/formatters';
import { calculateRentalYield } from '../../utils/realEstateUtils';
import { openSecureDocument } from '../../utils/supabaseStorage';
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
  const rentalYieldPct = calculateRentalYield(property);
  const monthlyRent = Number(property.monthly_rent) || 0;
  const docs = documents.filter((d) => d.asset_type === 'real_estate' && d.asset_id === property.id);

  return (
    <div className="p-3.5 sm:p-4 hover:bg-[var(--surface-secondary)]/50 transition-colors mobile-asset-card">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2.5">
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <div className="w-8 h-8 rounded-[var(--radius-small)] bg-[var(--positive-soft)] border border-[var(--positive)]/30 flex items-center justify-center text-[var(--positive)] shrink-0">
            <Home size={16} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="font-bold text-[var(--text-primary)] text-sm truncate">{property.property_name}</h4>
              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-[var(--radius-pill)] bg-[var(--positive-soft)] text-[var(--positive)] shrink-0">
                {property.property_type}
              </span>
              {docs.length > 0 ? (
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-[var(--radius-small)] bg-[var(--positive-soft)] text-[var(--positive)] border border-[var(--positive)]/30 shrink-0">
                  📎 {docs.length} Doc{docs.length > 1 ? 's' : ''}
                </span>
              ) : (
                <span className="text-[9px] font-medium px-1.5 py-0.5 rounded-[var(--radius-small)] bg-[var(--surface-secondary)] text-[var(--text-tertiary)] shrink-0">
                  No Deed
                </span>
              )}
            </div>
            {property.location && (
              <p className="text-xs text-[var(--text-tertiary)] flex items-center gap-1 mt-0.5 truncate">
                <MapPin size={11} className="text-[var(--text-tertiary)] shrink-0" />
                {property.location}
              </p>
            )}
            {monthlyRent > 0 && (
              <p className="text-[11px] font-semibold text-[var(--positive)] flex items-center gap-1 mt-0.5">
                <span>🏠 Rent: {formatINR(monthlyRent)}/mo</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-[var(--positive-soft)] border border-[var(--positive)]/30">
                  {formatPercent(rentalYieldPct)} yield
                </span>
              </p>
            )}
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
              onClick={() => onOpenEdit(property)}
              className="w-8 h-8 rounded-[var(--radius-small)] border border-[var(--border-subtle)] bg-[var(--surface)] hover:bg-[var(--surface-secondary)] flex items-center justify-center text-[var(--text-tertiary)] hover:text-[var(--positive)] hover:border-[var(--positive)] ios-press transition-colors"
              title="Edit property & documents"
              aria-label={`Edit ${property.property_name}`}
            >
              <Edit2 size={13} />
            </button>
            <button
              type="button"
              onClick={() => onConfirmDelete(property)}
              className="w-8 h-8 rounded-[var(--radius-small)] border border-[var(--border-subtle)] bg-[var(--surface)] hover:bg-[var(--negative-soft)] flex items-center justify-center text-[var(--text-tertiary)] hover:text-[var(--negative)] hover:border-[var(--negative)] ios-press transition-colors"
              title="Delete property"
              aria-label={`Delete ${property.property_name}`}
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
            onClick={() => openSecureDocument(doc.file_path)}
            className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[var(--radius-small)] bg-[var(--positive-soft)] border border-[var(--positive)]/30 text-[var(--positive)] hover:underline font-medium text-[11px] max-w-[220px] truncate cursor-pointer ios-press"
            title={`View ${doc.name}`}
            aria-label={`Open document: ${doc.name}`}
          >
            <FileText size={11} className="shrink-0" />
            <span className="truncate">{doc.name}</span>
          </button>
        ))}
        {docs.length === 0 && (
          <button
            type="button"
            onClick={() => onOpenEdit(property)}
            className="inline-flex items-center gap-1 text-[11px] text-[var(--text-tertiary)] hover:text-[var(--positive)] transition-colors"
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
            className="inline-flex items-center gap-1 text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-xs font-medium ml-auto"
          >
            <StickyNote size={12} />
            {showNotes ? 'Hide Notes' : 'View Notes'}
          </button>
        )}
      </div>

      {showNotes && property.notes && (
        <p className="mt-2 p-2.5 bg-[var(--surface-secondary)] rounded-[var(--radius-medium)] text-xs text-[var(--text-secondary)] border border-[var(--border-subtle)]">
          {property.notes}
        </p>
      )}
    </div>
  );
});

export default RealEstateCard;
