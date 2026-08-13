import { useState, useCallback, useMemo } from 'react';

export type QuickAddType = 'stocks' | 'fd' | 'rd' | 'sip' | 'gold' | 'real_estate' | 'insurance' | 'documents';

export interface PortfolioTarget {
  id: string;
  name: string;
  label: string;
}

export type ActiveModal =
  | { type: 'add_holding' }
  | { type: 'add_family' }
  | { type: 'rename_portfolio'; target: PortfolioTarget }
  | { type: 'delete_portfolio'; target: PortfolioTarget }
  | { type: 'change_pin' }
  | { type: 'mobile_alerts' }
  | null;

export function useModalState() {
  const [activeModal, setActiveModal] = useState<ActiveModal>(null);
  const [quickAddTarget, setQuickAddTarget] = useState<QuickAddType | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const openModal = useCallback((modal: ActiveModal) => setActiveModal(modal), []);
  const closeModal = useCallback(() => setActiveModal(null), []);

  // Backwards-compatible convenience getters & setters for AppShell
  const showAddModal = activeModal?.type === 'add_holding';
  const openAddModal = useCallback(() => setActiveModal({ type: 'add_holding' }), []);
  const closeAddModal = useCallback(() => setActiveModal(null), []);

  const showAddFamily = activeModal?.type === 'add_family';
  const openAddFamily = useCallback(() => setActiveModal({ type: 'add_family' }), []);
  const closeAddFamily = useCallback(() => setActiveModal(null), []);

  const renameTarget = activeModal?.type === 'rename_portfolio' ? activeModal.target : null;
  const openRenameModal = useCallback((target: PortfolioTarget) => setActiveModal({ type: 'rename_portfolio', target }), []);
  const closeRenameModal = useCallback(() => setActiveModal(null), []);

  const deleteTarget = activeModal?.type === 'delete_portfolio' ? activeModal.target : null;
  const openDeleteModal = useCallback((target: PortfolioTarget) => setActiveModal({ type: 'delete_portfolio', target }), []);
  const closeDeleteModal = useCallback(() => setActiveModal(null), []);

  const showMobileAlerts = activeModal?.type === 'mobile_alerts';
  const openMobileAlerts = useCallback(() => setActiveModal({ type: 'mobile_alerts' }), []);
  const closeMobileAlerts = useCallback(() => setActiveModal(null), []);

  const showChangePinModal = activeModal?.type === 'change_pin';
  const openChangePinModal = useCallback(() => setActiveModal({ type: 'change_pin' }), []);
  const closeChangePinModal = useCallback(() => setActiveModal(null), []);

  const clearQuickAddTarget = useCallback(() => setQuickAddTarget(null), []);

  const isAnyModalOpen = useMemo(() => {
    return activeModal !== null || quickAddTarget !== null;
  }, [activeModal, quickAddTarget]);

  return {
    activeModal,
    openModal,
    closeModal,
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
