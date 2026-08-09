import React, { useState, useEffect, useRef } from 'react';
import { Plus, TrendingUp, Landmark, Coins, Building2, Shield, FolderOpen, Clock, X } from './icons/AppIcons';

interface FloatingAddMenuProps {
  onAddStock: () => void;
  onAddAsset: (type: 'fd' | 'rd' | 'sip' | 'gold' | 'real_estate' | 'insurance' | 'documents') => void;
  isHidden?: boolean;
}

export default function FloatingAddMenu({ onAddStock, onAddAsset, isHidden = false }: FloatingAddMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const fabButtonRef = useRef<HTMLButtonElement>(null);

  // Close & restore focus on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
        fabButtonRef.current?.focus();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  if (isHidden) return null;

  const menuGroups = [
    {
      category: 'Market',
      items: [
        { label: 'Stock / ETF', icon: <TrendingUp size={16} />, onClick: () => { onAddStock(); setIsOpen(false); }, color: 'bg-blue-600 text-white' },
        { label: 'SIP Mutual Fund', icon: <TrendingUp size={16} />, onClick: () => { onAddAsset('sip'); setIsOpen(false); }, color: 'bg-sky-600 text-white' },
        { label: 'Gold Holding', icon: <Coins size={16} />, onClick: () => { onAddAsset('gold'); setIsOpen(false); }, color: 'bg-amber-600 text-white' },
      ],
    },
    {
      category: 'Deposits',
      items: [
        { label: 'Fixed Deposit', icon: <Landmark size={16} />, onClick: () => { onAddAsset('fd'); setIsOpen(false); }, color: 'bg-indigo-600 text-white' },
        { label: 'Recurring Deposit', icon: <Clock size={16} />, onClick: () => { onAddAsset('rd'); setIsOpen(false); }, color: 'bg-pink-600 text-white' },
      ],
    },
    {
      category: 'Property',
      items: [
        { label: 'Real Estate Property', icon: <Building2 size={16} />, onClick: () => { onAddAsset('real_estate'); setIsOpen(false); }, color: 'bg-emerald-600 text-white' },
      ],
    },
    {
      category: 'Protection',
      items: [
        { label: 'Insurance Policy', icon: <Shield size={16} />, onClick: () => { onAddAsset('insurance'); setIsOpen(false); }, color: 'bg-rose-600 text-white' },
      ],
    },
    {
      category: 'Documents',
      items: [
        { label: 'Upload Document', icon: <FolderOpen size={16} />, onClick: () => { onAddAsset('documents'); setIsOpen(false); }, color: 'bg-slate-600 text-white' },
      ],
    },
  ];

  return (
    <div className="md:hidden">
      {/* Backdrop */}
      {isOpen && (
        <div
          onClick={() => {
            setIsOpen(false);
            fabButtonRef.current?.focus();
          }}
          className="fixed inset-0 bg-black/40 z-40 transition-opacity duration-200"
          aria-hidden="true"
        />
      )}

      {/* Floating Menu Container with Safe Area Spacing */}
      <div className="fixed bottom-[calc(4.5rem+env(safe-area-inset-bottom,0px))] right-[calc(1rem+env(safe-area-inset-right,0px))] z-50 flex flex-col items-end gap-3 pointer-events-none">
        {/* Categorized Quick-Add Card */}
        {isOpen && (
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Quick Add Asset Menu"
            className="pointer-events-auto w-72 max-h-[65vh] overflow-y-auto bg-white dark:bg-slate-900 border border-[var(--border-subtle)] rounded-xl shadow-xl p-3 mb-2 space-y-3"
          >
            <div className="flex items-center justify-between pb-2 border-b border-[var(--border-subtle)]">
              <span className="text-xs font-extrabold text-[var(--text-secondary)] uppercase tracking-wider">
                Quick Add Asset
              </span>
              <button
                onClick={() => {
                  setIsOpen(false);
                  fabButtonRef.current?.focus();
                }}
                className="w-8 h-8 flex items-center justify-center rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                aria-label="Close add menu"
              >
                <X size={16} />
              </button>
            </div>

            {menuGroups.map((group) => (
              <div key={group.category} className="space-y-1">
                <span className="px-2 text-[10px] font-extrabold uppercase tracking-wider text-[var(--text-tertiary)] block">
                  {group.category}
                </span>
                {group.items.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      item.onClick();
                      fabButtonRef.current?.focus();
                    }}
                    className="w-full flex items-center gap-3 px-2.5 py-2 min-h-[44px] rounded-lg text-xs font-bold text-[var(--text-primary)] hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left outline-none"
                  >
                    <div className={`w-7 h-7 rounded-md ${item.color} flex items-center justify-center shrink-0`}>
                      {item.icon}
                    </div>
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            ))}
          </div>
        )}

        {/* Primary FAB Button (Min 44x44 Touch Target) */}
        <button
          ref={fabButtonRef}
          onClick={() => setIsOpen(!isOpen)}
          aria-label={isOpen ? 'Close quick add menu' : 'Open quick add menu'}
          aria-expanded={isOpen}
          className="pointer-events-auto min-w-[48px] min-h-[48px] w-12 h-12 rounded-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center shadow-lg active:scale-95 transition-all outline-none"
        >
          <Plus
            size={22}
            className={`transition-transform duration-200 ${isOpen ? 'rotate-135' : ''}`}
          />
        </button>
      </div>
    </div>
  );
}
