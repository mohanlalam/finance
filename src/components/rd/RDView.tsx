import React, { useState, useCallback, useMemo } from 'react';
import { DocumentMetadata, RDAccount } from '../../types/portfolio';
import ConfirmModal from '../ConfirmModal';
import RDAccountCard from './RDAccountCard';
import { RDFormModal } from './RDFormModal';
import { useRDData } from '../../hooks/useRDData';
import { usePortfolioState } from '../../contexts/PortfolioContext';
import { useToastActions } from '../../contexts/ToastContext';
import AssetRegistryContainer from '../ui/AssetRegistryContainer';
import { useAssetModal } from '../../hooks/useAssetModal';
import { FixedSizeList as List } from 'react-window';

interface PortfolioOption {
  name: string;
  label: string;
}

interface RDViewProps {
  documents: DocumentMetadata[];
  portfolioName: string;
  portfolioOptions: PortfolioOption[];
  autoOpenAddModal?: boolean;
}

export function RDView({
  documents,
  portfolioName,
  portfolioOptions,
  autoOpenAddModal,
}: RDViewProps) {
  const { portfolios, isMutating } = usePortfolioState();
  const { addToast } = useToastActions();
  const {
    rdAccounts,
    loading,
    addRDAccount,
    updateRDAccount,
    deleteRDAccount,
  } = useRDData();

  const {
    showModal,
    editingItem,
    confirmDeleteItem,
    openAdd,
    openEdit,
    closeModal,
    setConfirmDeleteItem,
  } = useAssetModal<RDAccount>(autoOpenAddModal);

  const [deleting, setDeleting] = useState(false);

  const activePortfolio = useMemo(() => {
    if (portfolioName === 'all') return null;
    return portfolios.find((p) => p.name === portfolioName) ?? null;
  }, [portfolios, portfolioName]);

  const filteredAccounts = useMemo(() => {
    if (portfolioName === 'all') return rdAccounts;
    if (!activePortfolio) return [];
    return rdAccounts.filter((r) => r.portfolio_id === activePortfolio.id);
  }, [rdAccounts, portfolioName, activePortfolio]);

  const handleDelete = useCallback(
    async (id: string) => {
      setDeleting(true);
      try {
        await deleteRDAccount(id);
        addToast('Recurring Deposit deleted', 'success');
        setConfirmDeleteItem(null);
      } catch (err) {
        addToast(err instanceof Error ? err.message : 'Failed to delete RD', 'error');
      } finally {
        setDeleting(false);
      }
    },
    [deleteRDAccount, addToast, setConfirmDeleteItem]
  );

  return (
    <div>
      <AssetRegistryContainer
        title="Recurring Deposits"
        createBtnLabel="Add RD"
        themeColor="bg-[var(--accent-blue)] hover:opacity-90"
        emptyType="rd"
        emptyTitle="No Recurring Deposits"
        emptyDescription="Track monthly systematic deposits across banks."
        isLoading={loading || isMutating}
        itemCount={filteredAccounts.length}
        onOpenAdd={openAdd}
      >
        {filteredAccounts.length > 8 ? (
          <List
            height={500}
            itemCount={filteredAccounts.length}
            itemSize={135}
            width="100%"
          >
            {({ index, style }) => {
              const account = filteredAccounts[index];
              return (
                <div style={style} className="border-b border-[var(--border-subtle)] last:border-b-0">
                  <RDAccountCard
                    account={account}
                    documents={documents}
                    onOpenEdit={openEdit}
                    onConfirmDelete={setConfirmDeleteItem}
                    onUpdate={updateRDAccount}
                  />
                </div>
              );
            }}
          </List>
        ) : (
          filteredAccounts.map((account) => (
            <RDAccountCard
              key={account.id}
              account={account}
              documents={documents}
              onOpenEdit={openEdit}
              onConfirmDelete={setConfirmDeleteItem}
              onUpdate={updateRDAccount}
            />
          ))
        )}
      </AssetRegistryContainer>

      <RDFormModal
        isOpen={showModal}
        onClose={closeModal}
        editingAccount={editingItem}
        portfolioName={portfolioName}
        portfolioOptions={portfolioOptions}
        onAdd={addRDAccount}
        onUpdate={updateRDAccount}
      />

      <ConfirmModal
        isOpen={!!confirmDeleteItem}
        onClose={() => setConfirmDeleteItem(null)}
        onConfirm={() => { if (confirmDeleteItem) void handleDelete(confirmDeleteItem.id); }}
        title="Delete Recurring Deposit"
        message={confirmDeleteItem ? `Are you sure you want to delete the Recurring Deposit at "${confirmDeleteItem.bank_name}"? This cannot be undone.` : ''}
        confirmLabel="Delete"
        variant="danger"
        isLoading={deleting}
      />
    </div>
  );
}

export default React.memo(RDView);
