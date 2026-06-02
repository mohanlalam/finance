import { useState } from 'react';
import { Plus, TrendingUp, Landmark, Coins, Building2, Shield, FolderOpen } from 'lucide-react';

interface FloatingAddMenuProps {
  onAddStock: () => void;
  onAddAsset: (type: 'fd' | 'gold' | 'real_estate' | 'insurance' | 'documents') => void;
}

export default function FloatingAddMenu({ onAddStock, onAddAsset }: FloatingAddMenuProps) {
  const [isOpen, setIsOpen] = useState(false);

  const menuItems = [
    { label: 'Add Stock / ETF', icon: <TrendingUp size={16} />, onClick: () => { onAddStock(); setIsOpen(false); }, color: 'bg-blue-500 dark:bg-blue-600' },
    { label: 'Add Fixed Deposit', icon: <Landmark size={16} />, onClick: () => { onAddAsset('fd'); setIsOpen(false); }, color: 'bg-indigo-500 dark:bg-indigo-600' },
    { label: 'Add Gold Holding', icon: <Coins size={16} />, onClick: () => { onAddAsset('gold'); setIsOpen(false); }, color: 'bg-amber-500 dark:bg-amber-600' },
    { label: 'Add Property', icon: <Building2 size={16} />, onClick: () => { onAddAsset('real_estate'); setIsOpen(false); }, color: 'bg-emerald-500 dark:bg-emerald-600' },
    { label: 'Add Insurance policy', icon: <Shield size={16} />, onClick: () => { onAddAsset('insurance'); setIsOpen(false); }, color: 'bg-rose-500 dark:bg-rose-600' },
    { label: 'Upload Document', icon: <FolderOpen size={16} />, onClick: () => { onAddAsset('documents'); setIsOpen(false); }, color: 'bg-slate-500 dark:bg-slate-600' },
  ];

  return (
    <div className="md:hidden">
      {/* Backdrop */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 bg-slate-950/40 dark:bg-slate-950/60 backdrop-blur-xs z-40 transition-opacity duration-200"
        />
      )}

      {/* Floating Menu Container */}
      <div className="fixed bottom-20 right-5 z-50 flex flex-col items-end gap-3 pointer-events-none">
        {/* Menu Items list */}
        {isOpen && (
          <div className="flex flex-col items-end gap-2.5 mb-2 pointer-events-auto">
            {menuItems.map((item, idx) => (
              <button
                key={idx}
                onClick={item.onClick}
                className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-md active:scale-95 transition-all text-xs font-bold text-slate-700 dark:text-slate-250 animate-modal-content"
                style={{ animationDelay: `${(menuItems.length - 1 - idx) * 40}ms` }}
              >
                <span>{item.label}</span>
                <div className={`w-8 h-8 rounded-lg ${item.color} text-white flex items-center justify-center shadow-xs`}>
                  {item.icon}
                </div>
              </button>
            ))}
          </div>
        )}

        {/* FAB Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Open quick add menu"
          aria-expanded={isOpen}
          className="pointer-events-auto w-12 h-12 rounded-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white flex items-center justify-center shadow-lg active:scale-90 transition-all outline-none"
        >
          <Plus
            size={24}
            className={`transition-transform duration-250 ${isOpen ? 'rotate-135' : ''}`}
          />
        </button>
      </div>
    </div>
  );
}
