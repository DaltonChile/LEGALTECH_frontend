import React from 'react';
import type { LucideIcon } from 'lucide-react';

type ButtonVariant = 'primary' | 'secondary' | 'success' | 'danger' | 'outline';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: LucideIcon;
  children: React.ReactNode;
  fullWidth?: boolean;
}

// Updated to match the new professional design system
const variantStyles: Record<ButtonVariant, string> = {
  primary: 'bg-navy-900 text-white hover:bg-navy-800 active:bg-navy-950',
  secondary: 'bg-white text-navy-900 border border-slate-300 hover:bg-slate-50 active:bg-slate-100',
  success: 'bg-legal-emerald-700 text-white hover:bg-legal-emerald-800 active:bg-legal-emerald-900',
  danger: 'bg-red-600 text-white hover:bg-red-700 active:bg-red-800',
  outline: 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50',
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2.5 text-sm',
  lg: 'px-6 py-3 text-base',
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
        rounded-md font-medium transition-all duration-200
        disabled:opacity-50 disabled:cursor-not-allowed
        flex items-center justify-center gap-2
        ${className}
      `}
      disabled={disabled}
      {...props}
    >
      {Icon && <Icon className="w-4 h-4" />}
      {children}
    </button>
  );
};
