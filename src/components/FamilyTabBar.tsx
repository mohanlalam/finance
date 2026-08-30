import React, { useState, useRef, useEffect, useMemo } from 'react';
import { LayoutDashboard, Pencil, Trash2, UserPlus, User, Heart, Users, MoreVertical } from './icons/AppIcons';
import { Portfolio, PortfolioName } from '../types/portfolio';
import { formatPercent } from '../utils/formatters';
import { sortPortfolios } from '../domains/portfolio/calculations/portfolioOrdering';

interface FamilyTabBarProps {
  portfolios: Portfolio[];
  activeTab: PortfolioName;
  onTabChange: (tab: PortfolioName) => void;
  onAddFamilyClick: () => void;
  onRenameClick: (portfolio: { id: string; name: string; label: string }) => void;
  onDeleteClick: (portfolio: { id: string; name: string; label: string }) => void;
}

const familyIconConfigs: Record<string, { icon: React.ReactNode; bg: string; text: string }> = {
  personal: {
    icon: <User size={13} />,
    bg: 'bg-blue-500/15 dark:bg-blue-400/20',
    text: 'text-blue-600 dark:text-blue-400',
  },
  mother: {
    icon: <Heart size={13} />,
    bg: 'bg-rose-500/15 dark:bg-rose-400/20',
    text: 'text-rose-600 dark:text-rose-400',
  },
  wife: {
    icon: <Users size={13} />,
    bg: 'bg-purple-500/15 dark:bg-purple-400/20',
    text: 'text-purple-600 dark:text-purple-400',
  },
};

function getFamilyIconConfig(name: string) {
  return familyIconConfigs[name] ?? {
    icon: <User size={13} />,
    bg: 'bg-teal-500/15 dark:bg-teal-400/20',
    text: 'text-teal-600 dark:text-teal-400',
  };
}

