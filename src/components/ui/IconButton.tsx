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
      className={`flex items-center justify-center w-8 h-8 rounded-[10px] text-[#6e6e73] hover:text-[#007aff] hover:bg-[#f2f2f7] dark:text-[#98989d] dark:hover:text-[#60a5fa] dark:hover:bg-zinc-850 transition-all duration-150 outline-none active:scale-[0.97] border border-transparent ${className}`}
      {...props}
    >
      {icon}
    </button>
  );
}
