import { CreditCard } from 'lucide-react';

interface PaymentButtonProps {
  totalPrice: number;
  completionPercentage: number;
  isLoading: boolean;
  onContinue?: () => void;
}

export function PaymentButton({
  totalPrice,
  completionPercentage,
  isLoading,
  onContinue,
}: PaymentButtonProps) {
  const isDisabled = isLoading || completionPercentage < 100;

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-4">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-slate-600">Total a pagar</span>
        <span className="text-2xl font-bold text-slate-900">
          ${totalPrice.toLocaleString('es-CL')}
        </span>
      </div>
      <button
        onClick={onContinue}
        disabled={isDisabled}
        className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white py-3 rounded-xl text-sm font-semibold hover:from-blue-700 hover:to-cyan-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <CreditCard className="w-5 h-5" />
        Pagar y Firmar
      </button>
      {completionPercentage < 100 && (
        <p className="text-xs text-slate-500 text-center mt-2">
          Completa todos los campos para continuar
        </p>
      )}
    </div>
  );
}
