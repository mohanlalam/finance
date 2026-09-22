import React, { memo } from 'react';
import { Search, X } from '../icons/AppIcons';

export interface MetricHighlight {
  label: string;
  value: React.ReactNode;
  subValue?: React.ReactNode;
  isPositive?: boolean;
}

export interface MobileFilterOption {
  id: string;
  label: string;
  count?: number;
  badge?: React.ReactNode;
}

export interface MobileAssetRegistryProps {
  /** Category title, e.g. "Stocks & ETFs" */
  title: string;
  /** Primary question answering the screen's core purpose in plain language, e.g. "What are my holdings worth today?" */
  question?: string;
  /** Primary metric value answering the screen's core question, e.g. "₹18,50,000" */
  heroValue: React.ReactNode;
  /** Sub-caption or time indicator, e.g. "Aggregated equity across family" */
  heroSubtitle?: string;
  /** Prominent badge, e.g. "+1.8% Today" or "Next maturity in 18d" */
  primaryBadge?: React.ReactNode;
  /** Secondary supporting metric tiles inside hero (strictly capped at 2) */
  secondaryMetrics?: MetricHighlight[];
  /** Optional icon component */
  icon?: React.ReactNode;

  /** Segmented filter options (e.g. All / Rammohan / Padmavathi / Sai Laxmi) */
  filterOptions?: MobileFilterOption[];
  selectedFilter?: string;
  onSelectFilter?: (id: string) => void;

  /** Optional search bar configuration */
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (val: string) => void;

  /** Children rows */
  children: React.ReactNode;
  /** Optional empty state fallback */
  isEmpty?: boolean;
  emptyState?: React.ReactNode;
}

export const MobileAssetRegistry: React.FC<MobileAssetRegistryProps> = memo(({
  title,
  question,
  heroValue,
  heroSubtitle,
  primaryBadge,
  secondaryMetrics,
  icon,
  filterOptions,
  selectedFilter,
  onSelectFilter,
  searchPlaceholder,
  searchValue,
  onSearchChange,
  children,
  isEmpty = false,
  emptyState,
}) => {
  // Enforce strictly max 2 secondary metrics to preserve visual hierarchy
  const cappedMetrics = secondaryMetrics ? secondaryMetrics.slice(0, 2) : [];

  return (
    <div className="space-y-3 md:hidden">
      {/* ── 1. Hero Primary Question Card ── */}
      <div className="hero-networth-card rounded-[var(--radius-large)] p-3.5 space-y-2.5 shadow-xs">
        {/* Row 1: Title & Badge */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            {icon && (
              <div className="w-7 h-7 rounded-[var(--radius-small)] bg-[var(--surface-secondary)] text-[var(--accent-blue)] flex items-center justify-center shrink-0 border border-[var(--border-subtle)]">
                {icon}
              </div>
            )}
            <div className="min-w-0">
              <h2 className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider truncate">
                {title}
              </h2>
              {question ? (
                <p className="text-xs font-bold text-[var(--text-primary)] line-clamp-2 leading-tight">
                  {question}
                </p>
              ) : heroSubtitle ? (
                <p className="text-[10px] text-[var(--text-tertiary)] truncate">
                  {heroSubtitle}
                </p>
              ) : null}
            </div>
          </div>
          {primaryBadge && (
            <div className="shrink-0">
              {primaryBadge}
            </div>
          )}
        </div>

        {/* Row 2: Hero Value */}
        <div className="pt-0.5">
          <div className="text-2xl sm:text-3xl font-extrabold text-[var(--text-primary)] tnum tracking-tight leading-none">
            {heroValue}
          </div>
          {question && heroSubtitle && (
            <p className="text-[10px] text-[var(--text-tertiary)] font-medium mt-1 truncate">
              {heroSubtitle}
            </p>
          )}
        </div>

        {/* Row 3: Secondary Metrics Grid (Strictly capped at 2) */}
        {cappedMetrics.length > 0 && (
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[var(--border-subtle)]">
            {cappedMetrics.map((m, idx) => (
              <div key={idx} className="p-2 rounded-[var(--radius-medium)] bg-[var(--surface-secondary)]/70 border border-[var(--border-subtle)] min-w-0">
                <span className="text-[10px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider block truncate">
                  {m.label}
                </span>
                <span className="text-xs font-bold text-[var(--text-primary)] tnum block truncate mt-0.5">
                  {m.value}
                </span>
                {m.subValue && (
                  <span className={`text-[10px] font-semibold block truncate ${
                    m.isPositive === true ? 'text-[var(--positive)]' : m.isPositive === false ? 'text-[var(--negative)]' : 'text-[var(--text-tertiary)]'
                  }`}>
                    {m.subValue}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── 2. Segmented Member/Status Filter Bar ── */}
      {filterOptions && filterOptions.length > 0 && onSelectFilter && (
        <div 
          className="flex items-center gap-1.5 p-1 rounded-[var(--radius-medium)] bg-[var(--surface-secondary)] border border-[var(--border-subtle)] overflow-x-auto no-scrollbar scroll-smooth"
          role="tablist"
          aria-label="Filter options"
        >
          {filterOptions.map((opt) => {
            const isSelected = selectedFilter === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                role="tab"
                aria-selected={isSelected}
                onClick={() => onSelectFilter(opt.id)}
                className={`px-3 py-2 min-h-[44px] rounded-[var(--radius-small)] text-xs font-bold transition-all shrink-0 ios-press touch-manipulation cursor-pointer flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-[var(--surface)] text-[var(--accent-blue)] shadow-xs border border-[var(--border-subtle)]'
                    : 'text-[var(--text-tertiary)] hover:text-[var(--text-primary)]'
                }`}
              >
                <span>{opt.label}</span>
                {opt.count !== undefined && (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    isSelected
                      ? 'bg-[var(--accent-blue-soft)] text-[var(--accent-blue)]'
                      : 'bg-[var(--surface-tertiary)] text-[var(--text-tertiary)]'
                  }`}>
                    {opt.count}
                  </span>
                )}
                {opt.badge}
              </button>
            );
          })}
        </div>
      )}

      {/* ── 3. Touch-Friendly iOS Search Input ── */}
      {onSearchChange && (
        <div className="relative">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-[var(--text-tertiary)]">
            <Search size={15} />
          </div>
          <input
            type="text"
            value={searchValue || ''}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder || 'Search...'}
            className="w-full h-11 pl-9 pr-9 rounded-[var(--radius-medium)] bg-[var(--surface)] border border-[var(--border-subtle)] text-xs font-medium text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-blue)] transition-all shadow-xs"
          />
          {searchValue && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute inset-y-0 right-2.5 flex items-center text-[var(--text-tertiary)] hover:text-[var(--text-primary)] p-1 cursor-pointer"
              aria-label="Clear search"
            >
              <X size={14} />
            </button>
          )}
        </div>
      )}

      {/* ── 4. Clean List Container ── */}
      {isEmpty ? (
        emptyState || (
          <div className="p-8 text-center text-xs text-[var(--text-tertiary)] italic bg-[var(--surface)] border border-[var(--border-subtle)] rounded-[var(--radius-large)]">
            No items recorded.
          </div>
        )
      ) : (
        <div className="space-y-2">
          {children}
        </div>
      )}
    </div>
  );
});

MobileAssetRegistry.displayName = 'MobileAssetRegistry';
export default MobileAssetRegistry;
