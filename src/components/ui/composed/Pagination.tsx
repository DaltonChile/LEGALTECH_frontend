import { cn } from '@/lib/cn';
import { Button } from '@/components/ui/primitives/Button';
import { Text } from '@/components/ui/primitives/Text';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  /** Current page (1-indexed) */
  currentPage: number;
  /** Total number of pages */
  totalPages: number;
  /** Total number of items */
  totalItems?: number;
  /** Items per page */
  itemsPerPage?: number;
  /** Page change handler */
  onPageChange: (page: number) => void;
  /** Show item count info */
  showItemInfo?: boolean;
  /** Additional class names */
  className?: string;
}

/**
 * Pagination - Page navigation component
 * 
 * @example
 * <Pagination
 *   currentPage={1}
 *   totalPages={10}
 *   onPageChange={setPage}
 * />
 */
export function Pagination({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage = 10,
  onPageChange,
  showItemInfo = true,
  className,
}: PaginationProps) {
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems || currentPage * itemsPerPage);

  // Generate page numbers to show
  const getPageNumbers = () => {
    const pages: (number | 'ellipsis')[] = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      // Show all pages
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Show first, last, current and neighbors
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i);
        pages.push('ellipsis');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('ellipsis');
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push('ellipsis');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
        pages.push('ellipsis');
        pages.push(totalPages);
      }
    }

    return pages;
  };

  if (totalPages <= 1) return null;

  return (
    <div className={cn(
      'bg-white border border-slate-200 rounded-card p-4 shadow-sm',
      className
    )}>
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Item info */}
        {showItemInfo && totalItems && (
          <Text variant="body-sm" color="muted">
            Mostrando {startItem} - {endItem} de {totalItems} resultados
          </Text>
        )}

        {/* Page navigation */}
        <div className="flex items-center gap-1">
          {/* Previous button */}
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            leftIcon={<ChevronLeft className="w-4 h-4" />}
          >
            Anterior
          </Button>

          {/* Page numbers */}
          <div className="hidden sm:flex items-center gap-1 mx-2">
            {getPageNumbers().map((page, index) => (
              page === 'ellipsis' ? (
                <span 
                  key={`ellipsis-${index}`} 
                  className="px-2 text-slate-400"
                >
                  ...
                </span>
              ) : (
                <button
                  key={page}
                  onClick={() => onPageChange(page)}
                  className={cn(
                    'px-3 py-1.5 text-sm font-medium rounded-md transition-colors',
                    currentPage === page
                      ? 'bg-navy-900 text-white'
                      : 'text-slate-700 hover:bg-slate-100'
                  )}
                >
                  {page}
                </button>
              )
            ))}
          </div>

          {/* Mobile page indicator */}
          <span className="sm:hidden text-sm text-slate-600 mx-4">
            {currentPage} / {totalPages}
          </span>

          {/* Next button */}
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            rightIcon={<ChevronRight className="w-4 h-4" />}
          >
            Siguiente
          </Button>
        </div>
      </div>
    </div>
  );
}
