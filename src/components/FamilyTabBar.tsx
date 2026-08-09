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
        className="flex flex-wrap items-center gap-1 bg-slate-100 dark:bg-slate-800/90 p-1 rounded-lg border border-slate-200/60 dark:border-slate-700/60 max-w-full"
      >
        {/* Overview Tab */}
        <button
          role="tab"
          aria-selected={activeTab === 'all'}
          aria-controls="portfolio-content"
          id="tab-all"
          onClick={() => onTabChange('all')}
          className={`flex items-center gap-2 h-8 px-3 rounded-md text-xs font-bold transition-all outline-none shrink-0 ${
            activeTab === 'all'
              ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80 dark:bg-slate-700 dark:text-slate-100 dark:border-slate-600'
              : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          <div className="w-4 h-4 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <LayoutDashboard size={12} />
          </div>
          <span>Family Overview</span>
        </button>

        {/* Member Tabs */}
        {portfolios.map((p) => {
          const isActive = activeTab === p.name;
          const iconConfig = getFamilyIconConfig(p.name);
          const isPositive = p.totalPnL >= 0;

          return (
            <div key={p.name} className="relative group flex items-center shrink-0">
              <button
                role="tab"
                aria-selected={isActive}
                aria-controls="portfolio-content"
                id={`tab-${p.name}`}
                onClick={() => onTabChange(p.name)}
                className={`flex items-center gap-2 h-8 px-3 rounded-md text-xs font-bold transition-all outline-none ${
                  isActive
                    ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80 dark:bg-slate-700 dark:text-slate-100 dark:border-slate-600'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
              >
                {/* Styled icon badge */}
                <div className={`w-4 h-4 rounded ${iconConfig.bg} ${iconConfig.text} flex items-center justify-center shrink-0`}>
                  {iconConfig.icon}
                </div>

                <span>{p.label}</span>

                {/* Return Percentage Badge */}
                <span
                  className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded tnum transition-colors ${
                    isPositive
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                      : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                  }`}
                >
                  {formatPercent(p.totalPnLPercent, 1)}
                </span>
              </button>

              {/* Action buttons (pencil, trash) displayed on hover */}
              <div className="flex items-center gap-0.5 ml-1 mr-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150 shrink-0">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRenameClick({ id: p.id, name: p.name, label: p.label });
                  }}
                  className="w-5 h-5 rounded-md flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200 dark:hover:bg-zinc-600 transition-colors"
                  title={`Rename ${p.label}`}
                  aria-label={`Rename portfolio ${p.label}`}
                >
                  <Pencil size={11} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteClick({ id: p.id, name: p.name, label: p.label });
                  }}
                  className="w-5 h-5 rounded-md flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                  title={`Delete ${p.label}`}
                  aria-label={`Delete portfolio ${p.label}`}
                >
                  <Trash2 size={11} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add family control */}
      <button
        onClick={onAddFamilyClick}
        className="flex items-center gap-1.5 px-3.5 h-9 rounded-xl text-xs font-bold border border-slate-200 hover:border-[#007aff] hover:text-[#007aff] dark:border-zinc-700 dark:text-zinc-300 dark:hover:text-[#60a5fa] dark:hover:border-[#60a5fa] transition-colors shrink-0"
        aria-label="Add family member"
      >
        <UserPlus size={15} />
        <span>Add Member</span>
      </button>

    </div>
  );
});
