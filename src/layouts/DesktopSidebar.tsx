import { TrendingUp, Landmark, Clock, Coins, Home, Shield, FolderOpen, TrendingDown, Pencil, Trash2, Plus, Sparkles } from '../components/icons/AppIcons';
import { Portfolio } from '../types/portfolio';

export interface DesktopSidebarProps {
  activeTab: string;
  onTabChange: (tabId: string) => void;
  portfolios: Portfolio[];
  selectedPortfolioId: string;
  onSelectPortfolio: (id: string) => void;
  onOpenAddFamily: () => void;
  onOpenRename: (target: { id: string; name: string; label: string }) => void;
  onOpenDelete?: (target: { id: string; name: string; label: string }) => void;
  onOpenSmartImport?: () => void;
}

export default function DesktopSidebar({
  activeTab,
  onTabChange,
  portfolios,
  selectedPortfolioId,
  onSelectPortfolio,
  onOpenAddFamily,
  onOpenRename,
  onOpenDelete,
  onOpenSmartImport,
}: DesktopSidebarProps) {
  const getNavItemClass = (isActive: boolean) =>
    `flex items-center gap-2.5 w-full text-left px-3 py-2 rounded-[var(--radius-small)] text-xs font-semibold ios-press transition-all outline-none ${
      isActive
        ? 'bg-[var(--accent-blue-soft)] text-[var(--accent-blue)] border-l-2 border-[var(--accent-blue)] shadow-[var(--shadow-card)]'
        : 'text-[var(--text-secondary)] hover:bg-[var(--surface-secondary)] hover:text-[var(--text-primary)] border-l-2 border-transparent'
    }`;

  return (
    <div role="tablist" className="hidden md:flex flex-col border-r border-[var(--border-subtle)] pr-4 mr-4 shrink-0 w-60 self-start sticky top-20 max-h-[calc(100vh-5.5rem)] overflow-y-auto">
      {/* AI Smart Import Button */}
      {onOpenSmartImport && (
        <div className="mb-4">
          <button
            type="button"
            onClick={onOpenSmartImport}
            className="flex items-center justify-center gap-2 w-full px-3 py-2.5 rounded-[var(--radius-medium)] text-xs font-bold text-white bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 shadow-sm transition-all ios-press active:scale-95 cursor-pointer"
          >
            <Sparkles size={15} />
            <span>✨ Smart AI Import</span>
          </button>
        </div>
      )}

      {/* Portfolios Section */}
      <div className="mb-5">
        <h3 className="text-label-micro font-bold text-[var(--text-tertiary)] uppercase tracking-wider mb-2 px-3">
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
            <div key={p.name} className="flex items-center group relative">
              <button
                onClick={() => onSelectPortfolio(p.name)}
                className={`flex-1 ${getNavItemClass(selectedPortfolioId === p.name)}`}
              >
                <span className="truncate">{p.label}</span>
              </button>
              <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity pr-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenRename({ id: p.id, name: p.name, label: p.label });
                  }}
                  className="p-1 text-[var(--text-tertiary)] hover:text-[var(--accent-blue)] rounded hover:bg-[var(--surface-secondary)] transition-colors cursor-pointer"
                  title={`Rename ${p.label}`}
                  aria-label={`Rename ${p.label}`}
                >
                  <Pencil size={12} />
                </button>
                {onOpenDelete && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenDelete({ id: p.id, name: p.name, label: p.label });
                    }}
                    className="p-1 text-[var(--text-tertiary)] hover:text-[var(--negative)] rounded hover:bg-[var(--negative-soft)] transition-colors cursor-pointer"
                    title={`Delete ${p.label}`}
                    aria-label={`Delete ${p.label}`}
                  >
                    <Trash2 size={12} />
                  </button>
                )}
              </div>
            </div>
          ))}
          <button
            onClick={onOpenAddFamily}
            className="flex items-center gap-1.5 w-full text-left px-3 py-1.5 rounded-[var(--radius-small)] text-xs font-semibold text-[var(--accent-blue)] hover:bg-[var(--accent-blue-soft)] transition-colors mt-1 cursor-pointer"
          >
            <Plus size={13} />
            <span>Add Member</span>
          </button>
        </div>
      </div>

      {/* Assets Section */}
      <div className="mb-5">
        <h3 className="text-label-micro font-bold text-[var(--text-tertiary)] uppercase tracking-wider mb-2 px-3">
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
        <h3 className="text-label-micro font-bold text-[var(--text-tertiary)] uppercase tracking-wider mb-2 px-3">
          Tools &amp; Vault
        </h3>
        <div className="space-y-0.5">
          {([
            { id: 'documents', label: 'Document Vault', icon: <FolderOpen size={14} /> },
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
