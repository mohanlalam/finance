import { TrendingUp, Landmark, Clock, Coins, Home, Shield, FolderOpen, Calculator, TrendingDown, Pencil, Plus } from '../components/icons/AppIcons';
import { Portfolio } from '../types/portfolio';

export interface DesktopSidebarProps {
  activeTab: string;
  onTabChange: (tabId: string) => void;
  portfolios: Portfolio[];
  selectedPortfolioId: string;
  onSelectPortfolio: (id: string) => void;
  onOpenAddFamily: () => void;
  onOpenRename: (target: { id: string; name: string; label: string }) => void;
}

export default function DesktopSidebar({
  activeTab,
  onTabChange,
  portfolios,
  selectedPortfolioId,
  onSelectPortfolio,
  onOpenAddFamily,
  onOpenRename
}: DesktopSidebarProps) {
  const getNavItemClass = (isActive: boolean) =>
    `flex items-center gap-2.5 w-full text-left px-3 py-2 rounded-md text-xs font-bold transition-all outline-none ${
      isActive
        ? 'bg-blue-50/80 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 border-l-2 border-blue-600 dark:border-blue-500 shadow-xs'
        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100/70 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200 border-l-2 border-transparent'
    }`;

  return (
    <div role="tablist" className="hidden md:flex flex-col border-r border-[var(--border-subtle)] pr-4 mr-4 shrink-0 w-60 self-start sticky top-6 max-h-[calc(100vh-3rem)] overflow-y-auto">
      {/* Portfolios Section */}
      <div className="mb-5">
        <h3 className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 px-3">
          Family Members
        </h3>
        <div className="space-y-0.5">
          <button
            onClick={() => onSelectPortfolio('all')}
            className={getNavItemClass(selectedPortfolioId === 'all')}
          >
            Family Overview
          </button>
          {portfolios.map((p) => (
            <div key={p.name} className="flex items-center group">
              <button
                onClick={() => onSelectPortfolio(p.name)}
                className={getNavItemClass(selectedPortfolioId === p.name)}
              >
                {p.label}
              </button>
              <button
                onClick={() => onOpenRename({ id: p.id, name: p.name, label: p.label })}
                className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-opacity"
                title={`Rename ${p.label}`}
                aria-label={`Rename ${p.label}`}
              >
                <Pencil size={13} />
              </button>
            </div>
          ))}
          <button
            onClick={onOpenAddFamily}
            className="flex items-center gap-1.5 w-full text-left px-3 py-1.5 rounded-md text-xs font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-colors mt-1"
          >
            <Plus size={13} />
            <span>Add Member</span>
          </button>
        </div>
      </div>

      {/* Assets Section */}
      <div className="mb-5">
        <h3 className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 px-3">
          Assets &amp; Holdings
        </h3>
        <div className="space-y-0.5">
          {([
            { id: 'stocks', label: 'Stocks & ETFs', icon: <TrendingUp size={14} /> },
            { id: 'fd', label: 'Fixed Deposits', icon: <Landmark size={14} /> },
            { id: 'rd', label: 'Recurring Deposits', icon: <Clock size={14} /> },
            { id: 'sip', label: 'SIP Mutual Funds', icon: <TrendingUp size={14} /> },
            { id: 'gold', label: 'Gold Holdings', icon: <Coins size={14} /> },
            { id: 'real_estate', label: 'Real Estate', icon: <Home size={14} /> },
            { id: 'insurance', label: 'Insurance Cover', icon: <Shield size={14} /> },
          ] as const).map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                role="tab"
                aria-selected={isActive}
                onClick={() => onTabChange(tab.id)}
                className={getNavItemClass(isActive)}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tools Section */}
      <div>
        <h3 className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 px-3">
          Tools &amp; Vault
        </h3>
        <div className="space-y-0.5">
          {([
            { id: 'documents', label: 'Document Vault', icon: <FolderOpen size={14} /> },
            { id: 'what_if', label: 'What-If Calculator', icon: <Calculator size={14} /> },
            { id: 'tax', label: 'Tax Harvesting', icon: <TrendingDown size={14} /> },
          ] as const).map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                role="tab"
                aria-selected={isActive}
                onClick={() => onTabChange(tab.id)}
                className={getNavItemClass(isActive)}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
