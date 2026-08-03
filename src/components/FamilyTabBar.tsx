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

const familyIcons: Record<string, React.ReactNode> = {
  personal: <User size={17} />,
  mother: <Heart size={17} />,
  wife: <Users size={17} />,
};

function getFamilyIcon(name: string): React.ReactNode {
  return familyIcons[name] ?? <User size={17} />;
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
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1 overflow-x-auto scrollbar-none">
      
      {/* Apple-style segmented track */}
      <div
        role="tablist"
        aria-label="Family members portfolios"
        className="flex items-center bg-[#f2f2f7] dark:bg-zinc-800 p-1 rounded-2xl border border-slate-200/40 dark:border-zinc-700/30 overflow-x-auto scrollbar-none"
      >
        {/* Overview Tab */}
        <button
          role="tab"
          aria-selected={activeTab === 'all'}
          aria-controls="portfolio-content"
          id="tab-all"
          onClick={() => onTabChange('all')}
          className={`flex items-center gap-1.5 h-8 px-3.5 rounded-[10px] text-xs font-semibold transition-all duration-200 outline-none shrink-0 ${
            activeTab === 'all'
              ? 'bg-white text-[#1d1d1f] shadow-sm dark:bg-zinc-700 dark:text-[#f5f5f7]'
              : 'text-[#6e6e73] hover:text-[#1d1d1f] dark:text-[#98989d] dark:hover:text-[#f5f5f7]'
          }`}
        >
          <LayoutDashboard size={17} />
          <span>Family Overview</span>
        </button>

        {/* Member Tabs */}
        {portfolios.map((p) => {
          const isActive = activeTab === p.name;
          return (
            <div key={p.name} className="relative group flex items-center shrink-0">
              <button
                role="tab"
                aria-selected={isActive}
                aria-controls="portfolio-content"
                id={`tab-${p.name}`}
                onClick={() => onTabChange(p.name)}
                className={`flex items-center gap-1.5 h-8 px-3.5 rounded-[10px] text-xs font-semibold transition-all duration-200 outline-none ${
                  isActive
                    ? 'bg-white text-[#1d1d1f] shadow-sm dark:bg-zinc-700 dark:text-[#f5f5f7]'
                    : 'text-[#6e6e73] hover:text-[#1d1d1f] dark:text-[#98989d] dark:hover:text-[#f5f5f7]'
                }`}
              >
                {getFamilyIcon(p.name)}
                <span>{p.label}</span>
                <span className={`text-[10px] font-bold ${
                  isActive 
                    ? 'text-[#007aff] dark:text-[#60a5fa]' 
                    : p.totalPnL >= 0 ? 'text-[#34C759]' : 'text-[#ff3b30]'
                }`}>
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
        className="flex items-center gap-1.5 px-3 h-10 rounded-2xl text-xs font-semibold border border-slate-200 hover:border-[#007aff] hover:text-[#007aff] dark:border-zinc-800 dark:text-zinc-400 dark:hover:text-[#60a5fa] dark:hover:border-[#60a5fa] transition-colors shrink-0"
        aria-label="Add family member"
      >
        <UserPlus size={17} />
        <span>Add Member</span>
      </button>

    </div>
  );
});
