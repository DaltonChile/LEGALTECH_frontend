import { cn } from '@/lib/cn';
import { Text } from '@/components/ui/primitives/Text';

interface Column<T> {
  /** Column key */
  key: string;
  /** Column header */
  header: string;
  /** Column width */
  width?: string;
  /** Render function */
  render?: (item: T) => React.ReactNode;
  /** Cell class name */
  className?: string;
}

interface DataTableProps<T> {
  /** Table columns */
  columns: Column<T>[];
  /** Table data */
  data: T[];
  /** Row key getter */
  getRowKey: (item: T) => string | number;
  /** Empty state message */
  emptyMessage?: string;
  /** Loading state */
  isLoading?: boolean;
  /** Row click handler */
  onRowClick?: (item: T) => void;
  /** Additional class names */
  className?: string;
}

/**
 * DataTable - Professional data table component
 * 
 * @example
 * <DataTable
 *   columns={[
 *     { key: 'name', header: 'Name' },
 *     { key: 'status', header: 'Status', render: (item) => <Badge>{item.status}</Badge> }
 *   ]}
 *   data={contracts}
 *   getRowKey={(item) => item.id}
 * />
 */
export function DataTable<T>({
  columns,
  data,
  getRowKey,
  emptyMessage = 'No hay datos para mostrar',
  isLoading = false,
  onRowClick,
  className,
}: DataTableProps<T>) {
  return (
    <div className={cn(
      'bg-white border border-slate-200 rounded-card shadow-document overflow-hidden',
      className
    )}>
      <div className="overflow-x-auto">
        <table className="w-full">
          {/* Header */}
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={cn(
                    'px-6 py-3 text-left text-xs font-medium font-sans text-slate-700 uppercase tracking-wider',
                    column.width && `w-[${column.width}]`
                  )}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>

          {/* Body */}
          <tbody className="divide-y divide-slate-200">
            {isLoading ? (
              // Loading state
              Array.from({ length: 5 }).map((_, index) => (
                <tr key={`skeleton-${index}`}>
                  {columns.map((column) => (
                    <td key={column.key} className="px-6 py-4">
                      <div className="h-4 bg-slate-200 rounded animate-pulse" />
                    </td>
                  ))}
                </tr>
              ))
            ) : data.length === 0 ? (
              // Empty state
              <tr>
                <td 
                  colSpan={columns.length} 
                  className="px-6 py-12 text-center"
                >
                  <Text variant="body" color="muted">
                    {emptyMessage}
                  </Text>
                </td>
              </tr>
            ) : (
              // Data rows
              data.map((item) => (
                <tr
                  key={getRowKey(item)}
                  onClick={() => onRowClick?.(item)}
                  className={cn(
                    'hover:bg-slate-50 transition-colors',
                    onRowClick && 'cursor-pointer'
                  )}
                >
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className={cn(
                        'px-6 py-4 text-sm font-sans text-slate-900',
                        column.className
                      )}
                    >
                      {column.render 
                        ? column.render(item) 
                        : String((item as Record<string, unknown>)[column.key] ?? '')
                      }
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
