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
      className={`flex items-center justify-center w-9 h-9 min-w-[36px] min-h-[36px] sm:w-8 sm:h-8 rounded-[10px] text-[var(--text-tertiary)] hover:text-[var(--accent-blue)] hover:bg-[var(--surface-secondary)] transition-colors duration-150 outline-none ios-press border border-transparent ${className}`}
      {...props}
    >
      {icon}
    </button>
  );
}
