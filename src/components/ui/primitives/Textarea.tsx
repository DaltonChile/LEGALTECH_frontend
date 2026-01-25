import { type TextareaHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/cn';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  /** Label text */
  label?: string;
  /** Error message */
  error?: string;
  /** Helper text */
  helperText?: string;
  /** Full width */
  fullWidth?: boolean;
}

/**
 * Textarea - Multi-line text input component
 * 
 * @example
 * <Textarea label="Description" rows={4} />
 */
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ 
    label, 
    error, 
    helperText,
    fullWidth = true,
    className,
    id,
    rows = 4,
    ...props 
  }, ref) => {
    const textareaId = id || label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className={cn('space-y-2', fullWidth && 'w-full')}>
        {label && (
          <label 
            htmlFor={textareaId}
            className="block text-sm font-medium font-sans text-slate-700"
          >
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          rows={rows}
          className={cn(
            'w-full px-4 py-2.5 text-base font-sans text-slate-900 bg-white border rounded-md transition-shadow resize-y',
            'placeholder:text-slate-400',
            'focus:outline-none focus:ring-2 focus:border-transparent',
            error 
              ? 'border-red-300 focus:ring-red-500' 
              : 'border-slate-300 focus:ring-navy-900',
            'disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed',
            className
          )}
          {...props}
        />
        {error && (
          <p className="text-sm font-sans text-red-600">{error}</p>
        )}
        {helperText && !error && (
          <p className="text-sm font-sans text-slate-500">{helperText}</p>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
