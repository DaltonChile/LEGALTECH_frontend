import { Badge, type BadgeVariant } from '@/components/ui/primitives/Badge';

type PaymentStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';

interface PaymentStatusConfig {
  label: string;
  variant: BadgeVariant;
}

const paymentStatusConfig: Record<PaymentStatus, PaymentStatusConfig> = {
  approved: { label: 'Aprobado', variant: 'success' },
  pending: { label: 'Pendiente', variant: 'pending' },
  rejected: { label: 'Rechazado', variant: 'error' },
  cancelled: { label: 'Cancelado', variant: 'draft' },
};

interface PaymentStatusBadgeProps {
  status: PaymentStatus | null | undefined;
  size?: 'sm' | 'md';
  className?: string;
}

export function PaymentStatusBadge({ status, size = 'sm', className }: PaymentStatusBadgeProps) {
  if (!status) {
    return (
      <Badge variant="draft" size={size} dot={false} className={className}>
        Sin pago
      </Badge>
    );
  }

  const config = paymentStatusConfig[status] || paymentStatusConfig.pending;

  return (
    <Badge variant={config.variant} dot size={size} className={className}>
      {config.label}
    </Badge>
  );
}
