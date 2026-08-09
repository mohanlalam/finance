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
      className={`flex items-center justify-center w-8 h-8 rounded-lg text-[var(--text-tertiary)] hover:text-[var(--accent-blue)] hover:bg-[var(--surface-secondary)] transition-colors duration-150 outline-none active:scale-[0.97] border border-transparent ${className}`}
      {...props}
    >
      {icon}
    </button>
  );
}
