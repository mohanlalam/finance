import React from 'react';
import { BatchImportItem } from '../../domains/smart-import/types';
import { ImportConfidenceBadge } from './ImportConfidenceBadge';
import { CheckCircle2, User, Trash2, Pencil, ChevronRight, Sparkles } from '../icons/AppIcons';
import { formatINR } from '../../utils/formatters';

interface BatchQuarantineReviewProps {
  batchItems: BatchImportItem[];
  activeIndex: number;
  onSelectIndex: (index: number) => void;
  onRemoveItem: (id: string) => void;
  onSaveAll: () => void;
  isSaving: boolean;
}

export const BatchQuarantineReview: React.FC<BatchQuarantineReviewProps> = ({
  batchItems,
  activeIndex,
  onSelectIndex,
  onRemoveItem,
  onSaveAll,
  isSaving,
}) => {
  const readyCount = batchItems.filter((i) => i.status === 'ready').length;

  return (
    <div className="space-y-4">
      {/* Batch Overview Banner */}
      <div className="p-3.5 rounded-[var(--radius-medium)] bg-[var(--surface-secondary)] border border-[var(--border-subtle)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold text-xs shrink-0">
            <Sparkles size={16} />
          </div>
          <div>
            <h4 className="text-xs font-bold text-[var(--text-primary)]">
              Multi-Document Quarantine ({batchItems.length} items)
            </h4>
            <p className="text-[11px] text-[var(--text-secondary)]">
              Cross-asset entity disambiguation applied. Click any item to inspect or edit details.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onSaveAll}
          disabled={isSaving || readyCount === 0}
          className="w-full sm:w-auto px-4 py-2 rounded-xl bg-[var(--positive)] hover:opacity-90 text-white text-xs font-bold transition-all shadow-xs cursor-pointer select-none ios-press flex items-center justify-center gap-1.5 shrink-0"
        >
          <CheckCircle2 size={14} />
          <span>Approve &amp; Save All ({readyCount})</span>
        </button>
      </div>

      {/* Batch Cards Carousel / Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
        {batchItems.map((item, idx) => {
          const isSelected = activeIndex === idx;
          const ext = item.extractedResult;
          const assetType = ext?.assetType || 'documents';
          const memberLabel = item.disambiguation?.memberLabel || 'Rammohan';
          const matchDetails = item.disambiguation?.details || 'Auto-assigned';

          // Extract quick summary text
          let summary = '';
          if (assetType === 'fd') {
            summary = `${item.formData.institutionName || 'FD'}: ₹${formatINR(Number(item.formData.principalAmount) || 0)} @ ${item.formData.interestRate}%`;
          } else if (assetType === 'gold') {
            summary = `${item.formData.itemName || 'Gold'}: ${item.formData.weightGrams}g (${item.formData.purity})`;
          } else if (assetType === 'insurance') {
            summary = `${item.formData.policyName || 'Policy'}: Cover ₹${formatINR(Number(item.formData.sumAssured) || 0)}`;
          } else if (assetType === 'sip' || assetType === 'stocks') {
            summary = `${item.formData.fundName || item.formData.stockName || 'Holding'}: ₹${formatINR(Number(item.formData.currentValuation || item.formData.avgBuyPrice) || 0)}`;
          } else {
            summary = item.file.name;
          }

          return (
            <div
              key={item.id}
              onClick={() => onSelectIndex(idx)}
              className={`p-3 rounded-[var(--radius-small)] border transition-all cursor-pointer select-none relative group text-left ${
                isSelected
                  ? 'bg-blue-500/10 border-blue-500/50 shadow-xs ring-1 ring-blue-500/30'
                  : 'bg-[var(--surface)] border-[var(--border-subtle)] hover:border-[var(--text-tertiary)]'
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-[var(--surface-secondary)] text-[var(--text-secondary)] border border-[var(--border-subtle)]">
                    {assetType.toUpperCase()}
                  </span>
                  <span className="text-[10px] font-bold text-[var(--text-primary)] truncate max-w-[140px]" title={item.file.name}>
                    {item.file.name}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <ImportConfidenceBadge
                    confidence={ext?.overallConfidence}
                    source={matchDetails}
                  />
                  {batchItems.length > 1 && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemoveItem(item.id);
                      }}
                      className="text-[var(--text-tertiary)] hover:text-[var(--negative)] p-1 rounded transition-colors"
                      title="Remove from batch"
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
              </div>

              {/* Financial summary & Entity Disambiguation */}
              <p className="text-xs font-semibold text-[var(--text-primary)] truncate mb-2">
                {summary}
              </p>

              <div className="flex items-center justify-between pt-1.5 border-t border-[var(--border-subtle)]/60 text-[10px]">
                <div className="flex items-center gap-1 text-[var(--accent-blue)] font-bold">
                  <User size={11} />
                  <span>{memberLabel}</span>
                  <span className="text-[9px] text-[var(--text-tertiary)] font-normal truncate max-w-[100px]" title={matchDetails}>
                    ({item.disambiguation?.matchType})
                  </span>
                </div>

                <div className="flex items-center gap-1 text-[var(--text-secondary)] font-medium">
                  {isSelected ? (
                    <span className="text-blue-600 dark:text-blue-400 font-bold flex items-center gap-0.5">
                      <Pencil size={11} /> Editing
                    </span>
                  ) : (
                    <span className="flex items-center gap-0.5 group-hover:text-[var(--text-primary)]">
                      Review <ChevronRight size={10} />
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
