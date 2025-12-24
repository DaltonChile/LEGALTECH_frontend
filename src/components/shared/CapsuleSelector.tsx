import { useState } from 'react';

interface Capsule {
  id: number;
  title: string;
  price: number;
  form_schema?: any[];
  legal_text?: string;
}

interface CapsuleSelectorProps {
  capsules: Capsule[];
  selectedCapsules: number[];
  onSelectionChange: (selectedIds: number[]) => void;
  basePrice: number;
}

export function CapsuleSelector({
  capsules,
  selectedCapsules,
  onSelectionChange,
  basePrice,
}: CapsuleSelectorProps) {
  const [expandedCapsule, setExpandedCapsule] = useState<number | null>(null);

  const handleToggleCapsule = (capsuleId: number) => {
    if (selectedCapsules.includes(capsuleId)) {
      onSelectionChange(selectedCapsules.filter((id) => id !== capsuleId));
    } else {
      onSelectionChange([...selectedCapsules, capsuleId]);
    }
  };

  const toggleExpand = (capsuleId: number) => {
    setExpandedCapsule(expandedCapsule === capsuleId ? null : capsuleId);
  };

  const calculateTotalPrice = () => {
    const capsulesPrice = capsules
      .filter((c) => selectedCapsules.includes(c.id))
      .reduce((sum, c) => sum + c.price, 0);
    return basePrice + capsulesPrice;
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  if (capsules.length === 0) {
    return (
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-slate-200 p-8 text-center text-slate-500">
        Este contrato no tiene cláusulas opcionales disponibles
        <div className="mt-4">
          <button
            onClick={() => window.location.href = '#editor'}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 via-cyan-500 to-lime-500 text-white rounded-xl hover:shadow-lg transition-all font-semibold"
          >
            Continuar al editor →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-slate-900 mb-3">Cláusulas Opcionales</h2>
        <p className="text-slate-600 text-lg">
          Selecciona las cláusulas adicionales que deseas incluir en tu contrato
        </p>
      </div>

      {/* Capsules List */}
      <div className="space-y-4">
        {capsules.map((capsule) => {
          const isSelected = selectedCapsules.includes(capsule.id);
          const isExpanded = expandedCapsule === capsule.id;

          return (
            <div
              key={capsule.id}
              className={`bg-white rounded-xl border-2 transition-all ${
                isSelected ? 'border-cyan-500 ring-2 ring-cyan-200' : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              {/* Capsule Header */}
              <div className="p-6">
                <div className="flex items-start space-x-4">
                  {/* Checkbox */}
                  <div className="flex-shrink-0 mt-1">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleToggleCapsule(capsule.id)}
                      className="h-6 w-6 text-cyan-600 focus:ring-2 focus:ring-cyan-500 border-slate-300 rounded cursor-pointer"
                    />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <h3 className="text-lg font-semibold text-slate-900">{capsule.title}</h3>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-lg font-bold text-cyan-600">
                          {capsule.price === 0 ? 'Gratis' : formatPrice(capsule.price)}
                        </span>
                        {/* Expand/Collapse button */}
                        <button
                          onClick={() => toggleExpand(capsule.id)}
                          className="p-1 text-slate-400 hover:text-slate-600 transition-colors"
                          aria-label={isExpanded ? 'Contraer' : 'Ver detalles'}
                        >
                          <svg
                            className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 9l-7 7-7-7"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>

                    {/* Short description */}
                    {!isExpanded && capsule.legal_text && (
                      <p className="mt-2 text-sm text-slate-600 line-clamp-2">
                        {capsule.legal_text.substring(0, 150)}
                        {capsule.legal_text.length > 150 ? '...' : ''}
                      </p>
                    )}

                    {/* Expanded content */}
                    {isExpanded && (
                      <div className="mt-4 pl-4 border-l-2 border-cyan-300">
                        {capsule.legal_text && (
                          <>
                            <h4 className="text-sm font-medium text-slate-700 mb-2">Texto completo:</h4>
                            <p className="text-sm text-slate-600 whitespace-pre-wrap">{capsule.legal_text}</p>
                          </>
                        )}

                        {capsule.form_schema && capsule.form_schema.length > 0 && (
                          <div className="mt-3">
                            <h4 className="text-sm font-medium text-slate-700 mb-2">
                              Campos adicionales ({capsule.form_schema.length}):
                            </h4>
                            <div className="flex flex-wrap gap-2">
                              {capsule.form_schema.map((field: any, idx: number) => (
                                <span
                                  key={idx}
                                  className="px-2 py-1 bg-slate-100 text-slate-700 text-xs rounded font-mono"
                                >
                                  {field.variable_name || field.name || 'campo'}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Price Summary */}
      <div className="bg-white rounded-xl border-2 border-slate-200 p-6">
        <div className="space-y-4">
          <div className="flex justify-between text-slate-600">
            <span>Precio base del contrato</span>
            <span className="font-medium">{formatPrice(basePrice)}</span>
          </div>

          {selectedCapsules.length > 0 && (
            <>
              <div className="flex justify-between text-slate-600">
                <span>Cláusulas opcionales ({selectedCapsules.length})</span>
                <span className="font-medium">
                  {formatPrice(
                    capsules
                      .filter((c) => selectedCapsules.includes(c.id))
                      .reduce((sum, c) => sum + c.price, 0)
                  )}
                </span>
              </div>

              <div className="border-t-2 border-slate-200 pt-4 mt-1">
                <div className="flex justify-between items-baseline">
                  <span className="text-2xl font-bold text-slate-900">Total</span>
                  <span className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-cyan-500 to-lime-500 bg-clip-text text-transparent">
                    {formatPrice(calculateTotalPrice())}
                  </span>
                </div>
              </div>
            </>
          )}

          {selectedCapsules.length === 0 && (
            <div className="border-t-2 border-slate-200 pt-4 mt-1">
              <div className="flex justify-between items-baseline">
                <span className="text-2xl font-bold text-slate-900">Total</span>
                <span className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-cyan-500 to-lime-500 bg-clip-text text-transparent">
                  {formatPrice(basePrice)}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
