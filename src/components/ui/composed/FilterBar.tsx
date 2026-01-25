import { cn } from '@/lib/cn';
import { Select } from '@/components/ui/primitives/Select';
import { Input } from '@/components/ui/primitives/Input';
import { Button } from '@/components/ui/primitives/Button';
import { Filter, Search, X } from 'lucide-react';

interface FilterOption {
  value: string;
  label: string;
}

interface FilterBarProps {
  /** Search value */
  searchValue?: string;
  /** Search change handler */
  onSearchChange?: (value: string) => void;
  /** Search placeholder */
  searchPlaceholder?: string;
  /** Status filter options */
  statusOptions?: FilterOption[];
  /** Selected status */
  statusValue?: string;
  /** Status change handler */
  onStatusChange?: (value: string) => void;
  /** Additional filters (render prop) */
  additionalFilters?: React.ReactNode;
  /** Clear all handler */
  onClearAll?: () => void;
  /** Show clear button */
  showClear?: boolean;
  /** Additional class names */
  className?: string;
}

/**
 * FilterBar - Reusable filter bar for lists/tables
 * 
 * @example
 * <FilterBar
 *   searchValue={search}
 *   onSearchChange={setSearch}
 *   statusOptions={[{ value: 'all', label: 'Todos' }]}
 *   statusValue={status}
 *   onStatusChange={setStatus}
 * />
 */
export function FilterBar({
  searchValue = '',
  onSearchChange,
  searchPlaceholder = 'Buscar...',
  statusOptions,
  statusValue,
  onStatusChange,
  additionalFilters,
  onClearAll,
  showClear = false,
  className,
}: FilterBarProps) {
  const hasFilters = searchValue || (statusValue && statusValue !== 'all');

  return (
    <div className={cn(
      'bg-white border border-slate-200 rounded-card p-4 shadow-sm',
      className
    )}>
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        {/* Filter label */}
        <div className="flex items-center gap-2 text-slate-600 flex-shrink-0">
          <Filter className="w-4 h-4" />
          <span className="text-sm font-medium font-sans">Filtros:</span>
        </div>

        {/* Search input */}
        {onSearchChange && (
          <div className="flex-1 max-w-sm">
            <Input
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={searchPlaceholder}
              leftAdornment={<Search className="w-4 h-4" />}
              className="py-2"
            />
          </div>
        )}

        {/* Status filter */}
        {statusOptions && onStatusChange && (
          <div className="w-full sm:w-48">
            <Select
              value={statusValue}
              onChange={(e) => onStatusChange(e.target.value)}
              options={statusOptions}
              className="py-2"
            />
          </div>
        )}

        {/* Additional filters slot */}
        {additionalFilters}

        {/* Clear button */}
        {showClear && hasFilters && onClearAll && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearAll}
            leftIcon={<X className="w-4 h-4" />}
            className="flex-shrink-0"
          >
            Limpiar
          </Button>
        )}
      </div>
    </div>
  );
}
