import { Plus, Check } from 'lucide-react';
import type { Capsule } from './types';

interface CapsuleSelectorProps {
  capsules: Capsule[];
  selectedCapsules: number[];
  onToggle: (capsuleId: number) => void;
}

export function CapsuleSelector({
  capsules,
  selectedCapsules,
  onToggle,
}: CapsuleSelectorProps) {
  if (capsules.length === 0) return null;

  return (
    <div className="bg-white rounded-lg shadow-document border border-slate-200 overflow-hidden">
      <div className="w-full flex items-center justify-between p-4 bg-slate-50 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-navy-900 rounded-lg flex items-center justify-center">
            <Plus className="w-4 h-4 text-white" />
          </div>
          <div className="text-left">
            <div className="text-sm font-semibold text-navy-900 font-sans">Cláusulas opcionales</div>
            <div className="text-xs text-slate-500 font-sans">{selectedCapsules.length} seleccionadas</div>
          </div>
        </div>
      </div>
      
      <div className="divide-y divide-slate-100">
          {capsules.map((capsule) => {
            const isSelected = selectedCapsules.includes(capsule.id);
            return (
              <div
                key={capsule.id}
                onClick={() => onToggle(capsule.id)}
                className={`flex items-center gap-3 p-4 cursor-pointer transition-all ${
                  isSelected ? 'bg-legal-emerald-50' : 'bg-white hover:bg-slate-50'
                }`}
              >
                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                  isSelected ? 'bg-legal-emerald-600 border-legal-emerald-600' : 'border-slate-300 bg-white'
                }`}>
                  {isSelected && <Check className="w-3 h-3 text-white" />}
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-navy-900 font-sans">{capsule.title}</div>
                  {capsule.description && (
                    <div className="text-xs text-slate-500 font-sans">{capsule.description}</div>
                  )}
                </div>
                <div className={`text-xs font-bold px-2 py-1 rounded font-sans ${
                  isSelected ? 'bg-legal-emerald-100 text-legal-emerald-700' : 'bg-slate-100 text-slate-600'
                }`}>
                  +${capsule.price.toLocaleString('es-CL')}
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
}
