import { ButtonHTMLAttributes } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: 'sm' | 'md' | 'lg';
}

export function Button({
  children,
  variant = 'secondary',
  size = 'md',
  className = '',
  ...props
}: ButtonProps) {
  const baseClasses = 'inline-flex items-center justify-center font-semibold rounded-[14px] transition-all duration-180 outline-none active:scale-[0.97] disabled:opacity-50 disabled:pointer-events-none';
  
  const variantClasses = {
    primary: 'bg-[#007aff] text-white hover:bg-[#0062cc] active:bg-[#0052a3]',
    secondary: 'bg-[#f2f2f7] text-[#007aff] hover:bg-[#e5e5ea] dark:bg-zinc-800 dark:text-[#60a5fa] dark:hover:bg-zinc-700',
    ghost: 'bg-transparent text-[#007aff] hover:bg-[#eaf3ff] dark:text-[#60a5fa] dark:hover:bg-blue-950/20',
    danger: 'bg-[#ff3b30] text-white hover:bg-[#e0241b]',
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-5 py-2.5 text-base',
  };

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
