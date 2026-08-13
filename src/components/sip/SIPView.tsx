import React, { useState, useCallback, useMemo } from 'react';
import { DocumentMetadata, SIPAccount } from '../../types/portfolio';
import ConfirmModal from '../ConfirmModal';
import SIPAccountCard from './SIPAccountCard';
import { SIPFormModal } from './SIPFormModal';
import { useSIPData } from '../../hooks/useSIPData';
import { usePortfolioState } from '../../contexts/PortfolioContext';
import { useToastActions } from '../../contexts/ToastContext';
import AssetRegistryContainer from '../ui/AssetRegistryContainer';
import { useAssetModal } from '../../hooks/useAssetModal';
import { FixedSizeList as List } from 'react-window';

interface PortfolioOption {
  name: string;
  label: string;
}

interface SIPViewProps {
  documents: DocumentMetadata[];
  portfolioName: string;
  portfolioOptions: PortfolioOption[];
  autoOpenAddModal?: boolean;
}

export function SIPView({
  documents,
  portfolioName,
  portfolioOptions,
  autoOpenAddModal,
}: SIPViewProps) {
  const { portfolios, isMutating } = usePortfolioState();
  const { addToast } = useToastActions();
  const {
    sipAccounts,
    loading,
    addSIPAccount,
    updateSIPAccount,
    deleteSIPAccount,
  } = useSIPData();

  const {
    showModal,
    editingItem,
    confirmDeleteItem,
    openAdd,
    openEdit,
    closeModal,
    setConfirmDeleteItem,
  } = useAssetModal<SIPAccount>(autoOpenAddModal);

  const [deleting, setDeleting] = useState(false);

  const activePortfolio = useMemo(() => {
    if (portfolioName === 'all') return null;
    return portfolios.find((p) => p.name === portfolioName) ?? null;
  }, [portfolios, portfolioName]);

  const filteredAccounts = useMemo(() => {
    if (portfolioName === 'all') return sipAccounts;
    if (!activePortfolio) return [];
    return sipAccounts.filter((r) => r.portfolio_id === activePortfolio.id);
  }, [sipAccounts, portfolioName, activePortfolio]);

  const handleDelete = useCallback(
    async (id: string) => {
      setDeleting(true);
      try {
        await deleteSIPAccount(id);
        addToast('Mutual Fund / SIP deleted', 'success');
        setConfirmDeleteItem(null);
      } catch (err) {
        addToast(err instanceof Error ? err.message : 'Failed to delete SIP', 'error');
      } finally {
        setDeleting(false);
      }
    },
    [deleteSIPAccount, addToast, setConfirmDeleteItem]
  );

  return (
    <div>
      <AssetRegistryContainer
        title="Mutual Fund SIPs"
        createBtnLabel="Add SIP"
        themeColor="bg-emerald-600 hover:bg-emerald-700"
        emptyType="sip"
        emptyTitle="No Mutual Fund SIPs"
        emptyDescription="Track systematic investment plans and live AMFI NAV valuations."
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
                <div style={style} className="border-b border-slate-100 dark:border-slate-700 last:border-b-0">
                  <SIPAccountCard
                    account={account}
                    documents={documents}
                    onOpenEdit={openEdit}
                    onConfirmDelete={setConfirmDeleteItem}
                  />
                </div>
              );
            }}
          </List>
        ) : (
          filteredAccounts.map((account) => (
            <SIPAccountCard
              key={account.id}
              account={account}
              documents={documents}
              onOpenEdit={openEdit}
              onConfirmDelete={setConfirmDeleteItem}
            />
          ))
        )}
      </AssetRegistryContainer>

      <SIPFormModal
        isOpen={showModal}
        onClose={closeModal}
        editingAccount={editingItem}
        portfolioName={portfolioName}
        portfolioOptions={portfolioOptions}
        onAdd={addSIPAccount}
        onUpdate={updateSIPAccount}
      />

      <ConfirmModal
        isOpen={!!confirmDeleteItem}
        onClose={() => setConfirmDeleteItem(null)}
        onConfirm={() => { if (confirmDeleteItem) void handleDelete(confirmDeleteItem.id); }}
        title="Delete Mutual Fund / SIP"
        message={confirmDeleteItem ? `Are you sure you want to delete the Mutual Fund / SIP for "${confirmDeleteItem.fund_name}"? This cannot be undone.` : ''}
        confirmLabel="Delete"
        variant="danger"
        isLoading={deleting}
      />
    </div>
  );
}

export default React.memo(SIPView);
