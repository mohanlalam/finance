import { useState, useCallback, useMemo } from 'react';

export type QuickAddType = 'stocks' | 'fd' | 'rd' | 'sip' | 'gold' | 'real_estate' | 'insurance' | 'documents';

export interface PortfolioTarget {
  id: string;
  name: string;
  label: string;
}

export function useModalState() {
  const [quickAddTarget, setQuickAddTarget] = useState<QuickAddType | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAddFamily, setShowAddFamily] = useState(false);
  const [renameTarget, setRenameTarget] = useState<PortfolioTarget | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PortfolioTarget | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showMobileAlerts, setShowMobileAlerts] = useState(false);
  const [showChangePinModal, setShowChangePinModal] = useState(false);

  const openAddModal = useCallback(() => setShowAddModal(true), []);
  const closeAddModal = useCallback(() => setShowAddModal(false), []);

  const openAddFamily = useCallback(() => setShowAddFamily(true), []);
  const closeAddFamily = useCallback(() => setShowAddFamily(false), []);

  const openRenameModal = useCallback((target: PortfolioTarget) => setRenameTarget(target), []);
  const closeRenameModal = useCallback(() => setRenameTarget(null), []);

  const openDeleteModal = useCallback((target: PortfolioTarget) => setDeleteTarget(target), []);
  const closeDeleteModal = useCallback(() => setDeleteTarget(null), []);

  const openMobileAlerts = useCallback(() => setShowMobileAlerts(true), []);
  const closeMobileAlerts = useCallback(() => setShowMobileAlerts(false), []);

  const openChangePinModal = useCallback(() => setShowChangePinModal(true), []);
  const closeChangePinModal = useCallback(() => setShowChangePinModal(false), []);

  const clearQuickAddTarget = useCallback(() => setQuickAddTarget(null), []);

  const isAnyModalOpen = useMemo(() => {
    return (
      showAddModal ||
      showAddFamily ||
      !!renameTarget ||
      !!deleteTarget ||
      showChangePinModal ||
      !!quickAddTarget ||
      showMobileAlerts
    );
  }, [
    showAddModal,
    showAddFamily,
    renameTarget,
    deleteTarget,
    showChangePinModal,
    quickAddTarget,
    showMobileAlerts,
  ]);

  return {
    quickAddTarget,
    setQuickAddTarget,
    clearQuickAddTarget,
    showAddModal,
    openAddModal,
    closeAddModal,
    showAddFamily,
    openAddFamily,
    closeAddFamily,
    renameTarget,
    openRenameModal,
    closeRenameModal,
    deleteTarget,
    openDeleteModal,
    closeDeleteModal,
    isDeleting,
    setIsDeleting,
    showMobileAlerts,
    openMobileAlerts,
    closeMobileAlerts,
    showChangePinModal,
    openChangePinModal,
    closeChangePinModal,
    isAnyModalOpen,
  };
}
