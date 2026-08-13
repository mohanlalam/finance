import { useState, useMemo } from 'react';

export type SortField = 'name' | 'value' | 'date';
export type SortOrder = 'asc' | 'desc';

export interface FilterSortConfig<T> {
  searchFields?: (item: T) => (string | null | undefined)[];
  getValue?: (item: T) => number;
  getDate?: (item: T) => string | null | undefined;
  getName?: (item: T) => string;
}

export function useAssetFilterSort<T>(items: T[], config: FilterSortConfig<T> = {}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortField>('value');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  const filteredAndSortedItems = useMemo(() => {
    let result = [...items];

    // 1. Search filter
    if (searchQuery.trim() && config.searchFields) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((item) =>
        config.searchFields!(item).some((field) => field?.toLowerCase().includes(q))
      );
    }

    // 2. Sorting
    result.sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'value' && config.getValue) {
        comparison = config.getValue(a) - config.getValue(b);
      } else if (sortBy === 'date' && config.getDate) {
        const dA = config.getDate(a) ? new Date(config.getDate(a)!).getTime() : 0;
        const dB = config.getDate(b) ? new Date(config.getDate(b)!).getTime() : 0;
        comparison = dA - dB;
      } else if (sortBy === 'name' && config.getName) {
        comparison = config.getName(a).localeCompare(config.getName(b));
      }
      return sortOrder === 'desc' ? -comparison : comparison;
    });

    return result;
  }, [items, searchQuery, sortBy, sortOrder, config]);

  return {
    searchQuery,
    setSearchQuery,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
    filteredAndSortedItems,
  };
}

export default useAssetFilterSort;
