import { useState, useEffect, useRef } from 'react';
import { Plus, TrendingUp, Landmark, Coins, Building2, Shield, FolderOpen, Clock, X, Sparkles } from './icons/AppIcons';
import { triggerHaptic } from '../utils/haptics';

type FabPosition = 'right' | 'center' | 'left';

interface MenuItem {
  label: string;
  subtext: string;
  icon: React.ReactNode;
  onClick: () => void;
  color: string;
  highlight?: boolean;
}

interface MenuGroup {
  category: string;
  items: MenuItem[];
}

interface FloatingAddMenuProps {
  onAddStock: () => void;
  onAddAsset: (type: 'fd' | 'rd' | 'sip' | 'gold' | 'real_estate' | 'insurance' | 'documents') => void;
  onOpenSmartImport?: () => void;
  isHidden?: boolean;
}

export default function FloatingAddMenu({
  onAddStock,
  onAddAsset,
  onOpenSmartImport,
  isHidden = false,
}: FloatingAddMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState<FabPosition>(() => {
    try {
      const saved = localStorage.getItem('finance_fab_position');
      if (saved === 'left' || saved === 'center' || saved === 'right') return saved;
    } catch { /* ignore */ }
    return 'right';
  });
  const fabButtonRef = useRef<HTMLButtonElement>(null);

  const changePosition = (newPos: FabPosition) => {
    setPosition(newPos);
    try {
      localStorage.setItem('finance_fab_position', newPos);
    } catch { /* ignore */ }
  };

  // Lock body scroll when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Close & restore focus on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
        fabButtonRef.current?.focus();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  if (isHidden) return null;

  const menuGroups: MenuGroup[] = [
    {
      category: 'AI Assistant',
      items: [
        {
          label: 'Smart AI Import',
          subtext: 'Auto-extract details from document/photo',
          icon: <Sparkles size={18} aria-hidden="true" />,
          onClick: () => {
            triggerHaptic('selection');
            onOpenSmartImport?.();
            setIsOpen(false);
          },
          color: 'bg-amber-500/20 text-amber-600 dark:text-amber-400 font-bold',
          highlight: true,
        },
      ],
    },
    {
      category: 'Market & Wealth',
      items: [
        { label: 'Stock / ETF', subtext: 'Equities & exchange-traded funds', icon: <TrendingUp size={18} aria-hidden="true" />, onClick: () => { triggerHaptic('selection'); onAddStock(); setIsOpen(false); }, color: 'bg-[var(--accent-blue-soft)] text-[var(--accent-blue)]' },
        { label: 'SIP Mutual Fund', subtext: 'Systematic investment plans', icon: <TrendingUp size={18} aria-hidden="true" />, onClick: () => { triggerHaptic('selection'); onAddAsset('sip'); setIsOpen(false); }, color: 'bg-[var(--accent-blue-soft)] text-[var(--accent-blue)]' },
        { label: 'Gold Holding', subtext: '24K / 22K physical & digital bullion', icon: <Coins size={18} aria-hidden="true" />, onClick: () => { triggerHaptic('selection'); onAddAsset('gold'); setIsOpen(false); }, color: 'bg-[var(--warning-soft)] text-[var(--warning)]' },
      ],
    },
    {
      category: 'Deposits',
      items: [
        { label: 'Fixed Deposit (FD)', subtext: 'Bank & corporate fixed term deposits', icon: <Landmark size={18} aria-hidden="true" />, onClick: () => { triggerHaptic('selection'); onAddAsset('fd'); setIsOpen(false); }, color: 'bg-[var(--surface-secondary)] text-[var(--text-primary)]' },
        { label: 'Recurring Deposit (RD)', subtext: 'Monthly compounding RD accounts', icon: <Clock size={18} aria-hidden="true" />, onClick: () => { triggerHaptic('selection'); onAddAsset('rd'); setIsOpen(false); }, color: 'bg-[var(--surface-secondary)] text-[var(--text-secondary)]' },
      ],
    },
    {
      category: 'Property & Protection',
      items: [
        { label: 'Real Estate Property', subtext: 'Residential, commercial & land plots', icon: <Building2 size={18} aria-hidden="true" />, onClick: () => { triggerHaptic('selection'); onAddAsset('real_estate'); setIsOpen(false); }, color: 'bg-[var(--positive-soft)] text-[var(--positive)]' },
        { label: 'Insurance Policy', subtext: 'Life, health & vehicle policies', icon: <Shield size={18} aria-hidden="true" />, onClick: () => { triggerHaptic('selection'); onAddAsset('insurance'); setIsOpen(false); }, color: 'bg-[var(--negative-soft)] text-[var(--negative)]' },
        { label: 'Upload Document', subtext: 'Safe digital vault attachment', icon: <FolderOpen size={18} aria-hidden="true" />, onClick: () => { triggerHaptic('selection'); onAddAsset('documents'); setIsOpen(false); }, color: 'bg-[var(--surface-secondary)] text-[var(--text-tertiary)]' },
      ],
    },
  ];

  const getFabButtonPositionClass = () => {
    switch (position) {
      case 'left':
        return 'left-4 right-auto';
      case 'center':
        return 'left-1/2 -translate-x-1/2';
      case 'right':
      default:
        return 'right-4 left-auto';
    }
  };

  return (
    <div className="md:hidden">
      {/* Backdrop for Bottom Sheet Modal */}
      {isOpen && (
        <div
          onClick={() => {
            setIsOpen(false);
            fabButtonRef.current?.focus();
          }}
          className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm transition-opacity duration-200"
          aria-hidden="true"
        />
      )}

      {/* Docked Quick-Add Bottom Sheet */}
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Quick Add Asset Menu"
          className="fixed left-0 right-0 bottom-0 z-[80] bg-[var(--surface-solid)] border-t border-[var(--border-subtle)] rounded-t-3xl shadow-2xl p-4 md:hidden animate-slide-up max-w-lg mx-auto will-change-transform transform-gpu pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))]"
          style={{ maxHeight: '85vh' }}
        >
          {/* Drag Handle Bar */}
          <div className="w-10 h-1 rounded-full bg-[var(--border-subtle)] mx-auto mb-3" aria-hidden="true" />

          {/* Header Row */}
          <div className="flex items-center justify-between pb-3 mb-2 border-b border-[var(--border-subtle)] gap-2">
            <div>
              <h4 className="text-xs font-extrabold text-[var(--text-primary)] uppercase tracking-wider">
                ✨ Quick Add Asset
              </h4>
              <p className="text-[11px] text-[var(--text-tertiary)]">Select category to add to portfolio</p>
            </div>

            {/* Position Switcher Controls */}
            <div className="flex items-center gap-1 bg-[var(--surface-secondary)] p-0.5 rounded-[var(--radius-small)] text-[10px]" role="radiogroup" aria-label="Button alignment">
              <button
                type="button"
                onClick={() => changePosition('left')}
                className={`px-2 py-1 min-h-[26px] rounded-[var(--radius-small)] font-bold transition-colors ios-press touch-manipulation cursor-pointer ${position === 'left' ? 'bg-[var(--accent-blue)] text-white shadow-xs' : 'text-[var(--text-tertiary)] hover:text-[var(--text-primary)]'}`}
                title="Move button to Left"
                aria-checked={position === 'left'}
                role="radio"
              >
                Left
              </button>
              <button
                type="button"
                onClick={() => changePosition('center')}
                className={`px-2 py-1 min-h-[26px] rounded-[var(--radius-small)] font-bold transition-colors ios-press touch-manipulation cursor-pointer ${position === 'center' ? 'bg-[var(--accent-blue)] text-white shadow-xs' : 'text-[var(--text-tertiary)] hover:text-[var(--text-primary)]'}`}
                title="Move button to Center"
                aria-checked={position === 'center'}
                role="radio"
              >
                Center
              </button>
              <button
                type="button"
                onClick={() => changePosition('right')}
                className={`px-2 py-1 min-h-[26px] rounded-[var(--radius-small)] font-bold transition-colors ios-press touch-manipulation cursor-pointer ${position === 'right' ? 'bg-[var(--accent-blue)] text-white shadow-xs' : 'text-[var(--text-tertiary)] hover:text-[var(--text-primary)]'}`}
                title="Move button to Right"
                aria-checked={position === 'right'}
                role="radio"
              >
                Right
              </button>
            </div>

            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                fabButtonRef.current?.focus();
              }}
              className="w-9 h-9 min-w-[36px] min-h-[36px] flex items-center justify-center rounded-[var(--radius-medium)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-secondary)] ios-press transition-colors shrink-0 touch-manipulation cursor-pointer"
              aria-label="Close add menu"
            >
              <X size={18} aria-hidden="true" />
            </button>
          </div>

          {/* Categorized Options List with Clean Scroll */}
          <div className="overflow-y-auto max-h-[60vh] space-y-3.5 pr-1">
            {menuGroups.map((group) => (
              <div key={group.category} className="space-y-1.5">
                <span className="px-1 text-[10px] font-extrabold uppercase tracking-wider text-[var(--text-tertiary)] block">
                  {group.category}
                </span>
                <div className="grid grid-cols-1 gap-1.5">
                  {group.items.map((item, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={item.onClick}
                      className={`w-full flex items-center justify-between p-2.5 min-h-[46px] rounded-[var(--radius-medium)] text-left outline-none ios-press border transition-all cursor-pointer ${
                        item.highlight
                          ? 'bg-gradient-to-r from-amber-500/15 to-amber-600/15 border-amber-500/30 text-amber-800 dark:text-amber-300'
                          : 'bg-[var(--surface-secondary)]/60 hover:bg-[var(--surface-secondary)] border-[var(--border-subtle)] text-[var(--text-primary)]'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-8 h-8 rounded-[var(--radius-small)] ${item.color} flex items-center justify-center shrink-0`}>
                          {item.icon}
                        </div>
                        <div className="min-w-0">
                          <span className="text-xs font-bold block truncate">{item.label}</span>
                          <span className="text-[10.5px] text-[var(--text-tertiary)] block truncate font-normal">
                            {item.subtext}
                          </span>
                        </div>
                      </div>
                      <Plus size={14} className="text-[var(--text-tertiary)] shrink-0 ml-2" />
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Floating Action Button (FAB) Docked Cleanly Above Navigation */}
      <div className={`fixed bottom-[calc(4.25rem+env(safe-area-inset-bottom,0px))] z-40 transition-all duration-300 ease-out ${isOpen ? 'opacity-0 pointer-events-none scale-75' : 'fab-scroll-hide opacity-100 scale-100'} ${getFabButtonPositionClass()}`}>
        <button
          ref={fabButtonRef}
          type="button"
          onClick={() => {
            triggerHaptic('selection');
            setIsOpen(true);
          }}
          aria-label="Open quick add menu"
          aria-expanded={isOpen}
          className="min-w-[50px] min-h-[50px] w-12.5 h-12.5 rounded-full bg-[var(--accent-blue)] text-white flex items-center justify-center shadow-[0_6px_20px_rgba(59,130,246,0.4)] ios-press transition-all outline-none cursor-pointer active:scale-90"
        >
          <Plus size={24} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
