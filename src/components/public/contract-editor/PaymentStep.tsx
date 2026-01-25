import { useEffect, useRef } from 'react';

interface PaymentStepProps {
  contractId: string | null;
  trackingCode: string;
  buyerRut: string;
  totalAmount: number;
  steps: { id: string; label: string }[];
  hasSigners: boolean;
  onPaymentFailed: () => void;
  onBack: () => void;
}

export function PaymentStep({
  contractId,
  trackingCode,
  buyerRut,
  hasSigners,
}: PaymentStepProps) {
  const paymentInitiatedRef = useRef(false);

  useEffect(() => {
    // Redirigir inmediatamente a la página de pago sin mostrar pantalla intermedia
    if (contractId && !paymentInitiatedRef.current) {
      paymentInitiatedRef.current = true;
      window.location.href = `/payment/${contractId}?tracking_code=${trackingCode}&rut=${encodeURIComponent(buyerRut)}&hasSigners=${hasSigners}`;
    }
  }, [contractId, trackingCode, buyerRut, hasSigners]);

  // No renderizar nada visible - la redirección es instantánea
  return null;
}
