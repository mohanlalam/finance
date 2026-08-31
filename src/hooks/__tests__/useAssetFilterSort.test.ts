// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAssetFilterSort } from '../useAssetFilterSort';

interface TestItem {
  id: string;
  name: string;
  amount: number;
}

const mockData: TestItem[] = [
  { id: '1', name: 'HDFC Deposit', amount: 50000 },
  { id: '2', name: 'SBI Fixed Deposit', amount: 100000 },
  { id: '3', name: 'ICICI RD', amount: 25000 },
];

describe('useAssetFilterSort', () => {
  it('initializes with raw items and no filter', () => {
    const { result } = renderHook(() =>
      useAssetFilterSort(mockData, {
        searchFields: ['name'],
      })
    );

    expect(result.current.items).toHaveLength(3);
    expect(result.current.searchQuery).toBe('');
    expect(result.current.filteredCount).toBe(3);
    expect(result.current.totalCount).toBe(3);
  });

  it('filters items correctly based on string search fields', () => {
    const { result } = renderHook(() =>
      useAssetFilterSort(mockData, {
        searchFields: ['name'],
      })
    );

    act(() => {
      result.current.setSearchQuery('hdfc');
    });

    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0].name).toBe('HDFC Deposit');
    expect(result.current.filteredCount).toBe(1);
  });

  it('sorts items using custom comparators and toggleSort', () => {
    const { result } = renderHook(() =>
      useAssetFilterSort(mockData, {
        initialSortField: 'amount',
        initialSortOrder: 'asc',
        sortComparators: {
          amount: (a, b) => a.amount - b.amount,
        },
      })
    );

    // ASC order
    expect(result.current.items[0].amount).toBe(25000);
    expect(result.current.items[2].amount).toBe(100000);

    // Toggle to DESC
    act(() => {
      result.current.toggleSort('amount');
    });

    expect(result.current.sortOrder).toBe('desc');
    expect(result.current.items[0].amount).toBe(100000);
    expect(result.current.items[2].amount).toBe(25000);
  });

  it('supports custom filter functions', () => {
    const { result } = renderHook(() =>
      useAssetFilterSort(mockData, {
        customFilter: (item, query) => item.amount >= Number(query),
      })
    );

    act(() => {
      result.current.setSearchQuery('50000');
    });

    expect(result.current.items).toHaveLength(2);
    expect(result.current.items.map((i) => i.id)).toEqual(['1', '2']);
  });

  it('supports debounced filtering when debounceMs is specified', () => {
    vi.useFakeTimers();

    const { result } = renderHook(() =>
      useAssetFilterSort(mockData, {
        searchFields: ['name'],
        debounceMs: 50,
      })
    );

    act(() => {
      result.current.setSearchQuery('ICICI');
    });

    // Before debounce timer finishes
    expect(result.current.searchQuery).toBe('ICICI');
    expect(result.current.items).toHaveLength(3);

    // Fast-forward debounce timer
    act(() => {
      vi.advanceTimersByTime(50);
    });

    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0].name).toBe('ICICI RD');

    vi.useRealTimers();
  });
});
