import React from 'react';
import { Plus } from '../icons/AppIcons';
import AssetCardSkeleton from '../AssetCardSkeleton';
import EmptyState from '../EmptyState';

interface AssetRegistryContainerProps {
  title: string;
  createBtnLabel: string;
  themeColor?: string; // e.g. 'bg-amber-600 hover:bg-amber-700'
  emptyType: 'fd' | 'rd' | 'sip' | 'stocks' | 'gold' | 'real_estate' | 'insurance' | 'documents' | 'default';
  emptyTitle: string;
  emptyDescription: string;
  isLoading: boolean;
  itemCount: number;
  onOpenAdd: () => void;
  stats?: React.ReactNode;
  toolbar?: React.ReactNode;
  children: React.ReactNode;
}

export const AssetRegistryContainer = React.memo(function AssetRegistryContainer({
  title,
  createBtnLabel,
  themeColor = 'bg-indigo-600 hover:bg-indigo-700',
  emptyType,
  emptyTitle,
  emptyDescription,
  isLoading,
  itemCount,
  onOpenAdd,
  stats,
  toolbar,
  children,
}: AssetRegistryContainerProps) {
  return (
    <div className="apple-card overflow-hidden">
      {/* Header Bar */}
      <div className="px-5 py-3.5 sm:px-6 sm:py-4 border-b border-[var(--border-subtle)] bg-[var(--surface-secondary)]/50 flex items-center justify-between">
        <h3 className="text-xs sm:text-sm font-bold text-[var(--text-primary)] uppercase tracking-wider">{title}</h3>
        <button
          type="button"
          onClick={onOpenAdd}
          className={`flex items-center gap-1.5 text-white text-xs font-semibold px-3 py-1.5 rounded-[var(--radius-small)] transition-all shadow-sm ios-press ${themeColor}`}
        >
          <Plus size={13} aria-hidden="true" />
          {createBtnLabel}
        </button>
      </div>

      {/* Optional Stats Ribbon */}
      {stats && (
        <div className="border-b border-[var(--border-subtle)] bg-[var(--surface-secondary)]/30">
          {stats}
        </div>
      )}

      {/* Optional Search & Sort Toolbar */}
      {toolbar && (
        <div>
          {toolbar}
        </div>
      )}

      {isLoading ? (
        <div className="p-4">
          <AssetCardSkeleton count={Math.max(1, itemCount || 3)} />
        </div>
      ) : itemCount === 0 ? (
        <div className="p-8">
          <EmptyState
            type={emptyType}
            title={emptyTitle}
            description={emptyDescription}
            actionButton={
              <button
                type="button"
                onClick={onOpenAdd}
                className={`inline-flex items-center gap-2 text-white text-sm font-semibold px-5 py-2.5 rounded-[var(--radius-medium)] transition-colors shadow-sm ios-press ${themeColor}`}
              >
                <Plus size={15} aria-hidden="true" />
                {createBtnLabel}
              </button>
            }
          />
        </div>
      ) : (
        <div className="divide-y divide-[var(--border-subtle)]" role="list">
          {children}
        </div>
      )}
    </div>
  );
});

export default AssetRegistryContainer;
