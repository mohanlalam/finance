import { ReactNode } from 'react';

// Reusable SVG illustrations to save bundle space
function FDIllustration() {
  return (
    <svg className="w-16 h-16 text-slate-500/30 dark:text-slate-700/40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
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
    <svg className="w-16 h-16 text-slate-500/30 dark:text-slate-700/40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  );
}

function DocumentIllustration() {
  return (
    <svg className="w-16 h-16 text-slate-500/30 dark:text-slate-700/40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
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
    <svg className="w-16 h-16 text-slate-500/30 dark:text-slate-700/40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
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
}

export default function EmptyState({
  type = 'default',
  title,
  description,
  actionButton,
}: EmptyStateProps) {
  const getIllustration = () => {
    switch (type) {
      case 'fd':
      case 'rd':
        return <FDIllustration />;
      case 'sip':
      case 'stocks':
      case 'gold':
      case 'real_estate':
        return <StockIllustration />;
      case 'documents':
      case 'insurance':
        return <DocumentIllustration />;
      default:
        return <DefaultIllustration />;
    }
  };

  return (
    <div className="flex flex-col items-center justify-center py-12 px-6 text-center bg-slate-900/10 dark:bg-slate-950/20 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg mx-auto">
      <div className="mb-4 p-3 bg-slate-100 dark:bg-slate-900 rounded-full inline-flex items-center justify-center">
        {getIllustration()}
      </div>
      <h4 className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-1.5">{title}</h4>
      <p className="text-xs text-slate-400 max-w-sm leading-relaxed mb-6">{description}</p>
      {actionButton}
    </div>
  );
}
