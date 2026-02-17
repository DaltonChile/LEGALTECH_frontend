import { Badge, type BadgeVariant } from '@/components/ui/primitives/Badge';

/**
 * Contract status type
 */
export type ContractStatus =
  | 'draft'
  | 'pending_payment'
  | 'paid'
  | 'waiting_signatures'
  | 'waiting_notary'
  | 'completed'
  | 'rejected'
  | 'expired'
  | 'failed';

interface StatusConfig {
  label: string;
  variant: BadgeVariant;
}

const statusConfig: Record<ContractStatus, StatusConfig> = {
  draft: {
    label: 'Borrador',
    variant: 'draft'
  },
  pending_payment: {
    label: 'Pend. Pago',
    variant: 'pending'
  },
  paid: {
    label: 'Pagado',
    variant: 'success'
  },
  waiting_signatures: {
    label: 'Esp. Firmas',
    variant: 'info'
  },
  waiting_notary: {
    label: 'Esp. Notario',
    variant: 'warning'
  },
  completed: {
    label: 'Completado',
    variant: 'success'
  },
  rejected: {
    label: 'Rechazado',
    variant: 'error'
  },
  expired: {
    label: 'Expirado',
    variant: 'draft'
  },
  failed: {
    label: 'Fallido',
    variant: 'error'
  }
};

interface StatusBadgeProps {
  /** Contract status */
  status: ContractStatus;
  /** Show status dot */
  dot?: boolean;
  /** Size variant */
  size?: 'sm' | 'md';
  /** Additional class names */
  className?: string;
}

/**
 * StatusBadge - Contract-specific status indicator
 * 
 * @example
 * <StatusBadge status="completed" />
 * <StatusBadge status="pending_payment" size="sm" />
 */
export function StatusBadge({
  status,
  dot = true,
  size = 'md',
  className
}: StatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.draft;

  return (
    <Badge
      variant={config.variant}
      dot={dot}
      size={size}
      className={className}
    >
      {config.label}
    </Badge>
  );
}

/**
 * Helper to get status label without rendering
 */
export function getStatusLabel(status: ContractStatus): string {
  return statusConfig[status]?.label || 'Desconocido';
}

/**
 * Helper to get status variant
 */
export function getStatusVariant(status: ContractStatus): BadgeVariant {
  return statusConfig[status]?.variant || 'draft';
}
