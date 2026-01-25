import { type HTMLAttributes, forwardRef, type ElementType } from 'react';
import { cn } from '@/lib/cn';

type TextVariant = 'display' | 'h1' | 'h2' | 'h3' | 'h4' | 'body-lg' | 'body' | 'body-sm' | 'caption';
type TextWeight = 'light' | 'normal' | 'medium' | 'semibold' | 'bold';
type TextColor = 'primary' | 'secondary' | 'muted' | 'inherit';

interface TextProps extends HTMLAttributes<HTMLElement> {
  /** Typography variant */
  variant?: TextVariant;
  /** Font weight override */
  weight?: TextWeight;
  /** Text color */
  color?: TextColor;
  /** HTML element to render */
  as?: ElementType;
}

// Variant to element mapping
const variantElementMap: Record<TextVariant, ElementType> = {
  display: 'h1',
  h1: 'h1',
  h2: 'h2',
  h3: 'h3',
  h4: 'h4',
  'body-lg': 'p',
  body: 'p',
  'body-sm': 'p',
  caption: 'span',
};

// Typography variant styles
const variantStyles: Record<TextVariant, string> = {
  display: 'text-5xl md:text-6xl font-serif font-bold text-navy-900 leading-tight',
  h1: 'text-4xl font-serif font-bold text-navy-900 leading-tight',
  h2: 'text-3xl font-serif font-bold text-navy-900',
  h3: 'text-2xl font-serif font-semibold text-navy-900',
  h4: 'text-xl font-serif font-semibold text-navy-900',
  'body-lg': 'text-lg font-sans leading-relaxed',
  body: 'text-base font-sans leading-normal',
  'body-sm': 'text-sm font-sans',
  caption: 'text-xs font-sans uppercase tracking-wide',
};

// Color styles
const colorStyles: Record<TextColor, string> = {
  primary: 'text-slate-900',
  secondary: 'text-slate-700',
  muted: 'text-slate-600',
  inherit: 'text-inherit',
};

// Weight styles
const weightStyles: Record<TextWeight, string> = {
  light: 'font-light',
  normal: 'font-normal',
  medium: 'font-medium',
  semibold: 'font-semibold',
  bold: 'font-bold',
};

// Check if variant already includes text color
const hasTextColor = (variant: TextVariant): boolean => {
  return ['display', 'h1', 'h2', 'h3', 'h4'].includes(variant);
};

// Check if variant already includes font weight
const hasFontWeight = (variant: TextVariant): boolean => {
  return ['display', 'h1', 'h2', 'h3', 'h4'].includes(variant);
};

/**
 * Text - Typography component with variants
 * 
 * @example
 * <Text variant="h1">Heading</Text>
 * <Text variant="body" color="muted">Paragraph text</Text>
 */
export const Text = forwardRef<HTMLElement, TextProps>(
  ({ 
    variant = 'body', 
    weight,
    color = 'secondary',
    as,
    className, 
    children, 
    ...props 
  }, ref) => {
    const Component = as || variantElementMap[variant];

    return (
      <Component
        ref={ref}
        className={cn(
          variantStyles[variant],
          // Only apply weight if not already in variant
          weight && !hasFontWeight(variant) && weightStyles[weight],
          // Only apply color if variant doesn't include it and color is not inherit
          !hasTextColor(variant) && color !== 'inherit' && colorStyles[color],
          className
        )}
        {...props}
      >
        {children}
      </Component>
    );
  }
);

Text.displayName = 'Text';
