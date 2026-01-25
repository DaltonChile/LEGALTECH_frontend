import { type HTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/cn';

type CardVariant = 'default' | 'document' | 'bordered' | 'elevated';
type AccentColor = 'navy' | 'emerald' | 'none';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** Visual variant */
  variant?: CardVariant;
  /** Show top accent border */
  accent?: boolean;
  /** Accent color */
  accentColor?: AccentColor;
  /** Enable hover effect */
  hover?: boolean;
  /** Padding */
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const variantStyles: Record<CardVariant, string> = {
  default: 'bg-white rounded-card',
  document: 'bg-white border border-slate-200 rounded-card shadow-document',
  bordered: 'bg-white border-2 border-slate-200 rounded-card',
  elevated: 'bg-white border border-slate-200 rounded-card shadow-document-hover',
};

const accentStyles: Record<Exclude<AccentColor, 'none'>, string> = {
  navy: 'border-t-4 border-t-navy-900',
  emerald: 'border-t-4 border-t-legal-emerald-700',
};

const paddingStyles = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
};

/**
 * Card - Container component for content sections
 * 
 * @example
 * <Card variant="document" accent hover>Content</Card>
 */
export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ 
    variant = 'default', 
    accent = false,
    accentColor = 'navy',
    hover = false,
    padding = 'none',
    className, 
    children, 
    ...props 
  }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          variantStyles[variant],
          accent && accentColor !== 'none' && accentStyles[accentColor],
          hover && 'hover:shadow-document-hover transition-shadow duration-200',
          paddingStyles[padding],
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';
