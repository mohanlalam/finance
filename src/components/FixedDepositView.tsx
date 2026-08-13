import React, { useState, useCallback } from 'react';
import { FixedDeposit, DocumentMetadata, PortfolioName } from '../types/portfolio';
import ConfirmModal from './ConfirmModal';
import DepositDetailsCard from './fd/DepositDetailsCard';
import FDFormModal from './fd/FDFormModal';
import AssetRegistryContainer from './ui/AssetRegistryContainer';
import { usePortfolioState } from '../contexts/PortfolioContext';
import { useToastActions } from '../contexts/ToastContext';
import { useAssetModal } from '../hooks/useAssetModal';
import { FixedSizeList as List } from 'react-window';

interface PortfolioOption {
  name: string;
  label: string;
}

interface FixedDepositViewProps {
  fixedDeposits: FixedDeposit[];
  documents: DocumentMetadata[];
  portfolioName: PortfolioName;
  portfolioOptions: PortfolioOption[];
  onAdd: (assetType: string, portfolioName: string, payload: any) => Promise<void>;
  onUpdate: (assetType: string, id: string, payload: any) => Promise<void>;
  onDelete: (assetType: string, id: string) => Promise<void>;
  autoOpenAddModal?: boolean;
}

export function FixedDepositView({
  fixedDeposits,
  documents,
  portfolioName,
  portfolioOptions,
  onAdd,
  onUpdate,
  onDelete,
  autoOpenAddModal,
}: FixedDepositViewProps) {
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
  } = useAssetModal<FixedDeposit>(autoOpenAddModal);

  const [deleting, setDeleting] = useState(false);

  const handleDelete = useCallback(async (id: string) => {
    setDeleting(true);
    try {
      await onDelete('fd', id);
      addToast('Fixed Deposit deleted successfully', 'success');
      setConfirmDeleteItem(null);
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Failed to delete Fixed Deposit', 'error');
    } finally {
      setDeleting(false);
    }
  }, [onDelete, addToast, setConfirmDeleteItem]);

  return (
    <div>
      <AssetRegistryContainer
        title="Fixed Deposits"
        createBtnLabel="Add FD"
        themeColor="bg-indigo-600 hover:bg-indigo-700"
        emptyType="fd"
        emptyTitle="No Fixed Deposits Added"
        emptyDescription="Keep track of your high-yield fixed deposits, interest rates, and maturity schedules."
        isLoading={isMutating}
        itemCount={fixedDeposits.length}
        onOpenAdd={openAdd}
      >
        {fixedDeposits.length > 8 ? (
          <List
            height={500}
            itemCount={fixedDeposits.length}
            itemSize={140}
            width="100%"
          >
            {({ index, style }) => {
              const deposit = fixedDeposits[index];
              return (
                <div style={style} className="border-b border-slate-100 dark:border-slate-700 last:border-b-0">
                  <DepositDetailsCard
                    deposit={deposit}
                    documents={documents}
                    onOpenEdit={openEdit}
                    onConfirmDelete={setConfirmDeleteItem}
                  />
                </div>
              );
            }}
          </List>
        ) : (
          fixedDeposits.map((deposit) => (
            <DepositDetailsCard
              key={deposit.id}
              deposit={deposit}
              documents={documents}
              onOpenEdit={openEdit}
              onConfirmDelete={setConfirmDeleteItem}
            />
          ))
        )}
      </AssetRegistryContainer>

      <FDFormModal
        isOpen={showModal}
        onClose={closeModal}
        editingFd={editingItem}
        portfolioName={portfolioName}
        portfolioOptions={portfolioOptions}
        onAdd={onAdd}
        onUpdate={onUpdate}
      />

      <ConfirmModal
        isOpen={!!confirmDeleteItem}
        onClose={() => setConfirmDeleteItem(null)}
        onConfirm={() => { if (confirmDeleteItem) void handleDelete(confirmDeleteItem.id); }}
        title="Delete Fixed Deposit"
        message={confirmDeleteItem ? `Are you sure you want to delete the Fixed Deposit at "${confirmDeleteItem.bank_name}"? This cannot be undone.` : ''}
        confirmLabel="Delete"
        variant="danger"
        isLoading={deleting}
      />
    </div>
  );
}

export default React.memo(FixedDepositView);
