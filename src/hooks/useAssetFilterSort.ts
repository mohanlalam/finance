import { useState, useMemo, useRef, useEffect } from 'react';

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

  const configRef = useRef(config);
  useEffect(() => {
    configRef.current = config;
  });

  const filteredAndSortedItems = useMemo(() => {
    let result = [...items];
    const { searchFields, getValue, getDate, getName } = configRef.current;

    // 1. Search filter
    if (searchQuery.trim() && searchFields) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((item) =>
        searchFields(item).some((field) => field?.toLowerCase().includes(q))
      );
    }

    // 2. Sorting
    result.sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'value' && getValue) {
        comparison = (getValue(a) || 0) - (getValue(b) || 0);
      } else if (sortBy === 'date' && getDate) {
        const dA = getDate(a) || '';
        const dB = getDate(b) || '';
        comparison = dA.localeCompare(dB);
      } else if (sortBy === 'name' && getName) {
        const nA = getName(a) || '';
        const nB = getName(b) || '';
        comparison = nA.localeCompare(nB);
      }
      return sortOrder === 'desc' ? -comparison : comparison;
    });

    return result;
  }, [items, searchQuery, sortBy, sortOrder]);

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
