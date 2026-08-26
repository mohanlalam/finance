import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Search, X, TrendingUp, Landmark, Coins, Home as HomeIcon, Shield, FolderOpen, ArrowLeft } from './icons/AppIcons';
import { Portfolio } from '../types/portfolio';
import { useIsMobile } from '../hooks/useIsMobile';

interface SearchResult {
  type: 'stock' | 'fd' | 'gold' | 'real_estate' | 'insurance' | 'document';
  label: string;
  sublabel: string;
  portfolioName: string;
  portfolioLabel: string;
}

interface SearchBarProps {
  portfolios: Portfolio[];
  onNavigate: (portfolioName: string, assetTab: string) => void;
}

const TYPE_ICONS: Record<string, React.ReactNode> = {
  stock: <TrendingUp size={16} className="text-blue-500" />,
  fd: <Landmark size={16} className="text-indigo-500" />,
  gold: <Coins size={16} className="text-amber-500" />,
  real_estate: <HomeIcon size={16} className="text-emerald-500" />,
  insurance: <Shield size={16} className="text-rose-500" />,
  document: <FolderOpen size={16} className="text-slate-500 dark:text-slate-400" />,
};

const TYPE_LABELS: Record<string, string> = {
  stock: 'Stocks',
  fd: 'Fixed Deposits',
  gold: 'Gold',
  real_estate: 'Real Estate',
  insurance: 'Insurance',
  document: 'Documents',
};

const ASSET_TAB_MAP: Record<string, string> = {
  stock: 'stocks',
  fd: 'fd',
  gold: 'gold',
  real_estate: 'real_estate',
  insurance: 'insurance',
  document: 'documents',
};

type SearchFilter = 'all' | 'stock' | 'fd' | 'gold' | 'real_estate' | 'insurance' | 'document';

