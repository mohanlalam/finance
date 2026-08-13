import React from 'react';
import { Plus } from '../icons/AppIcons';
import AssetCardSkeleton from '../AssetCardSkeleton';
import EmptyState from '../EmptyState';

interface AssetRegistryContainerProps {
  title: string;
  createBtnLabel: string;
  themeColor?: string; // e.g. 'bg-amber-600 hover:bg-amber-700'
  emptyType: any;
  emptyTitle: string;
  emptyDescription: string;
  isLoading: boolean;
  itemCount: number;
  onOpenAdd: () => void;
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
  children,
}: AssetRegistryContainerProps) {
  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">{title}</h3>
        <button
          type="button"
          onClick={onOpenAdd}
          className={`flex items-center gap-1.5 text-white text-xs font-semibold px-3 py-1.5 rounded-[10px] transition-colors shadow-sm ${themeColor}`}
        >
          <Plus size={13} aria-hidden="true" />
          {createBtnLabel}
        </button>
      </div>

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
                className={`inline-flex items-center gap-2 text-white text-sm font-semibold px-5 py-2.5 rounded-[14px] transition-colors shadow-sm ${themeColor}`}
              >
                <Plus size={15} aria-hidden="true" />
                {createBtnLabel}
              </button>
            }
          />
        </div>
      ) : (
        <div className="divide-y divide-slate-100 dark:divide-slate-700/50" role="list">
          {children}
        </div>
      )}
    </div>
  );
});

export default AssetRegistryContainer;
