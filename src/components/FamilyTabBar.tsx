import React from 'react';
import { LayoutDashboard, Pencil, Trash2, UserPlus, User, Heart, Users } from 'lucide-react';
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

const familyIcons: Record<string, React.ReactNode> = {
  personal: <User size={15} />,
  mother: <Heart size={15} />,
  wife: <Users size={15} />,
};

const familyColors: Record<string, string> = {
  personal: 'bg-blue-600 text-white dark:bg-blue-500',
  mother: 'bg-rose-500 text-white dark:bg-rose-600',
  wife: 'bg-teal-500 text-white dark:bg-teal-600',
};

function getFamilyColor(name: string): string {
  return familyColors[name] ?? 'bg-violet-600 text-white dark:bg-violet-600';
}

function getFamilyIcon(name: string): React.ReactNode {
  return familyIcons[name] ?? <UserPlus size={15} />;
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
    <div
      role="tablist"
      aria-label="Family members portfolios"
      className="flex flex-nowrap md:flex-wrap gap-2 overflow-x-auto md:overflow-x-visible pb-2 md:pb-0 scrollbar-none -mx-4 px-4 md:mx-0 md:px-0"
    >
      <button
        role="tab"
        aria-selected={activeTab === 'all'}
        aria-controls="portfolio-content"
        id="tab-all"
        onClick={() => onTabChange('all')}
        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-150 outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 dark:focus:ring-offset-slate-900 ${
          activeTab === 'all'
            ? 'bg-slate-800 text-white shadow-md scale-[1.02] dark:bg-slate-100 dark:text-slate-900'
            : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300 hover:shadow-sm dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 dark:hover:border-slate-600'
        }`}
      >
        <LayoutDashboard size={15} />
        <span>Family Overview</span>
      </button>

      {portfolios.map((p) => {
        const isActive = activeTab === p.name;
        return (
          <div key={p.name} className="relative group flex items-center">
            <button
              role="tab"
              aria-selected={isActive}
              aria-controls="portfolio-content"
              id={`tab-${p.name}`}
              onClick={() => onTabChange(p.name)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-150 outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900 ${
                isActive
                  ? `${getFamilyColor(p.name)} shadow-md scale-[1.02]`
                  : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300 hover:shadow-sm dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 dark:hover:border-slate-600'
              }`}
            >
              {getFamilyIcon(p.name)}
              <span>{p.label}</span>
              <span
                className={`text-xs px-1.5 py-0.5 rounded-md font-bold ${
                  isActive
                    ? 'bg-white/20 text-white'
                    : p.totalPnL >= 0
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400'
                    : 'bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400'
                }`}
              >
                {formatPercent(p.totalPnLPercent, 1)}
              </span>
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRenameClick({ id: p.id, name: p.name, label: p.label });
              }}
              className="ml-1 w-6 h-6 rounded-lg flex items-center justify-center transition-all duration-150 text-slate-400 hover:text-slate-650 hover:bg-slate-100 dark:text-slate-500 dark:hover:text-slate-300 dark:hover:bg-slate-800 opacity-0 group-hover:opacity-100 focus:opacity-100"
              title={`Rename ${p.label}`}
              aria-label={`Rename portfolio ${p.label}`}
            >
              <Pencil size={12} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDeleteClick({ id: p.id, name: p.name, label: p.label });
              }}
              className="ml-0.5 w-6 h-6 rounded-lg flex items-center justify-center transition-all duration-150 text-slate-400 hover:text-red-650 hover:bg-red-50 dark:text-slate-500 dark:hover:text-red-400 dark:hover:bg-red-950/20 opacity-0 group-hover:opacity-100 focus:opacity-100"
              title={`Delete ${p.label}`}
              aria-label={`Delete portfolio ${p.label}`}
            >
              <Trash2 size={12} />
            </button>
          </div>
        );
      })}

      <button
        onClick={onAddFamilyClick}
        className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border-2 border-dashed border-slate-300 text-slate-500 hover:border-blue-400 hover:text-blue-600 dark:border-slate-700 dark:text-slate-400 dark:hover:border-blue-500 dark:hover:text-blue-400 transition-colors"
        aria-label="Add family member"
      >
        <UserPlus size={15} />
        <span>Add Family Member</span>
      </button>
    </div>
  );
});
