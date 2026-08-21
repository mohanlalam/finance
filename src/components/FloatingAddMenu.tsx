import { useState, useEffect, useRef } from 'react';
import { Plus, TrendingUp, Landmark, Coins, Building2, Shield, FolderOpen, Clock, X, Sparkles } from './icons/AppIcons';

type FabPosition = 'right' | 'center' | 'left';

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
    return 'right'; // Default to right side to avoid blocking center text
  });
  const fabButtonRef = useRef<HTMLButtonElement>(null);

  const changePosition = (newPos: FabPosition) => {
    setPosition(newPos);
    try {
      localStorage.setItem('finance_fab_position', newPos);
    } catch { /* ignore */ }
  };

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

  const menuGroups = [
    {
      category: 'AI Powered',
      items: [
        {
          label: '✨ Smart AI Import',
          icon: <Sparkles size={16} aria-hidden="true" />,
          onClick: () => {
            onOpenSmartImport?.();
            setIsOpen(false);
          },
          color: 'bg-amber-500/20 text-amber-600 dark:text-amber-400 font-bold',
        },
      ],
    },
    {
      category: 'Market',
      items: [
        { label: 'Stock / ETF', icon: <TrendingUp size={16} aria-hidden="true" />, onClick: () => { onAddStock(); setIsOpen(false); }, color: 'bg-[var(--accent-blue-soft)] text-[var(--accent-blue)]' },
        { label: 'SIP Mutual Fund', icon: <TrendingUp size={16} aria-hidden="true" />, onClick: () => { onAddAsset('sip'); setIsOpen(false); }, color: 'bg-[var(--accent-blue-soft)] text-[var(--accent-blue)]' },
        { label: 'Gold Holding', icon: <Coins size={16} aria-hidden="true" />, onClick: () => { onAddAsset('gold'); setIsOpen(false); }, color: 'bg-[var(--warning-soft)] text-[var(--warning)]' },
      ],
    },
    {
      category: 'Deposits',
      items: [
        { label: 'Fixed Deposit', icon: <Landmark size={16} aria-hidden="true" />, onClick: () => { onAddAsset('fd'); setIsOpen(false); }, color: 'bg-[var(--surface-secondary)] text-[var(--text-primary)]' },
        { label: 'Recurring Deposit', icon: <Clock size={16} aria-hidden="true" />, onClick: () => { onAddAsset('rd'); setIsOpen(false); }, color: 'bg-[var(--surface-secondary)] text-[var(--text-secondary)]' },
      ],
    },
    {
      category: 'Property',
      items: [
        { label: 'Real Estate Property', icon: <Building2 size={16} aria-hidden="true" />, onClick: () => { onAddAsset('real_estate'); setIsOpen(false); }, color: 'bg-[var(--positive-soft)] text-[var(--positive)]' },
      ],
    },
    {
      category: 'Protection',
      items: [
        { label: 'Insurance Policy', icon: <Shield size={16} aria-hidden="true" />, onClick: () => { onAddAsset('insurance'); setIsOpen(false); }, color: 'bg-[var(--negative-soft)] text-[var(--negative)]' },
      ],
    },
    {
      category: 'Documents',
      items: [
        { label: 'Upload Document', icon: <FolderOpen size={16} aria-hidden="true" />, onClick: () => { onAddAsset('documents'); setIsOpen(false); }, color: 'bg-[var(--surface-secondary)] text-[var(--text-tertiary)]' },
      ],
    },
  ];

  const getPositionClasses = () => {
    switch (position) {
      case 'left':
        return 'left-2 right-auto items-start';
      case 'center':
        return 'left-0 right-0 items-center';
      case 'right':
      default:
        return 'right-2 left-auto items-end';
    }
  };

  return (
    <div className="md:hidden">
      {/* Backdrop */}
      {isOpen && (
        <div
          onClick={() => {
            setIsOpen(false);
            fabButtonRef.current?.focus();
          }}
          className="fixed inset-0 bg-[var(--backdrop-overlay)] z-40 transition-opacity duration-200"
          aria-hidden="true"
        />
      )}

      {/* Floating Menu Container with Safe Area Spacing */}
      <div className={`fixed bottom-[calc(4.5rem+env(safe-area-inset-bottom,0px))] z-50 flex flex-col gap-3 pointer-events-none px-3 transition-all duration-300 ease-out ${isOpen ? 'translate-y-0 opacity-100' : 'fab-scroll-hide'} ${getPositionClasses()}`}>
        {/* Categorized Quick-Add Card */}
        {isOpen && (
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Quick Add Asset Menu"
            className="pointer-events-auto w-full sm:w-80 max-h-[75vh] overflow-y-auto bg-[var(--surface)] border border-[var(--border-subtle)] rounded-t-[var(--radius-large)] sm:rounded-[var(--radius-large)] shadow-2xl p-4 mb-2 space-y-3 pb-safe sm:pb-4 apple-card animate-slide-up"
          >
            <div className="flex items-center justify-between pb-2 border-b border-[var(--border-subtle)] gap-2">
              <span className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider shrink-0">
                Quick Add Asset
              </span>

              {/* Position Switcher Controls */}
              <div className="flex items-center gap-1 bg-[var(--surface-secondary)] p-0.5 rounded-[var(--radius-small)] text-[10px]" role="radiogroup" aria-label="Button alignment">
                <button
                  onClick={() => changePosition('left')}
                  className={`px-1.5 py-0.5 rounded-[var(--radius-small)] font-bold transition-colors ios-press ${position === 'left' ? 'bg-[var(--accent-blue)] text-[var(--surface)] shadow-xs' : 'text-[var(--text-tertiary)] hover:text-[var(--text-primary)]'}`}
                  title="Move button to Left"
                  aria-checked={position === 'left'}
                  role="radio"
                >
                  Left ↙
                </button>
                <button
                  onClick={() => changePosition('center')}
                  className={`px-1.5 py-0.5 rounded-[var(--radius-small)] font-bold transition-colors ios-press ${position === 'center' ? 'bg-[var(--accent-blue)] text-[var(--surface)] shadow-xs' : 'text-[var(--text-tertiary)] hover:text-[var(--text-primary)]'}`}
                  title="Move button to Center"
                  aria-checked={position === 'center'}
                  role="radio"
                >
                  Center ⬇
                </button>
                <button
                  onClick={() => changePosition('right')}
                  className={`px-1.5 py-0.5 rounded-[var(--radius-small)] font-bold transition-colors ios-press ${position === 'right' ? 'bg-[var(--accent-blue)] text-[var(--surface)] shadow-xs' : 'text-[var(--text-tertiary)] hover:text-[var(--text-primary)]'}`}
                  title="Move button to Right"
                  aria-checked={position === 'right'}
                  role="radio"
                >
                  Right ↘
                </button>
              </div>

              <button
                onClick={() => {
                  setIsOpen(false);
                  fabButtonRef.current?.focus();
                }}
                className="w-8 h-8 min-w-[32px] min-h-[32px] flex items-center justify-center rounded-[var(--radius-medium)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-secondary)] ios-press transition-colors shrink-0"
                aria-label="Close add menu"
              >
                <X size={18} aria-hidden="true" />
              </button>
            </div>

            {menuGroups.map((group) => (
              <div key={group.category} className="space-y-1">
                <span className="px-2 text-[10px] font-extrabold uppercase tracking-wider text-[var(--text-tertiary)] block">
                  {group.category}
                </span>
                {group.items.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      item.onClick();
                      fabButtonRef.current?.focus();
                    }}
                    className="w-full flex items-center gap-3 px-2.5 py-2 min-h-[44px] rounded-[var(--radius-medium)] text-xs font-bold text-[var(--text-primary)] hover:bg-[var(--surface-secondary)] transition-colors text-left outline-none ios-press"
                  >
                    <div className={`w-7 h-7 rounded-[var(--radius-small)] ${item.color} flex items-center justify-center shrink-0`}>
                      {item.icon}
                    </div>
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            ))}
          </div>
        )}

        {/* Primary FAB Button (Min 44x44 Touch Target) */}
        <button
          ref={fabButtonRef}
          onClick={() => setIsOpen(!isOpen)}
          aria-label={isOpen ? 'Close quick add menu' : 'Open quick add menu'}
          aria-expanded={isOpen}
          className="pointer-events-auto min-w-[48px] min-h-[48px] w-12 h-12 rounded-[var(--radius-pill)] bg-[var(--accent-blue)] text-[var(--surface)] flex items-center justify-center shadow-lg ios-press transition-all outline-none"
        >
          <Plus
            size={22}
            className={`transition-transform duration-200 ${isOpen ? 'rotate-[135deg]' : ''}`}
            aria-hidden="true"
          />
        </button>
      </div>
    </div>
  );
}
