import React, { useState, useRef, useEffect, useMemo } from 'react';
import { LayoutDashboard, Pencil, Trash2, UserPlus, MoreVertical } from './icons/AppIcons';
import { Portfolio, PortfolioName } from '../types/portfolio';
import { formatPercent } from '../utils/formatters';
import { sortPortfolios } from '../domains/portfolio/calculations/portfolioOrdering';
import { getFamilyMemberConfig } from '../utils/familyMemberConfig';

interface FamilyTabBarProps {
  portfolios: Portfolio[];
  activeTab: PortfolioName;
  onTabChange: (tab: PortfolioName) => void;
  onAddFamilyClick: () => void;
  onRenameClick: (portfolio: { id: string; name: string; label: string }) => void;
  onDeleteClick: (portfolio: { id: string; name: string; label: string }) => void;
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
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMenuTarget(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [menuTarget]);

  return (
    <div className="flex items-center justify-between gap-2 pb-1 relative w-full min-w-0">
      {/* Segmented Track: Horizontal scroll on mobile, flex on desktop */}
      <div
        role="tablist"
        aria-label="Family members portfolios"
        className="flex items-center gap-1.5 bg-[var(--surface-secondary)]/60 backdrop-blur-xl p-1.5 sm:p-1 rounded-[var(--radius-large)] sm:rounded-[var(--radius-medium)] border border-[var(--border-subtle)] w-full sm:w-auto shadow-[var(--shadow-card)] overflow-x-auto scrollbar-none pr-3 scroll-smooth touch-pan-x"
        style={{ WebkitOverflowScrolling: 'touch' }}
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
          className={`flex items-center gap-2 h-9 sm:h-8 px-3 rounded-[var(--radius-small)] text-xs font-bold transition-all outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-blue)] focus-visible:ring-offset-1 shrink-0 cursor-pointer ${
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
          const iconConfig = getFamilyMemberConfig(p.name);
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
                className={`flex items-center gap-1.5 h-9 sm:h-8 pl-2 pr-1.5 sm:pl-2.5 sm:pr-1.5 rounded-[var(--radius-small)] text-xs font-bold transition-all outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-blue)] focus-visible:ring-offset-1 shrink-0 cursor-pointer ${
                  isActive
                    ? 'bg-[var(--surface)] text-[var(--text-primary)] shadow-[var(--shadow-card)] border border-[var(--border-luminous)] ring-1 ring-[var(--accent-blue)]/20'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-secondary)]/50'
                }`}
              >
                {/* Styled icon badge */}
                <div className={`w-4 h-4 rounded ${iconConfig.bg} ${iconConfig.text} flex items-center justify-center shrink-0`}>
                  {iconConfig.icon}
                </div>

                <span className="whitespace-nowrap shrink-0">{p.label}</span>

                {/* Return Percentage Badge */}
                <span
                  className={`text-[9px] sm:text-[10px] font-bold px-1 py-0.2 sm:px-1.5 sm:py-0.5 rounded tnum transition-colors shrink-0 ${
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
                className="sm:hidden w-6 h-9 sm:h-8 flex items-center justify-center text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors px-0.5 shrink-0 touch-manipulation ios-press cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-blue)]"
                title={`Options for ${p.label}`}
                aria-label={`Options for portfolio ${p.label}`}
                aria-haspopup="menu"
                aria-expanded={isMenuOpen}
                aria-controls={`menu-${p.id}`}
              >
                <MoreVertical size={13} aria-hidden="true" />
              </button>

              {/* Desktop action buttons (pencil, trash) displayed on hover */}
              <div className="hidden sm:flex items-center gap-0.5 ml-0.5 opacity-40 group-hover:opacity-100 transition-opacity duration-150 shrink-0">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRenameClick({ id: p.id, name: p.name, label: p.label });
                  }}
                  className="w-5 h-5 rounded flex items-center justify-center text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface)] transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-blue)]"
                  title={`Rename ${p.label}`}
                  aria-label={`Rename portfolio ${p.label}`}
                >
                  <Pencil size={11} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteClick({ id: p.id, name: p.name, label: p.label });
                  }}
                  className="w-5 h-5 rounded flex items-center justify-center text-[var(--text-tertiary)] hover:text-[var(--negative)] hover:bg-[var(--negative-soft)] transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-[var(--negative)]"
                  title={`Delete ${p.label}`}
                  aria-label={`Delete portfolio ${p.label}`}
                >
                  <Trash2 size={11} aria-hidden="true" />
                </button>
              </div>

              {/* Mobile Popover Menu */}
              {isMenuOpen && (
                <div
                  ref={menuRef}
                  id={`menu-${p.id}`}
                  role="menu"
                  aria-label={`Options for ${p.label}`}
                  className="absolute top-10 right-0 z-50 bg-[var(--surface-solid)] border border-[var(--border-subtle)] rounded-[var(--radius-medium)] shadow-xl p-1 min-w-[120px] animate-slide-up sm:hidden"
                >
                  <button
                    role="menuitem"
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setMenuTarget(null);
                      onRenameClick({ id: p.id, name: p.name, label: p.label });
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-2 text-xs font-semibold text-[var(--text-primary)] hover:bg-[var(--surface-secondary)] rounded-[var(--radius-small)] transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-blue)]"
                  >
                    <Pencil size={12} className="text-[var(--text-secondary)]" aria-hidden="true" />
                    <span>Rename</span>
                  </button>
                  <button
                    role="menuitem"
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setMenuTarget(null);
                      onDeleteClick({ id: p.id, name: p.name, label: p.label });
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-2 text-xs font-semibold text-[var(--negative)] hover:bg-[var(--negative-soft)] rounded-[var(--radius-small)] transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-[var(--negative)]"
                  >
                    <Trash2 size={12} aria-hidden="true" />
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
          className="flex items-center justify-center gap-1.5 px-3 h-9 sm:h-8 rounded-[var(--radius-small)] text-xs font-bold border border-dashed border-[var(--border-subtle)] bg-[var(--surface)] hover:border-[var(--accent-blue)] text-[var(--text-secondary)] hover:text-[var(--accent-blue)] ios-press transition-colors shrink-0 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-blue)]"
          aria-label="Add family member"
        >
          <UserPlus size={13} aria-hidden="true" />
          <span className="whitespace-nowrap">Add Member</span>
        </button>
      </div>

      {/* Desktop Add family control */}
      <button
        onClick={onAddFamilyClick}
        className="hidden sm:flex items-center gap-1.5 px-3 h-8 rounded-[var(--radius-medium)] text-xs font-bold border border-[var(--border-subtle)] bg-[var(--surface)] hover:border-[var(--accent-blue)] text-[var(--text-secondary)] hover:text-[var(--accent-blue)] ios-press transition-colors shrink-0 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-blue)]"
        aria-label="Add family member"
      >
        <UserPlus size={14} aria-hidden="true" />
        <span className="whitespace-nowrap">Add Member</span>
      </button>
    </div>
  );
});

