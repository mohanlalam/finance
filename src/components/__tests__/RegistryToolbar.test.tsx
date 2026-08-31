// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { RegistryToolbar } from '../ui/RegistryToolbar';

describe('RegistryToolbar', () => {
  it('renders search input and triggers onSearchChange', () => {
    const handleSearch = vi.fn();
    render(
      <RegistryToolbar
        searchQuery=""
        onSearchChange={handleSearch}
        searchPlaceholder="Filter assets..."
      />
    );

    const input = screen.getByPlaceholderText('Filter assets...');
    expect(input).toBeDefined();

    fireEvent.change(input, { target: { value: 'HDFC' } });
    expect(handleSearch).toHaveBeenCalledWith('HDFC');
  });

  it('renders sort options and triggers onToggleSort', () => {
    const handleSort = vi.fn();
    render(
      <RegistryToolbar
        searchQuery=""
        onSearchChange={() => {}}
        sortOptions={[
          { field: 'amount', label: 'Amount' },
          { field: 'date', label: 'Date' },
        ]}
        currentSortField="amount"
        currentSortOrder="asc"
        onToggleSort={handleSort}
      />
    );

    const amountBtn = screen.getByTitle('Sort by Amount');
    fireEvent.click(amountBtn);
    expect(handleSort).toHaveBeenCalledWith('amount');
  });

  it('renders filter pills and calls onFilterChange', () => {
    const handleFilter = vi.fn();
    render(
      <RegistryToolbar
        searchQuery=""
        onSearchChange={() => {}}
        filterOptions={[
          { id: 'all', label: 'All', count: 10 },
          { id: 'active', label: 'Active', count: 7 },
        ]}
        activeFilter="all"
        onFilterChange={handleFilter}
      />
    );

    const activePill = screen.getByRole('tab', { name: /Active/i });
    fireEvent.click(activePill);
    expect(handleFilter).toHaveBeenCalledWith('active');
  });
});
