import { type SelectHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/cn';
import { ChevronDown } from 'lucide-react';

interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'children'> {
  /** Label text */
  label?: string;
  /** Error message */
  error?: string;
  /** Helper text */
  helperText?: string;
  /** Options array */
  options: SelectOption[];
  /** Placeholder text */
  placeholder?: string;
  /** Full width */
  fullWidth?: boolean;
}

/**
 * Select - Dropdown select component
 * 
 * @example
 * <Select 
 *   label="Status" 
 *   options={[{ value: 'active', label: 'Active' }]} 
 * />
 */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ 
    label, 
    error, 
    helperText,
    options,
    placeholder,
    fullWidth = true,
    className,
    id,
    ...props 
  }, ref) => {
    const selectId = id || label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className={cn('space-y-2', fullWidth && 'w-full')}>
        {label && (
          <label 
            htmlFor={selectId}
            className="block text-sm font-medium font-sans text-slate-700"
          >
            {label}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            className={cn(
              'w-full px-4 py-2.5 pr-10 text-base font-sans text-slate-900 bg-white border rounded-md transition-shadow appearance-none cursor-pointer',
              'focus:outline-none focus:ring-2 focus:border-transparent',
              error 
                ? 'border-red-300 focus:ring-red-500' 
                : 'border-slate-300 focus:ring-navy-900',
              'disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed',
              className
            )}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((option) => (
              <option 
                key={option.value} 
                value={option.value}
                disabled={option.disabled}
              >
                {option.label}
              </option>
            ))}
          </select>
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-500">
            <ChevronDown className="w-4 h-4" />
          </div>
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

Select.displayName = 'Select';
