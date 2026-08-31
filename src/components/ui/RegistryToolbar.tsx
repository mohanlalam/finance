import React from 'react';
import { Search, X, ArrowUpDown, ArrowUp, ArrowDown } from '../icons/AppIcons';

export interface SortOption<F extends string = string> {
  field: F;
  label: string;
}

export interface FilterPillOption {
  id: string;
  label: string;
  count?: number;
}

export interface RegistryToolbarProps<F extends string = string> {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  searchPlaceholder?: string;
  sortOptions?: SortOption<F>[];
  currentSortField?: F;
  currentSortOrder?: 'asc' | 'desc';
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onToggleSort?: (field: any) => void;
  filterOptions?: FilterPillOption[];
  activeFilter?: string;
  onFilterChange?: (filterId: string) => void;
  filteredCount?: number;
  totalCount?: number;
}

export function RegistryToolbar<F extends string = string>({
  searchQuery,
  onSearchChange,
  searchPlaceholder = 'Search holdings...',
  sortOptions = [],
  currentSortField,
  currentSortOrder = 'desc',
  onToggleSort,
  filterOptions,
  activeFilter,
  onFilterChange,
  filteredCount,
  totalCount,
}: RegistryToolbarProps<F>) {
  const isFiltered = Boolean(searchQuery || (activeFilter && activeFilter !== 'all'));

  return (
    <div className="px-3.5 sm:px-5 py-2.5 flex flex-col md:flex-row md:items-center justify-between gap-2.5 border-b border-[var(--border-subtle)] bg-[var(--surface)]/90 backdrop-blur-sm">
      <div className="flex items-center gap-2 flex-1 min-w-0 flex-wrap">
        {/* Search Input */}
        <div className="relative flex items-center w-full sm:w-64 shrink-0">
          <Search size={13} className="absolute left-2.5 text-[var(--text-tertiary)] pointer-events-none" aria-hidden="true" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full pl-8 pr-7 py-1.5 text-xs rounded-[var(--radius-small)] bg-[var(--surface-secondary)] border border-[var(--border-subtle)] text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-blue)] focus:border-[var(--accent-blue)] transition-all"
            aria-label={searchPlaceholder}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute right-2 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors p-0.5"
              aria-label="Clear search"
            >
              <X size={12} aria-hidden="true" />
            </button>
          )}
        </div>

        {/* Filter Pills */}
        {filterOptions && filterOptions.length > 0 && onFilterChange && (
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5" role="tablist">
            {filterOptions.map((opt) => {
              const isActive = activeFilter === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => onFilterChange(opt.id)}
                  className={`flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-[var(--radius-pill)] border transition-all ios-press shrink-0 ${
                    isActive
                      ? 'bg-[var(--text-primary)] text-[var(--surface)] border-[var(--text-primary)] shadow-sm'
                      : 'bg-[var(--surface-secondary)] text-[var(--text-secondary)] border-[var(--border-subtle)] hover:border-[var(--text-tertiary)]'
                  }`}
                  role="tab"
                  aria-selected={isActive}
                >
                  <span>{opt.label}</span>
                  {opt.count !== undefined && (
                    <span className={`text-[9px] px-1 py-0.2 rounded-full ${isActive ? 'bg-[var(--surface)] text-[var(--text-primary)]' : 'bg-[var(--border-subtle)] text-[var(--text-tertiary)]'}`}>
                      {opt.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Sort Options & Count */}
      <div className="flex items-center justify-between md:justify-end gap-2 shrink-0 text-xs text-[var(--text-secondary)]">
        {isFiltered && totalCount !== undefined && filteredCount !== undefined && (
          <span className="text-[11px] text-[var(--text-tertiary)]">
            Showing <strong className="text-[var(--text-primary)]">{filteredCount}</strong> of {totalCount}
          </span>
        )}

        {sortOptions.length > 0 && onToggleSort && (
          <div className="flex items-center gap-1">
            <span className="text-[11px] text-[var(--text-tertiary)] font-medium hidden sm:inline">Sort:</span>
            <div className="flex items-center gap-1 bg-[var(--surface-secondary)] p-0.5 rounded-[var(--radius-small)] border border-[var(--border-subtle)]">
              {sortOptions.map((s) => {
                const isSelected = currentSortField === s.field;
                return (
                  <button
                    key={s.field}
                    type="button"
                    onClick={() => onToggleSort(s.field)}
                    className={`flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium rounded-[4px] transition-all ios-press ${
                      isSelected
                        ? 'bg-[var(--surface)] text-[var(--text-primary)] shadow-xs font-semibold'
                        : 'text-[var(--text-tertiary)] hover:text-[var(--text-primary)]'
                    }`}
                    title={`Sort by ${s.label}`}
                  >
                    <span>{s.label}</span>
                    {isSelected ? (
                      currentSortOrder === 'asc' ? (
                        <ArrowUp size={10} className="text-[var(--accent-blue)]" />
                      ) : (
                        <ArrowDown size={10} className="text-[var(--accent-blue)]" />
                      )
                    ) : (
                      <ArrowUpDown size={10} className="opacity-40" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default React.memo(RegistryToolbar);