function SearchBar({ portfolios, onNavigate }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<SearchFilter>('all');
  const [selectedIdx, setSelectedIdx] = useState(-1);
  const isMobile = useIsMobile();

  const inputRef = useRef<HTMLInputElement>(null);
  const mobileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Build full index
  const allResults = useMemo<SearchResult[]>(() => {
    const results: SearchResult[] = [];
    for (const p of portfolios) {
      for (const h of p.holdings) {
        results.push({ type: 'stock', label: h.ticker, sublabel: h.stockName, portfolioName: p.name, portfolioLabel: p.label });
      }
      for (const f of p.fixedDeposits) {
        results.push({ type: 'fd', label: f.bank_name, sublabel: `₹${Number(f.principal_amount).toLocaleString('en-IN')} · ${f.interest_rate}%`, portfolioName: p.name, portfolioLabel: p.label });
      }
      for (const g of p.goldHoldings) {
        results.push({ type: 'gold', label: g.item_name, sublabel: `${g.weight_grams}g · ${g.purity}`, portfolioName: p.name, portfolioLabel: p.label });
      }
      for (const r of p.realEstate) {
        results.push({ type: 'real_estate', label: r.property_name, sublabel: r.location || r.property_type, portfolioName: p.name, portfolioLabel: p.label });
      }
      for (const i of p.insurances) {
        results.push({ type: 'insurance', label: i.policy_name, sublabel: `${i.provider} · ${i.insurance_type}`, portfolioName: p.name, portfolioLabel: p.label });
      }
      for (const d of p.documents) {
        results.push({ type: 'document', label: d.name, sublabel: d.asset_type, portfolioName: p.name, portfolioLabel: p.label });
      }
    }
    return results;
  }, [portfolios]);

  const filtered = useMemo(() => {
    let list = allResults;
    if (activeFilter !== 'all') {
      list = list.filter((r) => r.type === activeFilter);
    }
    if (!query.trim()) {
      return activeFilter === 'all' ? [] : list;
    }
    const q = query.toLowerCase();
    return list.filter((r) => r.label.toLowerCase().includes(q) || r.sublabel.toLowerCase().includes(q));
  }, [query, allResults, activeFilter]);

  // Group by type
  const grouped = useMemo(() => {
    const map = new Map<string, SearchResult[]>();
    for (const r of filtered.slice(0, 30)) {
      if (!map.has(r.type)) map.set(r.type, []);
      map.get(r.type)!.push(r);
    }
    return map;
  }, [filtered]);

  // Keyboard shortcut: "/" to focus
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === '/' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault();
        if (isMobile) {
          setOpen(true);
          setTimeout(() => mobileInputRef.current?.focus(), 100);
        } else {
          inputRef.current?.focus();
        }
      }
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isMobile]);

  // Click outside to close (desktop only)
  useEffect(() => {
    if (!open || isMobile) return;
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open, isMobile]);

  function handleSelect(result: SearchResult) {
    onNavigate(result.portfolioName, ASSET_TAB_MAP[result.type] ?? 'stocks');
    setQuery('');
    setOpen(false);
    setActiveFilter('all');
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') {
      setQuery('');
      setOpen(false);
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIdx((prev) => Math.min(prev + 1, filtered.length - 1));
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIdx((prev) => Math.max(prev - 1, 0));
    }
    if (e.key === 'Enter' && selectedIdx >= 0 && selectedIdx < filtered.length) {
      handleSelect(filtered[selectedIdx]);
    }
  }

  const handleMobileFocus = () => {
    setOpen(true);
    setSelectedIdx(-1);
    setTimeout(() => mobileInputRef.current?.focus(), 100);
  };

  const handleMobileClose = () => {
    setQuery('');
    setOpen(false);
    setActiveFilter('all');
  };

  // --- Render Mobile Full Screen Search ---
  if (isMobile && open) {
    const filterTabs: { key: SearchFilter; label: string }[] = [
      { key: 'all', label: 'All' },
      { key: 'stock', label: 'Stocks' },
      { key: 'fd', label: 'FDs' },
      { key: 'gold', label: 'Gold' },
      { key: 'real_estate', label: 'Realty' },
      { key: 'insurance', label: 'Insurance' },
      { key: 'document', label: 'Docs' },
    ];

    return (
      <div className="fixed inset-0 bg-[var(--backdrop-overlay)] z-50 flex flex-col md:hidden animate-fade-in">
        <div className="flex-1 bg-[var(--surface)] flex flex-col overflow-hidden pb-safe pt-safe">
          {/* Mobile Search Header */}
          <div className="px-4 py-3 border-b border-[var(--border-subtle)] flex items-center gap-3 bg-[var(--surface)]">
            <button
              onClick={handleMobileClose}
              aria-label="Back to dashboard"
              className="w-10 h-10 flex items-center justify-center rounded-[var(--radius-medium)] text-[var(--text-secondary)] hover:bg-[var(--surface-secondary)] hover:text-[var(--text-primary)] ios-press transition-colors shrink-0"
            >
              <ArrowLeft size={20} aria-hidden="true" />
            </button>
            <div className="flex-1 relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" aria-hidden="true" />
              <input
                ref={mobileInputRef}
                type="text"
                value={query}
                onChange={(e) => { setQuery(e.target.value); setSelectedIdx(-1); }}
                placeholder="Search holdings, policies, files..."
                className="w-full bg-[var(--surface-secondary)] border border-[var(--border-subtle)] rounded-[var(--radius-medium)] pl-9 pr-9 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-blue)]/30"
              />
              {query && (
                <button
                  onClick={() => setQuery('')}
                  aria-label="Clear query"
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 w-11 h-11 min-w-[44px] min-h-[44px] sm:w-8 sm:h-8 flex items-center justify-center text-[var(--text-tertiary)] hover:text-[var(--text-primary)] rounded-[var(--radius-pill)] hover:bg-[var(--surface-secondary)] ios-press touch-manipulation cursor-pointer"
                >
                  <X size={16} aria-hidden="true" />
                </button>
              )}
            </div>
          </div>

          {/* Quick-Jump Category Filters Scroll Row */}
          <div className="px-4 py-2 bg-[var(--surface-secondary)] border-b border-[var(--border-subtle)] flex gap-1.5 overflow-x-auto scrollbar-none shrink-0" role="tablist" aria-label="Filters">
            {filterTabs.map((tab) => {
              const isActive = activeFilter === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => { setActiveFilter(tab.key); setSelectedIdx(-1); }}
                  role="tab"
                  aria-selected={isActive}
                  className={`px-3.5 py-2 min-h-[44px] rounded-[var(--radius-pill)] text-xs font-bold transition-all shrink-0 ios-press touch-manipulation flex items-center justify-center ${
                    isActive
                      ? 'bg-[var(--accent-blue)] text-[var(--surface)] shadow-xs'
                      : 'bg-[var(--surface-secondary)] text-[var(--text-secondary)] border border-[var(--border-subtle)]'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Results Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* If query and filter are empty, show helpful Category cards */}
            {!query.trim() && activeFilter === 'all' && (
              <div className="space-y-4">
                <p className="text-xs font-extrabold text-[var(--text-tertiary)] uppercase tracking-wider">Browse by Category</p>
                <div className="grid grid-cols-2 gap-2.5">
                  {(Object.keys(TYPE_LABELS) as Array<keyof typeof TYPE_LABELS>).map((type) => (
                    <button
                      key={type}
                      onClick={() => setActiveFilter(type as SearchFilter)}
                      className="flex items-center gap-3 p-3 bg-[var(--surface)] hover:bg-[var(--surface-secondary)] border border-[var(--border-subtle)] rounded-[var(--radius-large)] text-left transition-all ios-press apple-card"
                    >
                      <div className="w-8 h-8 rounded-[var(--radius-small)] bg-[var(--surface-secondary)] shadow-xs flex items-center justify-center shrink-0">
                        {TYPE_ICONS[type]}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-[var(--text-primary)]">{TYPE_LABELS[type]}</p>
                        <p className="text-[11px] text-[var(--text-tertiary)] mt-0.5">
                          {allResults.filter((r) => r.type === type).length} item(s)
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {filtered.length > 0 ? (
              <div className="space-y-3 pb-8" role="listbox" aria-label="Search results">
                {Array.from(grouped.entries()).map(([type, items]) => (
                  <div key={type} className="space-y-2">
                    <div className="text-xs font-extrabold text-[var(--text-tertiary)] uppercase tracking-wider flex items-center gap-1.5 pt-1">
                      {TYPE_ICONS[type]}
                      {TYPE_LABELS[type]}
                    </div>
                    <div className="space-y-1.5">
                      {items.map((item, idx) => (
                        <button
                          key={`${type}-${idx}`}
                          onClick={() => handleSelect(item)}
                          role="option"
                          aria-selected={false}
                          className="w-full text-left p-3.5 bg-[var(--surface)] hover:bg-[var(--surface-secondary)] border border-[var(--border-subtle)] rounded-[var(--radius-large)] flex items-center justify-between gap-3 transition-colors ios-press apple-card"
                        >
                          <div className="min-w-0">
                            <p className="text-xs font-extrabold text-[var(--text-primary)] truncate">{item.label}</p>
                            <p className="text-[11px] font-medium text-[var(--text-tertiary)] truncate mt-0.5">{item.sublabel}</p>
                          </div>
                          <span className="text-[10px] font-bold uppercase bg-[var(--surface-secondary)] text-[var(--text-secondary)] px-2 py-0.5 rounded-[var(--radius-small)] border border-[var(--border-subtle)] shrink-0">
                            {item.portfolioLabel}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              // Empty search state
              (query.trim() || activeFilter !== 'all') && (
                <div className="py-16 text-center">
                  <div className="w-12 h-12 rounded-[var(--radius-medium)] bg-[var(--surface-secondary)] text-[var(--text-tertiary)] flex items-center justify-center mx-auto mb-3 border border-[var(--border-subtle)]">
                    <Search size={20} aria-hidden="true" />
                  </div>
                  <h4 className="text-xs font-bold text-[var(--text-secondary)]">No results found</h4>
                  <p className="text-[11px] text-[var(--text-tertiary)] max-w-[220px] mx-auto mt-1">
                    Try checking spelling or choosing a different filter.
                  </p>
                </div>
              )
            )}
          </div>
        </div>
      </div>
    );
  }

  // --- Render Desktop / Default Search ---
  const showResults = open && filtered.length > 0;

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" aria-hidden="true" />
        <input
          ref={inputRef}
          type="text"
          role="combobox"
          aria-expanded={showResults}
          aria-controls="search-results"
          aria-activedescendant={selectedIdx >= 0 ? `search-result-${selectedIdx}` : undefined}
          aria-autocomplete="list"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); setSelectedIdx(-1); }}
          onFocus={() => {
            if (isMobile) {
              handleMobileFocus();
            } else {
              setOpen(true);
            }
          }}
          onKeyDown={handleKeyDown}
          placeholder='Search stocks, FDs, insurance, documents...  Press "/" to focus'
          className="w-full bg-[var(--surface)] dark:bg-[var(--surface)] border border-[var(--border-subtle)] rounded-[var(--radius-large)] pl-9 pr-9 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-blue)]/30 focus:border-[var(--accent-blue)] transition-all apple-card"
        />
        {query && (
          <button
            onClick={() => { setQuery(''); setOpen(false); }}
            aria-label="Clear search"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors p-0.5 rounded-[var(--radius-pill)] hover:bg-[var(--surface-secondary)] ios-press"
          >
            <X size={14} aria-hidden="true" />
          </button>
        )}
      </div>

      {showResults && !isMobile && (
        <div
          id="search-results"
          role="listbox"
          className="absolute top-full mt-1 left-0 right-0 bg-[var(--surface)] border border-[var(--border-subtle)] rounded-[var(--radius-medium)] shadow-xl z-50 max-h-80 overflow-y-auto apple-card"
        >
          {Array.from(grouped.entries()).map(([type, items]) => (
            <div key={type}>
              <div className="px-3 py-1.5 bg-[var(--surface-secondary)] text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-widest flex items-center gap-1.5 sticky top-0 border-b border-[var(--border-subtle)]">
                {TYPE_ICONS[type]}
                {TYPE_LABELS[type]}
              </div>
              {items.map((r, i) => {
                const flatIdx = filtered.indexOf(r);
                return (
                  <button
                    key={`${type}-${i}`}
                    id={`search-result-${flatIdx}`}
                    role="option"
                    aria-selected={flatIdx === selectedIdx}
                    onClick={() => handleSelect(r)}
                    className={`w-full text-left px-3 py-2 flex items-center gap-2 hover:bg-[var(--surface-secondary)] transition-colors ${
                      flatIdx === selectedIdx ? 'bg-[var(--accent-blue-soft)] font-semibold' : ''
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-[var(--text-primary)] truncate">{r.label}</p>
                      <p className="text-xs text-[var(--text-tertiary)] truncate">{r.sublabel}</p>
                    </div>
                    <span className="text-[10px] bg-[var(--surface-secondary)] text-[var(--text-secondary)] px-1.5 py-0.5 rounded-[var(--radius-small)] border border-[var(--border-subtle)] font-medium shrink-0">
                      {r.portfolioLabel}
                    </span>
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      )}

      {open && query.trim() && filtered.length === 0 && !isMobile && (
        <div className="absolute top-full mt-1 left-0 right-0 bg-[var(--surface)] border border-[var(--border-subtle)] rounded-[var(--radius-medium)] shadow-xl z-50 p-4 text-center apple-card animate-fade-in">
          <p className="text-xs text-[var(--text-tertiary)]">No results for "{query}"</p>
        </div>
      )}
    </div>
  );
}

export default React.memo(SearchBar);
