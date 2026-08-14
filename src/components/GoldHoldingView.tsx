import React, { useState, useCallback } from 'react';
import { GoldHolding, DocumentMetadata, PortfolioName } from '../types/portfolio';
import ConfirmModal from './ConfirmModal';
import GoldHoldingCard from './gold/GoldHoldingCard';
import GoldFormModal from './gold/GoldFormModal';
import AssetRegistryContainer from './ui/AssetRegistryContainer';
import { usePortfolioState } from '../contexts/PortfolioContext';
import { useToastActions } from '../contexts/ToastContext';
import { useAssetModal } from '../hooks/useAssetModal';
import { FixedSizeList as List } from 'react-window';

interface PortfolioOption {
  name: string;
  label: string;
}

interface GoldHoldingViewProps {
  goldHoldings: GoldHolding[];
  documents: DocumentMetadata[];
  portfolioName: PortfolioName;
  portfolioOptions: PortfolioOption[];
  onAdd: (assetType: string, portfolioName: string, payload: any) => Promise<void>;
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
  const { isMutating } = usePortfolioState();
  const { addToast } = useToastActions();
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
    <div>
      <AssetRegistryContainer
        title="Gold & Precious Metals"
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
        onAdd={onAdd}
        onUpdate={onUpdate}
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
