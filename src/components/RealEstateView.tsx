import React, { useState, useCallback } from 'react';
import { RealEstate, DocumentMetadata, PortfolioName } from '../types/portfolio';
import ConfirmModal from './ConfirmModal';
import RealEstateCard from './realestate/RealEstateCard';
import RealEstateFormModal from './realestate/RealEstateFormModal';
import AssetRegistryContainer from './ui/AssetRegistryContainer';
import { usePortfolioStatus } from '../contexts/PortfolioContext';
import { useToastActions } from '../contexts/ToastContext';
import { useAssetModal } from '../hooks/useAssetModal';
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

  const handleDelete = useCallback(async (id: string) => {
    setDeleting(true);
    try {
      await onDelete('real_estate', id);
      addToast('Property deleted successfully', 'success');
      setConfirmDeleteItem(null);
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Failed to delete property', 'error');
    } finally {
      setDeleting(false);
    }
  }, [onDelete, addToast, setConfirmDeleteItem]);

  return (
    <div>
      <AssetRegistryContainer
        title="Real Estate Properties"
        createBtnLabel="Add Property"
        themeColor="bg-emerald-600 hover:bg-emerald-700"
        emptyType="real_estate"
        emptyTitle="No Real Estate Added"
        emptyDescription="Monitor land plots, residential apartments, houses, and commercial property valuations."
        isLoading={isMutating}
        itemCount={realEstate.length}
        onOpenAdd={openAdd}
      >
        {realEstate.length > 25 ? (
          <List
            height={500}
            itemCount={realEstate.length}
            itemSize={130}
            width="100%"
          >
            {({ index, style }) => {
              const property = realEstate[index];
              return (
                <div style={style} className="border-b border-slate-100 dark:border-slate-700 last:border-b-0">
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
        onConfirm={() => { if (confirmDeleteItem) void handleDelete(confirmDeleteItem.id); }}
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
