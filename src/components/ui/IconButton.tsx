import { ButtonHTMLAttributes, ReactNode } from 'react';

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: ReactNode;
  title: string;
}

export function IconButton({ icon, title, className = '', ...props }: IconButtonProps) {
  return (
    <button
      title={title}
      aria-label={title}
      className={`flex items-center justify-center w-8 h-8 min-w-[32px] min-h-[32px] sm:w-8 sm:h-8 rounded-[var(--radius-medium)] text-[var(--text-tertiary)] hover:text-[var(--accent-blue)] hover:bg-[var(--surface-secondary)] transition-colors duration-150 outline-none ios-press border border-transparent shrink-0 ${className}`}
      {...props}
    >
      {icon}
    </button>
  );
}
