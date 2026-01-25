import { type HTMLAttributes, forwardRef, type ElementType } from 'react';
import { cn } from '@/lib/cn';

type BoxVariant = 'default' | 'document' | 'elevated';
type BoxPadding = 'none' | 'sm' | 'md' | 'lg' | 'xl';

interface BoxProps extends HTMLAttributes<HTMLDivElement> {
  /** Visual variant */
  variant?: BoxVariant;
  /** Padding size */
  padding?: BoxPadding;
  /** HTML element to render */
  as?: ElementType;
}

const variantStyles: Record<BoxVariant, string> = {
  default: 'bg-white',
  document: 'bg-white border border-slate-200 rounded-card shadow-document',
  elevated: 'bg-white border border-slate-200 rounded-card shadow-document-hover',
};

const paddingStyles: Record<BoxPadding, string> = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
  xl: 'p-10',
};

/**
 * Box - Base container component with variants
 * 
 * @example
 * <Box variant="document" padding="md">Content</Box>
 */
export const Box = forwardRef<HTMLDivElement, BoxProps>(
  ({ 
    variant = 'default', 
    padding = 'none', 
    as: Component = 'div', 
    className, 
    children, 
    ...props 
  }, ref) => {
    return (
      <Component
        ref={ref}
        className={cn(
          variantStyles[variant], 
          paddingStyles[padding], 
          className
        )}
        {...props}
      >
        {children}
      </Component>
    );
  }
);

Box.displayName = 'Box';
