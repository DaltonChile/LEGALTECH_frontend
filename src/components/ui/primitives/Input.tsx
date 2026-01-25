import { type InputHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/cn';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  /** Label text */
  label?: string;
  /** Error message */
  error?: string;
  /** Helper text */
  helperText?: string;
  /** Left icon/adornment */
  leftAdornment?: React.ReactNode;
  /** Right icon/adornment */
  rightAdornment?: React.ReactNode;
  /** Full width */
  fullWidth?: boolean;
}

/**
 * Input - Form input component with label and validation
 * 
 * @example
 * <Input label="Email" type="email" placeholder="you@example.com" />
 * <Input label="Search" leftAdornment={<SearchIcon />} />
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ 
    label, 
    error, 
    helperText,
    leftAdornment,
    rightAdornment,
    fullWidth = true,
    className,
    id,
    ...props 
  }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className={cn('space-y-2', fullWidth && 'w-full')}>
        {label && (
          <label 
            htmlFor={inputId}
            className="block text-sm font-medium font-sans text-slate-700"
          >
            {label}
          </label>
        )}
        <div className="relative">
          {leftAdornment && (
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-500">
              {leftAdornment}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              'w-full px-4 py-2.5 text-base font-sans text-slate-900 bg-white border rounded-md transition-shadow',
              'placeholder:text-slate-400',
              'focus:outline-none focus:ring-2 focus:border-transparent',
              error 
                ? 'border-red-300 focus:ring-red-500' 
                : 'border-slate-300 focus:ring-navy-900',
              'disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed',
              leftAdornment && 'pl-10',
              rightAdornment && 'pr-10',
              className
            )}
            {...props}
          />
          {rightAdornment && (
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-500">
              {rightAdornment}
            </div>
          )}
        </div>
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

Input.displayName = 'Input';
