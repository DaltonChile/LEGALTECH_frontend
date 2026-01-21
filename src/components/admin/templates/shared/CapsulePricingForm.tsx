// LEGALTECH_frontend/src/components/admin/templates/shared/CapsulePricingForm.tsx
import React from 'react';
import type { CapsulePending } from '../../../../types/templates';

interface CapsulePricingFormProps {
  capsules: CapsulePending[];
  onPriceChange: (slug: string, price: string) => void;
  error?: string | null;
}

export const CapsulePricingForm: React.FC<CapsulePricingFormProps> = ({ 
  capsules, 
  onPriceChange,
  error 
}) => {
  return (
    <div className="space-y-4">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}
      
      <div className="space-y-3">
        {capsules.map((capsule) => (
          <div key={capsule.slug} className="p-4 bg-slate-50 rounded-xl border-2 border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h4 className="font-medium text-slate-900">{capsule.title}</h4>
                <p className="text-xs text-slate-500">{capsule.variables_count} variables detectadas</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-500">$</span>
                <input
                  type="number"
                  value={capsule.price || ''}
                  onChange={(e) => onPriceChange(capsule.slug, e.target.value)}
                  placeholder="10000"
                  min="0"
                  className="w-28 px-3 py-2 border-2 border-slate-200 rounded-lg focus:outline-none focus:border-cyan-400 transition-colors text-right"
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
