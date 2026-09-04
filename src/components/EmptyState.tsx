import { ReactNode } from 'react';

// Reusable SVG illustrations styled with design tokens
function FDIllustration() {
  return (
    <svg className="w-14 h-14 text-[var(--cyan,#06b6d4)]" viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <rect x="6" y="14" width="36" height="26" rx="4" className="stroke-[var(--border-subtle)] fill-[var(--surface-secondary)]" strokeWidth="2" />
      <path d="M14 22H34M14 28H26M14 34H22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.8" />
      <path d="M24 6L32 14H16L24 6Z" className="stroke-current fill-[var(--cyan,#06b6d4)]" strokeWidth="2" strokeLinejoin="round" fillOpacity="0.2" />
      <circle cx="34" cy="32" r="5" className="stroke-current fill-[var(--surface)]" strokeWidth="2" />
      <path d="M34 29.5V34.5M32.5 31H35.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function StockIllustration() {
  return (
    <svg className="w-14 h-14 text-[var(--accent-blue)]" viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <rect x="6" y="8" width="36" height="32" rx="4" className="stroke-[var(--border-subtle)] fill-[var(--surface-secondary)]" strokeWidth="2" />
      <path d="M12 32L20 22L28 27L36 16" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M30 16H36V22" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="20" cy="22" r="2.5" className="fill-current" />
      <circle cx="28" cy="27" r="2.5" className="fill-current" />
      <circle cx="36" cy="16" r="2.5" className="fill-current" />
    </svg>
  );
}

function GoldIllustration() {
  return (
    <svg className="w-14 h-14 text-[var(--gold,#facc15)]" viewBox="0 0 48 48" fill="none" aria-hidden="true">
      {/* Back bullion bar */}
      <path d="M14 16L20 10H38L32 16H14Z" className="stroke-current fill-[var(--gold,#facc15)]" strokeWidth="1.5" strokeLinejoin="round" fillOpacity="0.25" />
      <rect x="14" y="16" width="24" height="10" rx="1" className="stroke-current fill-[var(--surface-secondary)]" strokeWidth="1.5" />
      {/* Front bullion bar */}
      <path d="M8 28L14 22H32L26 28H8Z" className="stroke-current fill-[var(--gold,#facc15)]" strokeWidth="2" strokeLinejoin="round" fillOpacity="0.4" />
      <rect x="8" y="28" width="24" height="12" rx="1.5" className="stroke-current fill-[var(--surface)]" strokeWidth="2" />
      <circle cx="20" cy="34" r="3" className="stroke-current" strokeWidth="1.5" />
      {/* Sparkle */}
      <path d="M38 24L40 20L42 24L46 26L42 28L40 32L38 28L34 26L38 24Z" className="fill-[var(--gold,#facc15)]" />
    </svg>
  );
}

function RealEstateIllustration() {
  return (
    <svg className="w-14 h-14 text-[var(--positive)]" viewBox="0 0 48 48" fill="none" aria-hidden="true">
      {/* Main building */}
      <rect x="18" y="10" width="22" height="30" rx="2" className="stroke-current fill-[var(--surface-secondary)]" strokeWidth="2" />
      {/* Windows */}
      <rect x="23" y="15" width="4" height="4" rx="0.5" className="fill-current opacity-70" />
      <rect x="31" y="15" width="4" height="4" rx="0.5" className="fill-current opacity-70" />
      <rect x="23" y="23" width="4" height="4" rx="0.5" className="fill-current opacity-70" />
      <rect x="31" y="23" width="4" height="4" rx="0.5" className="fill-current opacity-70" />
      <rect x="27" y="32" width="6" height="8" rx="0.5" className="stroke-current fill-[var(--surface)]" strokeWidth="1.5" />
      {/* Side house */}
      <path d="M8 24L18 16V40H8V24Z" className="stroke-current fill-[var(--surface)]" strokeWidth="2" strokeLinejoin="round" />
      <rect x="11" y="28" width="3" height="4" rx="0.5" className="fill-current opacity-50" />
      {/* Ground line */}
      <line x1="4" y1="40" x2="44" y2="40" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.4" />
    </svg>
  );
}

function InsuranceIllustration() {
  return (
    <svg className="w-14 h-14 text-[var(--negative)]" viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <path d="M24 6L38 12V22C38 31.5 32 38.5 24 42C16 38.5 10 31.5 10 22V12L24 6Z" className="stroke-current fill-[var(--surface-secondary)]" strokeWidth="2" strokeLinejoin="round" />
      <path d="M18 23L22 27L30 18" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M24 10V38" stroke="currentColor" strokeWidth="1" strokeDasharray="2 2" opacity="0.3" />
    </svg>
  );
}

function DocumentIllustration() {
  return (
    <svg className="w-14 h-14 text-[var(--text-secondary)]" viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <rect x="10" y="8" width="28" height="34" rx="3" className="stroke-[var(--border-subtle)] fill-[var(--surface-secondary)]" strokeWidth="2" />
      <path d="M28 8V16H38" className="stroke-[var(--border-subtle)] fill-[var(--surface)]" strokeWidth="2" strokeLinejoin="round" />
      <line x1="16" y1="22" x2="32" y2="22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.7" />
      <line x1="16" y1="28" x2="28" y2="28" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.7" />
      <line x1="16" y1="34" x2="24" y2="34" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.7" />
      {/* Badge ribbon */}
      <circle cx="32" cy="34" r="4" className="stroke-[var(--accent-blue)] fill-[var(--surface)]" strokeWidth="1.5" />
      <path d="M30.5 37.5L29 42L32 40.5L35 42L33.5 37.5" fill="currentColor" opacity="0.5" />
    </svg>
  );
}

function DefaultIllustration() {
  return (
    <svg className="w-14 h-14 text-[var(--text-tertiary)]" viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <circle cx="24" cy="24" r="18" className="stroke-[var(--border-subtle)] fill-[var(--surface-secondary)]" strokeWidth="2" />
      <line x1="24" y1="16" x2="24" y2="26" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="24" cy="32" r="1.5" className="fill-current" />
    </svg>
  );
}

interface EmptyStateProps {
  type?: 'fd' | 'rd' | 'sip' | 'stocks' | 'gold' | 'real_estate' | 'insurance' | 'documents' | 'default';
  title: string;
  description: string;
  actionButton?: ReactNode;
  actionLabel?: string;
  onAction?: () => void;
}

export default function EmptyState({
  type = 'default',
  title,
  description,
  actionButton,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  const getIllustration = () => {
    switch (type) {
      case 'fd':
      case 'rd':
        return <FDIllustration />;
      case 'sip':
      case 'stocks':
        return <StockIllustration />;
      case 'gold':
        return <GoldIllustration />;
      case 'real_estate':
        return <RealEstateIllustration />;
      case 'insurance':
        return <InsuranceIllustration />;
      case 'documents':
        return <DocumentIllustration />;
      default:
        return <DefaultIllustration />;
    }
  };

  return (
    <div 
      role="region" 
      aria-label={title}
      className="flex flex-col items-center justify-center py-12 px-6 text-center bg-[var(--surface)] border border-dashed border-[var(--border-subtle)] rounded-[var(--radius-large)] w-full max-w-lg mx-auto animate-fade-in shadow-xs"
    >
      <div className="mb-4 p-3 bg-[var(--surface-secondary)] rounded-2xl inline-flex items-center justify-center ring-1 ring-[var(--border-subtle)]">
        {getIllustration()}
      </div>
      <h4 className="text-sm font-bold text-[var(--text-primary)] mb-1.5">{title}</h4>
      <p className="text-xs text-[var(--text-secondary)] max-w-sm leading-relaxed mb-6">{description}</p>
      {actionButton ? (
        actionButton
      ) : actionLabel && onAction ? (
        <button
          onClick={onAction}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-[var(--accent-blue)] text-[var(--surface)] font-bold text-xs rounded-[var(--radius-medium)] shadow-xs hover:opacity-90 active:scale-95 transition-transform cursor-pointer"
        >
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}
