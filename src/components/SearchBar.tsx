import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Search, X, TrendingUp, Landmark, Coins, Home as HomeIcon, Shield, FolderOpen, ArrowLeft } from './icons/AppIcons';
import { Portfolio } from '../types/portfolio';

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
  const [isMobile, setIsMobile] = useState(() => window.matchMedia('(max-width: 767px)').matches);

  const inputRef = useRef<HTMLInputElement>(null);
  const mobileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mql = window.matchMedia('(max-width: 767px)');
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);

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
    function handleClick(e: MouseEvent) {
      if (!isMobile && containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [isMobile]);

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
      <div className="fixed inset-0 bg-slate-900/50 dark:bg-slate-950/80 backdrop-blur-sm z-50 flex flex-col md:hidden animate-fade-in">
        <div className="flex-1 bg-white dark:bg-slate-900 flex flex-col overflow-hidden pb-safe">
          {/* Mobile Search Header */}
          <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
            <button
              onClick={handleMobileClose}
              aria-label="Back to dashboard"
              className="p-1 rounded-lg text-slate-400 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              <ArrowLeft size={20} />
            </button>
            <div className="flex-1 relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
              <input
                ref={mobileInputRef}
                type="text"
                value={query}
                onChange={(e) => { setQuery(e.target.value); setSelectedIdx(-1); }}
                placeholder="Search holdings, policies, files..."
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 rounded-xl pl-9 pr-9 py-2.5 text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              />
              {query && (
                <button
                  onClick={() => setQuery('')}
                  aria-label="Clear query"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          </div>

          {/* Quick-Jump Category Filters Scroll Row */}
          <div className="px-4 py-2 bg-slate-50/50 dark:bg-slate-900/30 border-b border-slate-100 dark:border-slate-800/60 flex gap-1.5 overflow-x-auto scrollbar-none shrink-0">
            {filterTabs.map((tab) => {
              const isActive = activeFilter === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => { setActiveFilter(tab.key); setSelectedIdx(-1); }}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
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
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Browse by Category</p>
                <div className="grid grid-cols-2 gap-2.5">
                  {(Object.keys(TYPE_LABELS) as Array<keyof typeof TYPE_LABELS>).map((type) => (
                    <button
                      key={type}
                      onClick={() => setActiveFilter(type as SearchFilter)}
                      className="flex items-center gap-3 p-3 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/50 dark:hover:bg-slate-800 border border-slate-100 dark:border-slate-700/30 rounded-2xl text-left transition-all active:scale-95"
                    >
                      <div className="w-8 h-8 rounded-lg bg-white dark:bg-slate-900 shadow-3xs flex items-center justify-center shrink-0">
                        {TYPE_ICONS[type]}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{TYPE_LABELS[type]}</p>
                        <p className="text-[9px] text-slate-400 mt-0.5">
                          {allResults.filter((r) => r.type === type).length} item(s)
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {filtered.length > 0 ? (
              <div className="space-y-3 pb-8">
                {Array.from(grouped.entries()).map(([type, items]) => (
                  <div key={type} className="space-y-2">
                    <div className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-1.5 pt-1">
                      {TYPE_ICONS[type]}
                      {TYPE_LABELS[type]}
                    </div>
                    <div className="space-y-1.5">
                      {items.map((item, idx) => (
                        <button
                          key={`${type}-${idx}`}
                          onClick={() => handleSelect(item)}
                          className="w-full text-left p-3.5 bg-white dark:bg-slate-800 hover:bg-blue-50/50 dark:hover:bg-blue-950/20 border border-slate-200/40 dark:border-slate-800/80 rounded-2xl flex items-center justify-between gap-3 transition-colors active:scale-[0.99]"
                        >
                          <div className="min-w-0">
                            <p className="text-xs font-extrabold text-slate-800 dark:text-slate-250 truncate">{item.label}</p>
                            <p className="text-[10px] font-medium text-slate-400 dark:text-slate-400 truncate mt-0.5">{item.sublabel}</p>
                          </div>
                          <span className="text-[9px] font-bold uppercase bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300 px-2 py-0.5 rounded-md shrink-0">
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
                  <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 flex items-center justify-center mx-auto mb-3 shadow-3xs">
                    <Search size={24} />
                  </div>
                  <h4 className="text-xs font-bold text-slate-600 dark:text-slate-300">No results found</h4>
                  <p className="text-[10px] text-slate-400 dark:text-slate-550 max-w-[200px] mx-auto mt-1">
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
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
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
          className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-9 py-2.5 text-sm text-slate-700 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all"
        />
        {query && (
          <button
            onClick={() => { setQuery(''); setOpen(false); }}
            aria-label="Clear search"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {showResults && !isMobile && (
        <div
          id="search-results"
          role="listbox"
          className="absolute top-full mt-1 left-0 right-0 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-50 max-h-80 overflow-y-auto"
        >
          {Array.from(grouped.entries()).map(([type, items]) => (
            <div key={type}>
              <div className="px-3 py-1.5 bg-slate-50 dark:bg-slate-900 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-1.5 sticky top-0">
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
                    className={`w-full text-left px-3 py-2 flex items-center gap-2 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors ${
                      flatIdx === selectedIdx ? 'bg-blue-50 dark:bg-blue-900/30' : ''
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-slate-700 dark:text-slate-200 truncate">{r.label}</p>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate">{r.sublabel}</p>
                    </div>
                    <span className="text-[10px] bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 px-1.5 py-0.5 rounded-md font-medium shrink-0">
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
        <div className="absolute top-full mt-1 left-0 right-0 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-50 p-4 text-center">
          <p className="text-xs text-slate-400 dark:text-slate-500">No results for "{query}"</p>
        </div>
      )}
    </div>
  );
}

export default React.memo(SearchBar);
