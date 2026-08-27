import { ReactNode } from 'react';

// Reusable SVG illustrations to save bundle space
function FDIllustration() {
  return (
    <svg className="w-16 h-16 text-[var(--text-tertiary)] opacity-40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="3" y1="21" x2="21" y2="21" />
      <rect x="3" y="8" width="18" height="10" rx="2" />
      <path d="M10 22V8" />
      <path d="M14 22V8" />
      <path d="M12 2v6" />
      <path d="m9 5 3-3 3 3" />
    </svg>
  );
}

function StockIllustration() {
  return (
    <svg className="w-16 h-16 text-[var(--text-tertiary)] opacity-40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  );
}

function GoldIllustration() {
  return (
    <svg className="w-16 h-16 text-[var(--text-tertiary)] opacity-40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="8" cy="8" r="6" />
      <path d="M18.09 10.37A6 6 0 1 1 10.34 18" />
      <path d="M7 6h2v4H7z" />
      <path d="m14 12 2.5 2.5" />
    </svg>
  );
}

function RealEstateIllustration() {
  return (
    <svg className="w-16 h-16 text-[var(--text-tertiary)] opacity-40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}

function DocumentIllustration() {
  return (
    <svg className="w-16 h-16 text-[var(--text-tertiary)] opacity-40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  );
}

function DefaultIllustration() {
  return (
    <svg className="w-16 h-16 text-[var(--text-tertiary)] opacity-40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
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
      case 'documents':
      case 'insurance':
        return <DocumentIllustration />;
      default:
        return <DefaultIllustration />;
    }
  };

  return (
    <div 
      role="region" 
      aria-label={title}
      className="flex flex-col items-center justify-center py-12 px-6 text-center bg-[var(--surface)] border border-dashed border-[var(--border-subtle)] rounded-[var(--radius-large)] w-full max-w-lg mx-auto animate-fade-in"
    >
      <div className="mb-4 p-3 bg-[var(--surface-secondary)] rounded-[var(--radius-pill)] inline-flex items-center justify-center">
        {getIllustration()}
      </div>
      <h4 className="text-sm font-bold text-[var(--text-primary)] mb-1.5">{title}</h4>
      <p className="text-xs text-[var(--text-secondary)] max-w-sm leading-relaxed mb-6">{description}</p>
      {actionButton ? (
        actionButton
      ) : actionLabel && onAction ? (
        <button
          onClick={onAction}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-[var(--accent-blue)] text-[var(--surface)] font-bold text-xs rounded-[var(--radius-medium)] shadow-xs hover:opacity-90 ios-press cursor-pointer"
        >
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}
