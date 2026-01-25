import { Card } from '@/components/ui/primitives/Card';
import { Text } from '@/components/ui/primitives/Text';
import { Button } from '@/components/ui/primitives/Button';
import { StatusBadge, type ContractStatus } from '@/components/ui/composed/StatusBadge';
import { FileText, Eye, Edit, MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/cn';

interface DocumentCardProps {
  /** Document title */
  title: string;
  /** Document description */
  description?: string;
  /** Document status */
  status: ContractStatus;
  /** Creation date string */
  createdAt: string;
  /** Parties involved (optional) */
  parties?: string[];
  /** View callback */
  onView?: () => void;
  /** Edit callback */
  onEdit?: () => void;
  /** More options callback */
  onMoreOptions?: () => void;
  /** Additional class names */
  className?: string;
}

/**
 * DocumentCard - Contract/document card component
 * 
 * @example
 * <DocumentCard
 *   title="Contrato de Arrendamiento"
 *   description="Arrendamiento de inmueble residencial"
 *   status="completed"
 *   createdAt="25 de enero, 2026"
 *   onView={() => console.log('view')}
 * />
 */
export function DocumentCard({
  title,
  description,
  status,
  createdAt,
  parties,
  onView,
  onEdit,
  onMoreOptions,
  className,
}: DocumentCardProps) {
  return (
    <Card 
      variant="document" 
      accent 
      accentColor="navy" 
      hover
      className={cn('overflow-hidden', className)}
    >
      <div className="p-6 space-y-4">
        {/* Header */}
        <div className="flex items-start gap-4">
          {/* Icon */}
          <div className="p-3 bg-slate-100 rounded-lg flex-shrink-0">
            <FileText className="w-6 h-6 text-navy-900" />
          </div>
          
          {/* Title & Date */}
          <div className="flex-1 min-w-0 space-y-1">
            <Text variant="h3" className="truncate">{title}</Text>
            <Text variant="body-sm" color="muted">
              Creado el {createdAt}
            </Text>
          </div>
          
          {/* Status Badge */}
          <StatusBadge status={status} />
        </div>

        {/* Description */}
        {description && (
          <Text variant="body" color="secondary" className="line-clamp-2">
            {description}
          </Text>
        )}

        {/* Parties */}
        {parties && parties.length > 0 && (
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <span className="font-medium">Partes:</span>
            <span className="truncate">{parties.join(', ')}</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 pt-2">
          {onView && (
            <Button 
              variant="primary" 
              size="sm" 
              onClick={onView}
              leftIcon={<Eye className="w-4 h-4" />}
            >
              Ver Detalles
            </Button>
          )}
          {onEdit && (
            <Button 
              variant="secondary" 
              size="sm" 
              onClick={onEdit}
              leftIcon={<Edit className="w-4 h-4" />}
            >
              Editar
            </Button>
          )}
          {onMoreOptions && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onMoreOptions}
              className="ml-auto"
            >
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
