import React, { useState, useCallback } from 'react';
import { RealEstate, DocumentMetadata, PortfolioName } from '../types/portfolio';
import ConfirmModal from './ConfirmModal';
import RealEstateCard from './realestate/RealEstateCard';
import RealEstateFormModal from './realestate/RealEstateFormModal';
import AssetRegistryContainer from './ui/AssetRegistryContainer';
import { usePortfolioStatus } from '../contexts/PortfolioContext';
import { useToastActions } from '../contexts/ToastContext';
import { useAssetModal } from '../hooks/useAssetModal';
import { useIsMobile } from '../hooks/useIsMobile';
import { FixedSizeList as List } from 'react-window';

interface PortfolioOption {
  name: string;
  label: string;
}

interface RealEstateViewProps {
  realEstate: RealEstate[];
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

export function RealEstateView({
  realEstate,
  documents,
  portfolioName,
  portfolioOptions,
  onAdd,
  onUpdate,
  onDelete,
  autoOpenAddModal,
}: RealEstateViewProps) {
  const isMobile = useIsMobile();
  const { isMutating } = usePortfolioStatus();
  const { addToast } = useToastActions();
  const {
    showModal,
    editingItem,
    confirmDeleteItem,
    openAdd,
    openEdit,
    closeModal,
    setConfirmDeleteItem,
  } = useAssetModal<RealEstate>(autoOpenAddModal);

  const [deleting, setDeleting] = useState(false);

  const handleDelete = useCallback(async () => {
    if (!confirmDeleteItem) return;
    setDeleting(true);
    try {
      await onDelete('real_estate', confirmDeleteItem.id);
      addToast('Property removed', 'success');
      setConfirmDeleteItem(null);
    } catch (err: unknown) {
      addToast(err instanceof Error ? err.message : 'Failed to delete property', 'error');
    } finally {
      setDeleting(false);
    }
  }, [confirmDeleteItem, onDelete, addToast, setConfirmDeleteItem]);

  return (
    <div>
      <AssetRegistryContainer
        title="Real Estate"
        createBtnLabel="Add Property"
        themeColor="bg-[var(--accent-blue)] hover:opacity-90"
        emptyType="real_estate"
        emptyTitle="No Properties Added"
        emptyDescription="Monitor land plots, residential apartments, houses, and commercial property valuations."
        isLoading={isMutating}
        itemCount={realEstate.length}
        onOpenAdd={openAdd}
      >
        {realEstate.length > 10 ? (
          <List
            height={Math.min(realEstate.length * (isMobile ? 165 : 130), isMobile ? 420 : 540)}
            itemCount={realEstate.length}
            itemSize={isMobile ? 165 : 130}
            width="100%"
          >
            {({ index, style }) => {
              const property = realEstate[index];
              return (
                <div style={style} className="border-b border-[var(--border-subtle)] last:border-b-0">
                  <RealEstateCard
                    property={property}
                    documents={documents}
                    onOpenEdit={openEdit}
                    onConfirmDelete={setConfirmDeleteItem}
                  />
                </div>
              );
            }}
          </List>
        ) : (
          realEstate.map((property) => (
            <RealEstateCard
              key={property.id}
              property={property}
              documents={documents}
              onOpenEdit={openEdit}
              onConfirmDelete={setConfirmDeleteItem}
            />
          ))
        )}
      </AssetRegistryContainer>

      <RealEstateFormModal
        isOpen={showModal}
        onClose={closeModal}
        editingProperty={editingItem}
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
        onConfirm={handleDelete}
        title="Delete Property"
        message={confirmDeleteItem ? `Are you sure you want to delete "${confirmDeleteItem.property_name}"? This cannot be undone.` : ''}
        confirmLabel="Delete"
        variant="danger"
        isLoading={deleting}
      />
    </div>
  );
}

export default React.memo(RealEstateView);
