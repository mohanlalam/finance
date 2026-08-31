import { useState, useMemo, useCallback } from 'react';

export type SortOrder = 'asc' | 'desc';

export interface UseAssetFilterSortOptions<T, F extends string = string> {
  searchFields?: (keyof T | ((item: T) => string))[];
  initialSortField?: F;
  initialSortOrder?: SortOrder;
  sortComparators?: { [K in F]?: (a: T, b: T) => number };
  customFilter?: (item: T, search: string) => boolean;
}

export interface UseAssetFilterSortResult<T, F extends string = string> {
  items: T[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  sortField: F | undefined;
  setSortField: (field: F) => void;
  sortOrder: SortOrder;
  setSortOrder: (order: SortOrder) => void;
  toggleSort: (field: F) => void;
  filteredCount: number;
  totalCount: number;
}

/**
 * Standardized client-side filtering and multi-field sorting hook for asset registries.
 */
export function useAssetFilterSort<T, F extends string = string>(
  rawItems: T[],
  options: UseAssetFilterSortOptions<T, F> = {}
): UseAssetFilterSortResult<T, F> {
  const {
    searchFields = [],
    initialSortField,
    initialSortOrder = 'desc',
    sortComparators,
    customFilter,
  } = options;

  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<F | undefined>(initialSortField);
  const [sortOrder, setSortOrder] = useState<SortOrder>(initialSortOrder);

  const toggleSort = useCallback((field: F) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  }, [sortField]);

  const items = useMemo(() => {
    let result = Array.isArray(rawItems) ? [...rawItems] : [];
    const query = searchQuery.trim().toLowerCase();

    // 1. Filtering
    if (query) {
      if (customFilter) {
        result = result.filter((item) => customFilter(item, query));
      } else if (searchFields.length > 0) {
        result = result.filter((item) => {
          return searchFields.some((field) => {
            if (typeof field === 'function') {
              const val = field(item);
              return typeof val === 'string' && val.toLowerCase().includes(query);
            }
            const val = item[field];
            if (typeof val === 'string') {
              return val.toLowerCase().includes(query);
            }
            if (typeof val === 'number') {
              return String(val).includes(query);
            }
            return false;
          });
        });
      }
    }

    // 2. Sorting
    if (sortField && sortComparators) {
      const comparator = sortComparators[sortField];
      if (typeof comparator === 'function') {
        result.sort((a, b) => {
          const cmp = comparator(a, b);
          return sortOrder === 'asc' ? cmp : -cmp;
        });
      }
    }

    return result;
  }, [rawItems, searchQuery, sortField, sortOrder, searchFields, sortComparators, customFilter]);

  return {
    items,
    searchQuery,
    setSearchQuery,
    sortField,
    setSortField,
    sortOrder,
    setSortOrder,
    toggleSort,
    filteredCount: items.length,
    totalCount: rawItems?.length ?? 0,
  };
}
