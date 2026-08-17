import React from 'react';
import { LayoutDashboard, Pencil, Trash2, UserPlus, User, Heart, Users } from './icons/AppIcons';
import { Portfolio, PortfolioName } from '../types/portfolio';
import { formatPercent } from '../utils/formatters';

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
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-1">
      
      {/* Segmented Track */}
      <div
        role="tablist"
        aria-label="Family members portfolios"
        className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-1 bg-[var(--surface-secondary)] p-1 rounded-[var(--radius-medium)] border border-[var(--border-subtle)] w-full sm:w-auto"
      >
        {/* Overview Tab */}
        <button
          role="tab"
          aria-selected={activeTab === 'all'}
          aria-controls="portfolio-content"
          id="tab-all"
          onClick={() => onTabChange('all')}
          className={`flex items-center gap-2 h-8 px-2.5 rounded-[var(--radius-small)] text-xs font-bold transition-all outline-none min-w-0 ${
            activeTab === 'all'
              ? 'bg-[var(--surface)] text-[var(--text-primary)] shadow-xs border border-[var(--border-subtle)]'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          <div className="w-4 h-4 rounded bg-[var(--accent-blue-soft)] text-[var(--accent-blue)] flex items-center justify-center shrink-0">
            <LayoutDashboard size={12} />
          </div>
          <span className="truncate">Family Overview</span>
        </button>

        {/* Member Tabs */}
        {portfolios.map((p) => {
          const isActive = activeTab === p.name;
          const iconConfig = getFamilyIconConfig(p.name);
          const isPositive = p.totalPnL >= 0;

          return (
            <div key={p.name} className="relative group flex items-center justify-between min-w-0">
              <button
                role="tab"
                aria-selected={isActive}
                aria-controls="portfolio-content"
                id={`tab-${p.name}`}
                onClick={() => onTabChange(p.name)}
                className={`flex items-center justify-between gap-1 h-8 px-2 rounded-[var(--radius-small)] text-xs font-bold transition-all outline-none flex-1 min-w-0 ${
                  isActive
                    ? 'bg-[var(--surface)] text-[var(--text-primary)] shadow-xs border border-[var(--border-subtle)]'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                <div className="flex items-center gap-1.5 min-w-0 truncate">
                  {/* Styled icon badge */}
                  <div className={`w-4 h-4 rounded ${iconConfig.bg} ${iconConfig.text} flex items-center justify-center shrink-0`}>
                    {iconConfig.icon}
                  </div>

                  <span className="truncate">{p.label}</span>
                </div>

                {/* Return Percentage Badge */}
                <span
                  className={`text-[10px] font-extrabold px-1 py-0.5 rounded tnum transition-colors shrink-0 ${
                    isPositive
                      ? 'bg-[var(--positive-soft)] text-[var(--positive)]'
                      : 'bg-[var(--negative-soft)] text-[var(--negative)]'
                  }`}
                >
                  {formatPercent(p.totalPnLPercent, 1)}
                </span>
              </button>

              {/* Action buttons (pencil, trash) displayed on hover */}
              <div className="flex items-center gap-0.5 ml-0.5 opacity-40 group-hover:opacity-100 transition-opacity duration-150 shrink-0">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRenameClick({ id: p.id, name: p.name, label: p.label });
                  }}
                  className="w-4 h-4 rounded flex items-center justify-center text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface)] transition-colors"
                  title={`Rename ${p.label}`}
                  aria-label={`Rename portfolio ${p.label}`}
                >
                  <Pencil size={10} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteClick({ id: p.id, name: p.name, label: p.label });
                  }}
                  className="w-4 h-4 rounded flex items-center justify-center text-[var(--text-tertiary)] hover:text-[var(--negative)] hover:bg-[var(--negative-soft)] transition-colors"
                  title={`Delete ${p.label}`}
                  aria-label={`Delete portfolio ${p.label}`}
                >
                  <Trash2 size={10} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add family control */}
      <button
        onClick={onAddFamilyClick}
        className="flex items-center gap-1.5 px-3.5 h-8 sm:h-9 rounded-[var(--radius-medium)] text-xs font-bold border border-[var(--border-subtle)] bg-[var(--surface)] hover:border-[var(--accent-blue)] text-[var(--text-secondary)] hover:text-[var(--accent-blue)] ios-press transition-colors shrink-0 cursor-pointer"
        aria-label="Add family member"
      >
        <UserPlus size={14} />
        <span>Add Member</span>
      </button>

    </div>
  );
});
