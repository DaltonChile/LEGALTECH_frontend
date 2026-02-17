import { Badge, type BadgeVariant } from '@/components/ui/primitives/Badge';

type DTEStatus = 'pending' | 'issued' | 'failed' | 'cancelled';

interface DTEStatusConfig {
  label: string;
  variant: BadgeVariant;
}

const dteStatusConfig: Record<DTEStatus, DTEStatusConfig> = {
  issued: { label: 'Emitido', variant: 'success' },
  pending: { label: 'Pendiente', variant: 'pending' },
  failed: { label: 'Fallido', variant: 'error' },
  cancelled: { label: 'Anulado', variant: 'draft' },
};

interface DTEStatusBadgeProps {
  status: DTEStatus | null | undefined;
  folio?: number | null;
  size?: 'sm' | 'md';
  className?: string;
}

export function DTEStatusBadge({ status, folio, size = 'sm', className }: DTEStatusBadgeProps) {
  if (!status) {
    return (
      <Badge variant="draft" size={size} dot={false} className={className}>
        N/A
      </Badge>
    );
  }

  const config = dteStatusConfig[status] || dteStatusConfig.pending;
  const label = status === 'issued' && folio ? `#${folio}` : config.label;

  return (
    <Badge variant={config.variant} dot size={size} className={className}>
      {label}
    </Badge>
  );
}