export default React.memo(function FamilyTabBar({
  portfolios,
  activeTab,
  onTabChange,
  onAddFamilyClick,
  onRenameClick,
  onDeleteClick,
}: FamilyTabBarProps) {
  const sortedPortfolios = useMemo(() => sortPortfolios(portfolios), [portfolios]);
  const [menuTarget, setMenuTarget] = useState<{ id: string; name: string; label: string } | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuTarget) return;
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuTarget(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [menuTarget]);

  return (
    <div className="flex items-center justify-between gap-2 pb-1 relative w-full min-w-0">
      {/* Segmented Track: Horizontal scroll on mobile, flex on desktop */}
      <div
        role="tablist"
        aria-label="Family members portfolios"
        className="flex items-center gap-1.5 bg-[var(--surface-secondary)]/60 backdrop-blur-xl p-1.5 sm:p-1 rounded-[var(--radius-large)] sm:rounded-[var(--radius-medium)] border border-[var(--border-subtle)] w-full sm:w-auto shadow-[var(--shadow-card)] overflow-x-auto scrollbar-none"
      >
        {/* Overview Tab */}
        <button
          role="tab"
          aria-selected={activeTab === 'all'}
          aria-controls="portfolio-content"
          id="tab-all"
          onClick={() => {
            setMenuTarget(null);
            onTabChange('all');
          }}
          className={`flex items-center gap-2 h-9 sm:h-8 px-3 rounded-[var(--radius-small)] text-xs font-bold transition-all outline-none shrink-0 cursor-pointer ${
            activeTab === 'all'
              ? 'bg-[var(--surface)] text-[var(--text-primary)] shadow-[var(--shadow-card)] border border-[var(--border-luminous)] ring-1 ring-[var(--accent-blue)]/20'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-secondary)]/50'
          }`}
        >
          <div className="w-4 h-4 rounded bg-[var(--accent-blue-soft)] text-[var(--accent-blue)] flex items-center justify-center shrink-0">
            <LayoutDashboard size={12} />
          </div>
          <span className="whitespace-nowrap">Family Overview</span>
        </button>

        {/* Member Tabs */}
        {sortedPortfolios.map((p) => {
          const isActive = activeTab === p.name;
          const iconConfig = getFamilyIconConfig(p.name);
          const isPositive = p.totalPnL >= 0;
          const isMenuOpen = menuTarget?.id === p.id;

          return (
            <div key={p.name} role="presentation" className="relative group flex items-center shrink-0">
              <button
                role="tab"
                aria-selected={isActive}
                aria-controls="portfolio-content"
                id={`tab-${p.name}`}
                onClick={() => {
                  setMenuTarget(null);
                  onTabChange(p.name);
                }}
                className={`flex items-center gap-1.5 h-9 sm:h-8 pl-2.5 pr-1.5 rounded-[var(--radius-small)] text-xs font-bold transition-all outline-none cursor-pointer ${
                  isActive
                    ? 'bg-[var(--surface)] text-[var(--text-primary)] shadow-[var(--shadow-card)] border border-[var(--border-luminous)] ring-1 ring-[var(--accent-blue)]/20'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-secondary)]/50'
                }`}
              >
                {/* Styled icon badge */}
                <div className={`w-4 h-4 rounded ${iconConfig.bg} ${iconConfig.text} flex items-center justify-center shrink-0`}>
                  {iconConfig.icon}
                </div>

                <span className="whitespace-nowrap">{p.label}</span>

                {/* Return Percentage Badge */}
                <span
                  className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded tnum transition-colors shrink-0 ${
                    isPositive
                      ? 'bg-[var(--positive-soft)] text-[var(--positive)]'
                      : 'bg-[var(--negative-soft)] text-[var(--negative)]'
                  }`}
                >
                  {formatPercent(p.totalPnLPercent, 1)}
                </span>
              </button>

              {/* Mobile ellipsis menu button */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuTarget(isMenuOpen ? null : { id: p.id, name: p.name, label: p.label });
                }}
                className="sm:hidden w-7 h-9 flex items-center justify-center text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors px-1 shrink-0 touch-manipulation ios-press cursor-pointer"
                title={`Options for ${p.label}`}
                aria-label={`Options for portfolio ${p.label}`}
                aria-expanded={isMenuOpen}
              >
                <MoreVertical size={13} />
              </button>

              {/* Desktop action buttons (pencil, trash) displayed on hover */}
              <div className="hidden sm:flex items-center gap-0.5 ml-0.5 opacity-40 group-hover:opacity-100 transition-opacity duration-150 shrink-0">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRenameClick({ id: p.id, name: p.name, label: p.label });
                  }}
                  className="w-4 h-4 rounded flex items-center justify-center text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface)] transition-colors cursor-pointer"
                  title={`Rename ${p.label}`}
                  aria-label={`Rename portfolio ${p.label}`}
                >
                  <Pencil size={10} />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteClick({ id: p.id, name: p.name, label: p.label });
                  }}
                  className="w-4 h-4 rounded flex items-center justify-center text-[var(--text-tertiary)] hover:text-[var(--negative)] hover:bg-[var(--negative-soft)] transition-colors cursor-pointer"
                  title={`Delete ${p.label}`}
                  aria-label={`Delete portfolio ${p.label}`}
                >
                  <Trash2 size={10} />
                </button>
              </div>

              {/* Mobile Popover Menu */}
              {isMenuOpen && (
                <div
                  ref={menuRef}
                  className="absolute top-10 right-0 z-50 bg-[var(--surface)] border border-[var(--border-subtle)] rounded-[var(--radius-medium)] shadow-xl p-1 min-w-[120px] animate-scale-in sm:hidden"
                >
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setMenuTarget(null);
                      onRenameClick({ id: p.id, name: p.name, label: p.label });
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-2 text-xs font-semibold text-[var(--text-primary)] hover:bg-[var(--surface-secondary)] rounded-[var(--radius-small)] transition-colors cursor-pointer"
                  >
                    <Pencil size={12} className="text-[var(--text-secondary)]" />
                    <span>Rename</span>
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setMenuTarget(null);
                      onDeleteClick({ id: p.id, name: p.name, label: p.label });
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-2 text-xs font-semibold text-[var(--negative)] hover:bg-[var(--negative-soft)] rounded-[var(--radius-small)] transition-colors cursor-pointer"
                  >
                    <Trash2 size={12} />
                    <span>Delete</span>
                  </button>
                </div>
              )}
            </div>
          );
        })}

        {/* Add Member Button inside scroll track */}
        <button
          onClick={onAddFamilyClick}
          className="flex items-center justify-center gap-1.5 px-3 h-9 sm:h-8 rounded-[var(--radius-small)] text-xs font-bold border border-dashed border-[var(--border-subtle)] bg-[var(--surface)] hover:border-[var(--accent-blue)] text-[var(--text-secondary)] hover:text-[var(--accent-blue)] ios-press transition-colors shrink-0 cursor-pointer"
          aria-label="Add family member"
        >
          <UserPlus size={13} />
          <span className="whitespace-nowrap">Add Member</span>
        </button>
      </div>

      {/* Desktop Add family control */}
      <button
        onClick={onAddFamilyClick}
        className="hidden sm:flex items-center gap-1.5 px-3 h-8 rounded-[var(--radius-medium)] text-xs font-bold border border-[var(--border-subtle)] bg-[var(--surface)] hover:border-[var(--accent-blue)] text-[var(--text-secondary)] hover:text-[var(--accent-blue)] ios-press transition-colors shrink-0 cursor-pointer"
        aria-label="Add family member"
      >
        <UserPlus size={14} />
        <span className="whitespace-nowrap">Add Member</span>
      </button>
    </div>
  );
});

