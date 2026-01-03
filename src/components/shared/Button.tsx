import React from 'react';
import { LucideIcon } from 'lucide-react';

type ButtonVariant = 'primary' | 'secondary' | 'success' | 'danger' | 'outline';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: LucideIcon;
  children: React.ReactNode;
  fullWidth?: boolean;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: 'bg-cyan-100 text-slate-700 border-2 border-cyan-300 hover:bg-cyan-200',
  secondary: 'bg-white border-2 border-slate-200 text-slate-600 hover:border-slate-300',
  success: 'bg-green-100 text-green-700 border-2 border-green-300 hover:bg-green-200',
  danger: 'bg-red-100 text-red-700 border-2 border-red-300 hover:bg-red-200',
  outline: 'bg-white border-2 border-slate-300 text-slate-700 hover:bg-slate-50',
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-6 py-3 text-base',
  lg: 'px-8 py-4 text-lg',
};

export const Button: React.FC<ButtonProps> = ({ 
  variant = 'secondary', 
  size = 'md',
  icon: Icon,
  children, 
  fullWidth = false,
  className = '',
  disabled,
  ...props 
}) => {
  return (
    <button
      className={`
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${fullWidth ? 'w-full' : ''}
        rounded-2xl font-semibold transition-all shadow-sm
        disabled:opacity-50 disabled:cursor-not-allowed
        flex items-center justify-center gap-2
        ${className}
      `}
      disabled={disabled}
      {...props}
    >
      {Icon && <Icon className="w-5 h-5" />}
      {children}
    </button>
  );
};
