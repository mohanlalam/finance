import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Search, X, TrendingUp, Landmark, Coins, Home as HomeIcon, Shield, FolderOpen } from 'lucide-react';
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
  stock: <TrendingUp size={12} className="text-blue-500" />,
  fd: <Landmark size={12} className="text-indigo-500" />,
  gold: <Coins size={12} className="text-amber-500" />,
  real_estate: <HomeIcon size={12} className="text-emerald-500" />,
  insurance: <Shield size={12} className="text-rose-500" />,
  document: <FolderOpen size={12} className="text-slate-500 dark:text-slate-400" />,
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

function SearchBar({ portfolios, onNavigate }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
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
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return allResults
      .filter((r) => r.label.toLowerCase().includes(q) || r.sublabel.toLowerCase().includes(q))
      .slice(0, 20);
  }, [query, allResults]);

  // Group by type
  const grouped = useMemo(() => {
    const map = new Map<string, SearchResult[]>();
    for (const r of filtered) {
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
        inputRef.current?.focus();
      }
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  // Click outside to close
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  function handleSelect(result: SearchResult) {
    onNavigate(result.portfolioName, ASSET_TAB_MAP[result.type] ?? 'stocks');
    setQuery('');
    setOpen(false);
    inputRef.current?.blur();
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') {
      setQuery('');
      setOpen(false);
      inputRef.current?.blur();
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

  const showResults = open && filtered.length > 0;

  return (
    <div ref={containerRef} className="relative">
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
          onFocus={() => { if (query.trim()) setOpen(true); }}
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

      {showResults && (
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

      {open && query.trim() && filtered.length === 0 && (
        <div className="absolute top-full mt-1 left-0 right-0 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-50 p-4 text-center">
          <p className="text-xs text-slate-400 dark:text-slate-500">No results for "{query}"</p>
        </div>
      )}
    </div>
  );
}

export default React.memo(SearchBar);
