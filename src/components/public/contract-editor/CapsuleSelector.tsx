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
    <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
      <div className="w-full flex items-center justify-between p-4 bg-slate-50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
            <Plus className="w-4 h-4 text-white" />
          </div>
          <div className="text-left">
            <div className="text-sm font-semibold text-slate-900 px-4 py-4">Cláusulas opcionales</div>
            <div className="text-xs text-slate-500">{selectedCapsules.length} seleccionadas</div>
          </div>
        </div>
      </div>
      
      <div className="border-t border-slate-100 w-full space-y-2 py-4 px-4">
          {capsules.map((capsule) => {
            const isSelected = selectedCapsules.includes(capsule.id);
            return (
              <div
                key={capsule.id}
                onClick={() => onToggle(capsule.id)}
                className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all px-4 py-4 ${
                  isSelected ? 'bg-cyan-50 ring-2 ring-cyan-500' : 'bg-white hover:bg-slate-50'
                }`}
              >
                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                  isSelected ? 'bg-cyan-500 border-cyan-500' : 'border-slate-300 bg-white'
                }`}>
                  {isSelected && <Check className="w-3 h-3 text-green" />}
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-slate-900">{capsule.title}</div>
                  {capsule.description && (
                    <div className="text-xs text-slate-500">{capsule.description}</div>
                  )}
                </div>
                <div className={`text-xs font-bold px-4 py-4 rounded bg-cyan-500 text-white' : 'bg-slate-200 text-slate-600`}>
                  +${capsule.price.toLocaleString('es-CL')}
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
}
