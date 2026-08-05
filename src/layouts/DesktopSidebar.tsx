import { TrendingUp, Landmark, Clock, Coins, Home, Shield, FolderOpen, Calculator, TrendingDown } from '../components/icons/AppIcons';
import { Portfolio } from '../types/portfolio';

export interface DesktopSidebarProps {
  activeTab: string; // The active asset tab (e.g., 'stocks', 'fd')
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
  return (
    <div role="tablist" className="hidden md:flex flex-col border-r border-[var(--border-subtle)] pr-4 mr-4 shrink-0 w-64 min-h-screen">
      {/* Portfolio Selector Placeholder (could be a dropdown if desired, for now keeping simple) */}
      <div className="mb-6">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 px-3">Portfolios</h3>
        <div className="space-y-1">
          <button
            onClick={() => onSelectPortfolio('all')}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
              selectedPortfolioId === 'all'
                ? 'bg-[#eaf3ff] text-[#007aff] dark:bg-blue-950/20 dark:text-[#60a5fa] font-bold'
                : 'text-[var(--text-secondary)] hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Family Overview
          </button>
          {portfolios.map(p => (
            <div key={p.name} className="flex items-center group">
              <button
                onClick={() => onSelectPortfolio(p.name)}
                className={`flex-1 text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                  selectedPortfolioId === p.name
                    ? 'bg-[#eaf3ff] text-[#007aff] dark:bg-blue-950/20 dark:text-[#60a5fa] font-bold'
                    : 'text-[var(--text-secondary)] hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {p.label}
              </button>
              <button
                onClick={() => onOpenRename({ id: p.id, name: p.name, label: p.label })}
                className="opacity-0 group-hover:opacity-100 p-2 text-slate-400 hover:text-slate-600 transition-opacity"
              >
                ✏️
              </button>
            </div>
          ))}
          <button
            onClick={onOpenAddFamily}
            className="w-full text-left px-3 py-2 rounded-lg text-sm text-[#007aff] dark:text-[#60a5fa] hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-colors mt-2"
          >
            + Add Member
          </button>
        </div>
      </div>

      <div className="mb-6">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 px-3">Assets</h3>
        <div className="space-y-1">
          {([
            { id: 'stocks', label: 'Stocks & ETFs', icon: <TrendingUp size={16} /> },
            { id: 'fd', label: 'Fixed Deposits', icon: <Landmark size={16} /> },
            { id: 'rd', label: 'Recurring Deposits', icon: <Clock size={16} /> },
            { id: 'sip', label: 'SIP Mutual Funds', icon: <TrendingUp size={16} /> },
            { id: 'gold', label: 'Gold Holdings', icon: <Coins size={16} /> },
            { id: 'real_estate', label: 'Real Estate', icon: <Home size={16} /> },
            { id: 'insurance', label: 'Insurance Cover', icon: <Shield size={16} /> },
          ] as const).map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                role="tab"
                aria-selected={isActive}
                onClick={() => onTabChange(tab.id)}
                className={`flex items-center gap-3 w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                  isActive
                    ? 'bg-[#eaf3ff] text-[#007aff] dark:bg-blue-950/20 dark:text-[#60a5fa] font-bold'
                    : 'text-[var(--text-secondary)] hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 px-3">Tools</h3>
        <div className="space-y-1">
          {([
            { id: 'documents', label: 'Vault', icon: <FolderOpen size={16} /> },
            { id: 'what_if', label: 'What-If Calc', icon: <Calculator size={16} /> },
            { id: 'tax', label: 'Tax Harvesting', icon: <TrendingDown size={16} /> },
          ] as const).map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                role="tab"
                aria-selected={isActive}
                onClick={() => onTabChange(tab.id)}
                className={`flex items-center gap-3 w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                  isActive
                    ? 'bg-[#eaf3ff] text-[#007aff] dark:bg-blue-950/20 dark:text-[#60a5fa] font-bold'
                    : 'text-[var(--text-secondary)] hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
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
