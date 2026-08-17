import React, { useState, useCallback } from 'react';
import { GoldHolding, DocumentMetadata, PortfolioName } from '../types/portfolio';
import ConfirmModal from './ConfirmModal';
import GoldHoldingCard from './gold/GoldHoldingCard';
import GoldFormModal from './gold/GoldFormModal';
import AssetRegistryContainer from './ui/AssetRegistryContainer';
import { usePortfolioState } from '../contexts/PortfolioContext';
import { useToastActions } from '../contexts/ToastContext';
import { useAssetModal } from '../hooks/useAssetModal';
import { useIsMobile } from '../hooks/useIsMobile';
import { FixedSizeList as List } from 'react-window';

import { deriveGoldRates } from '../utils/goldPricing';
import { formatINR } from '../utils/formatters';

interface PortfolioOption {
  name: string;
  label: string;
}

interface GoldHoldingViewProps {
  goldHoldings: GoldHolding[];
  documents: DocumentMetadata[];
  portfolioName: PortfolioName;
  portfolioOptions: PortfolioOption[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onAdd: (assetType: string, portfolioName: string, payload: any) => Promise<any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onUpdate: (assetType: string, id: string, payload: any) => Promise<void>;
  onDelete: (assetType: string, id: string) => Promise<void>;
  autoOpenAddModal?: boolean;
}

export function GoldHoldingView({
  goldHoldings,
  documents,
  portfolioName,
  portfolioOptions,
  onAdd,
  onUpdate,
  onDelete,
  autoOpenAddModal,
}: GoldHoldingViewProps) {
  const isMobile = useIsMobile();
  const { isMutating } = usePortfolioState();
  const { addToast } = useToastActions();
  const rates = deriveGoldRates();
  const {
    showModal,
    editingItem,
    confirmDeleteItem,
    openAdd,
    openEdit,
    closeModal,
    setConfirmDeleteItem,
  } = useAssetModal<GoldHolding>(autoOpenAddModal);

  const [deleting, setDeleting] = useState(false);

  const handleDelete = useCallback(async (id: string) => {
    setDeleting(true);
    try {
      await onDelete('gold', id);
      addToast('Gold holding deleted successfully', 'success');
      setConfirmDeleteItem(null);
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Failed to delete gold holding', 'error');
    } finally {
      setDeleting(false);
    }
  }, [onDelete, addToast, setConfirmDeleteItem]);

  return (
    <div className="space-y-4">
      {/* Live Market Rate Strip */}
      <div className="apple-card p-3 sm:p-4 flex flex-wrap items-center justify-between gap-3 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/20">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold text-sm">
            Au
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[var(--text-primary)]">Indicative Bullion Spot Rates</span>
              <span className="text-[9.5px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                Live Market
              </span>
            </div>
            <p className="text-[11px] text-[var(--text-tertiary)]">Standard IBJA/MCX rates per gram</p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-4 text-xs font-bold tnum">
          <div className="px-2.5 py-1 rounded-[var(--radius-small)] bg-[var(--surface)] border border-[var(--border-subtle)]">
            <span className="text-[var(--text-tertiary)] text-[10px] uppercase font-semibold mr-1.5">24K (99.9%):</span>
            <span className="text-amber-600 dark:text-amber-400">{formatINR(rates.rate24kPerGram)}/g</span>
          </div>
          <div className="px-2.5 py-1 rounded-[var(--radius-small)] bg-[var(--surface)] border border-[var(--border-subtle)]">
            <span className="text-[var(--text-tertiary)] text-[10px] uppercase font-semibold mr-1.5">22K (91.6%):</span>
            <span className="text-[var(--text-primary)]">{formatINR(rates.rate22kPerGram)}/g</span>
          </div>
        </div>
      </div>

      <AssetRegistryContainer
        title="Gold &amp; Precious Metals"
        createBtnLabel="Add Gold"
        themeColor="bg-amber-600 hover:bg-amber-700"
        emptyType="gold"
        emptyTitle="No Gold Holdings Added"
        emptyDescription="Track physical gold coins, bars, jewelry, or Sovereign Gold Bonds in your portfolio."
        isLoading={isMutating}
        itemCount={goldHoldings.length}
        onOpenAdd={openAdd}
      >
        {goldHoldings.length > 10 ? (
          <List
            height={Math.min(goldHoldings.length * (isMobile ? 165 : 130), isMobile ? 420 : 540)}
            itemCount={goldHoldings.length}
            itemSize={isMobile ? 165 : 130}
            width="100%"
          >
            {({ index, style }) => {
              const holding = goldHoldings[index];
              return (
                <div style={style} className="border-b border-[var(--border-subtle)] last:border-b-0">
                  <GoldHoldingCard
                    holding={holding}
                    documents={documents}
                    onOpenEdit={openEdit}
                    onConfirmDelete={setConfirmDeleteItem}
                  />
                </div>
              );
            }}
          </List>
        ) : (
          goldHoldings.map((holding) => (
            <GoldHoldingCard
              key={holding.id}
              holding={holding}
              documents={documents}
              onOpenEdit={openEdit}
              onConfirmDelete={setConfirmDeleteItem}
            />
          ))
        )}
      </AssetRegistryContainer>

      <GoldFormModal
        isOpen={showModal}
        onClose={closeModal}
        editingHolding={editingItem}
        portfolioName={portfolioName}
        portfolioOptions={portfolioOptions}
        documents={documents}
        onAdd={onAdd}
        onUpdate={onUpdate}
        onDeleteDoc={onDelete}
      />

      <ConfirmModal
        isOpen={!!confirmDeleteItem}
        onClose={() => setConfirmDeleteItem(null)}
        onConfirm={() => { if (confirmDeleteItem) void handleDelete(confirmDeleteItem.id); }}
        title="Delete Gold Holding"
        message={confirmDeleteItem ? `Are you sure you want to delete "${confirmDeleteItem.item_name}"? This cannot be undone.` : ''}
        confirmLabel="Delete"
        variant="danger"
        isLoading={deleting}
      />
    </div>
  );
}

export default React.memo(GoldHoldingView);
