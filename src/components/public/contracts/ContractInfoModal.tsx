import { X, ChevronDown } from 'lucide-react';
import { useState } from 'react';

interface Capsule {
  id: string;
  title: string;
  description?: string;
  price: number;
}

interface ContractInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: string;
  capsules?: Capsule[];
}

export function ContractInfoModal({ 
  isOpen, 
  onClose, 
  title, 
  description, 
  capsules 
}: ContractInfoModalProps) {
  const [expandedCapsule, setExpandedCapsule] = useState<string | null>(null);

  if (!isOpen) return null;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const toggleCapsule = (capsuleId: string) => {
    setExpandedCapsule(expandedCapsule === capsuleId ? null : capsuleId);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-document-hover max-w-2xl w-full max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="bg-navy-900 px-6 py-4 flex items-center justify-between">
          <h3 className="text-xl font-serif font-bold text-white">{title}</h3>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(80vh-80px)]">
          {/* Description */}
          <div className="mb-6">
            <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-2 font-sans">
              Descripción
            </h4>
            <p className="text-slate-700 leading-relaxed font-sans">
              {description}
            </p>
          </div>

          {/* Capsules */}
          {capsules && capsules.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3 font-sans">
                Cláusulas Opcionales ({capsules.length})
              </h4>
              <div className="space-y-2">
                {capsules.map((capsule) => (
                  <div
                    key={capsule.id}
                    className="border border-slate-200 rounded-lg overflow-hidden bg-slate-50"
                  >
                    <button
                      onClick={() => toggleCapsule(capsule.id)}
                      className="w-full flex items-center justify-between p-3 hover:bg-slate-100 transition-colors"
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <ChevronDown
                          className={`w-5 h-5 text-slate-400 transition-transform ${
                            expandedCapsule === capsule.id ? 'rotate-180' : ''
                          }`}
                        />
                        <span className="text-navy-900 font-medium text-left font-sans">{capsule.title}</span>
                      </div>
                      <span className="text-sm text-legal-emerald-600 font-semibold font-sans">
                        {formatPrice(capsule.price)}
                      </span>
                    </button>
                    {expandedCapsule === capsule.id && capsule.description && (
                      <div className="px-3 pb-3 pt-0 border-t border-slate-200 bg-white">
                        <p className="text-sm text-slate-600 leading-relaxed pt-3 font-sans">
                          {capsule.description}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {(!capsules || capsules.length === 0) && (
            <div className="mt-4">
              <p className="text-slate-500 text-sm italic font-sans">
                Este contrato no tiene cláusulas opcionales disponibles.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
