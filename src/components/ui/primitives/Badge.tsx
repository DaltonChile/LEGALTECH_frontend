import { type HTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/cn';

export type BadgeVariant = 'draft' | 'pending' | 'success' | 'error' | 'info' | 'warning';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  /** Visual variant */
  variant?: BadgeVariant;
  /** Show status dot */
  dot?: boolean;
  /** Size variant */
  size?: 'sm' | 'md';
}

const variantStyles: Record<BadgeVariant, string> = {
  draft: 'bg-slate-100 text-slate-700 border-slate-300',
  pending: 'bg-amber-50 text-amber-700 border-amber-300',
  success: 'bg-legal-emerald-50 text-legal-emerald-700 border-legal-emerald-300',
  error: 'bg-red-50 text-red-700 border-red-300',
  info: 'bg-blue-50 text-blue-700 border-blue-300',
  warning: 'bg-orange-50 text-orange-700 border-orange-300',
};

const dotStyles: Record<BadgeVariant, string> = {
  draft: 'bg-slate-600',
  pending: 'bg-amber-600',
  success: 'bg-legal-emerald-600',
  error: 'bg-red-600',
  info: 'bg-blue-600',
  warning: 'bg-orange-600',
};

const sizeStyles = {
  sm: 'px-2 py-1 text-xs',
  md: 'px-3 py-1.5 text-sm',
};

const dotSizeStyles = {
  sm: 'w-1.5 h-1.5',
  md: 'w-2 h-2',
};

/**
 * Badge - Status indicator component
 * 
 * @example
 * <Badge variant="success">Completado</Badge>
 * <Badge variant="pending" dot>En proceso</Badge>
 */
export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ 
    variant = 'info', 
    dot = true, 
    size = 'md',
    className, 
    children, 
    ...props 
  }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(
          'inline-flex items-center gap-1.5 border rounded-md font-medium font-sans',
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        {...props}
      >
        {dot && (
          <span 
            className={cn(
              'rounded-full flex-shrink-0',
              dotStyles[variant],
              dotSizeStyles[size]
            )} 
          />
        )}
        {children}
      </span>
    );
  }
);

Badge.displayName = 'Badge';
