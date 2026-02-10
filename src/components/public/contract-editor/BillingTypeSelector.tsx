import React, { useState, useCallback } from 'react';
import { FileText, Building2, ChevronDown, ChevronUp } from 'lucide-react';
import type { BillingData } from '../../../types/billing';

interface Props {
  buyerRut: string;
  onChange: (data: BillingData) => void;
}

const BillingTypeSelector: React.FC<Props> = ({ buyerRut, onChange }) => {
  const [billingType, setBillingType] = useState<'boleta' | 'factura'>('boleta');
  const [facturaData, setFacturaData] = useState({
    billing_rut: buyerRut || '',
    billing_razon_social: '',
    billing_giro: '',
    billing_direccion: '',
    billing_comuna: '',
    billing_ciudad: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [expanded, setExpanded] = useState(false);

  const handleTypeChange = useCallback((type: 'boleta' | 'factura') => {
    setBillingType(type);
    if (type === 'boleta') {
      setExpanded(false);
      onChange({ billing_type: 'boleta' });
    } else {
      setExpanded(true);
      onChange({
        billing_type: 'factura',
        ...facturaData,
      });
    }
  }, [facturaData, onChange]);

  const handleFieldChange = useCallback((field: string, value: string) => {
    const newData = { ...facturaData, [field]: value };
    setFacturaData(newData);

    // Clear error for field
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }

    onChange({
      billing_type: 'factura',
      ...newData,
    });
  }, [facturaData, errors, onChange]);

  const validateFacturaFields = useCallback(() => {
    const newErrors: Record<string, string> = {};
    if (!facturaData.billing_rut) newErrors.billing_rut = 'RUT es requerido';
    if (!facturaData.billing_razon_social) newErrors.billing_razon_social = 'Razón social es requerida';
    if (!facturaData.billing_giro) newErrors.billing_giro = 'Giro es requerido';
    if (!facturaData.billing_direccion) newErrors.billing_direccion = 'Dirección es requerida';
    if (!facturaData.billing_comuna) newErrors.billing_comuna = 'Comuna es requerida';
    if (!facturaData.billing_ciudad) newErrors.billing_ciudad = 'Ciudad es requerida';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [facturaData]);

  return (
    <div className="bg-slate-50 rounded-lg p-5 border border-slate-100">
      <h3 className="font-semibold text-navy-900 mb-3 flex items-center gap-2 font-sans text-sm">
        <FileText className="w-4 h-4" />
        Tipo de documento tributario
      </h3>

      {/* Type selector */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        <button
          type="button"
          onClick={() => handleTypeChange('boleta')}
          className={`flex items-center gap-2 p-3 rounded-lg border-2 transition-all text-left ${
            billingType === 'boleta'
              ? 'border-navy-900 bg-navy-50 text-navy-900'
              : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
          }`}
        >
          <FileText className={`w-5 h-5 ${billingType === 'boleta' ? 'text-navy-900' : 'text-slate-400'}`} />
          <div>
            <p className="font-medium text-sm font-sans">Boleta</p>
            <p className="text-xs text-slate-500 font-sans">Persona natural</p>
          </div>
        </button>

        <button
          type="button"
          onClick={() => handleTypeChange('factura')}
          className={`flex items-center gap-2 p-3 rounded-lg border-2 transition-all text-left ${
            billingType === 'factura'
              ? 'border-navy-900 bg-navy-50 text-navy-900'
              : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
          }`}
        >
          <Building2 className={`w-5 h-5 ${billingType === 'factura' ? 'text-navy-900' : 'text-slate-400'}`} />
          <div>
            <p className="font-medium text-sm font-sans">Factura</p>
            <p className="text-xs text-slate-500 font-sans">Empresa</p>
          </div>
        </button>
      </div>

      {/* Factura fields */}
      {billingType === 'factura' && (
        <div className="space-y-3 mt-4 pt-4 border-t border-slate-200">
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="flex items-center justify-between w-full text-sm font-medium text-navy-900 font-sans"
          >
            <span>Datos de facturación</span>
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {expanded && (
            <div className="space-y-3 animate-in slide-in-from-top-2">
              {/* RUT Empresa */}
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1 font-sans">
                  RUT Empresa *
                </label>
                <input
                  type="text"
                  value={facturaData.billing_rut}
                  onChange={(e) => handleFieldChange('billing_rut', e.target.value)}
                  onBlur={validateFacturaFields}
                  placeholder="12.345.678-9"
                  className={`w-full px-3 py-2 text-sm border rounded-lg font-sans focus:outline-none focus:ring-2 focus:ring-navy-500 ${
                    errors.billing_rut ? 'border-red-300 bg-red-50' : 'border-slate-200'
                  }`}
                />
                {errors.billing_rut && (
                  <p className="text-xs text-red-500 mt-1 font-sans">{errors.billing_rut}</p>
                )}
              </div>

              {/* Razón Social */}
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1 font-sans">
                  Razón Social *
                </label>
                <input
                  type="text"
                  value={facturaData.billing_razon_social}
                  onChange={(e) => handleFieldChange('billing_razon_social', e.target.value)}
                  onBlur={validateFacturaFields}
                  placeholder="Mi Empresa SpA"
                  className={`w-full px-3 py-2 text-sm border rounded-lg font-sans focus:outline-none focus:ring-2 focus:ring-navy-500 ${
                    errors.billing_razon_social ? 'border-red-300 bg-red-50' : 'border-slate-200'
                  }`}
                />
                {errors.billing_razon_social && (
                  <p className="text-xs text-red-500 mt-1 font-sans">{errors.billing_razon_social}</p>
                )}
              </div>

              {/* Giro */}
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1 font-sans">
                  Giro *
                </label>
                <input
                  type="text"
                  value={facturaData.billing_giro}
                  onChange={(e) => handleFieldChange('billing_giro', e.target.value)}
                  onBlur={validateFacturaFields}
                  placeholder="Actividad comercial"
                  className={`w-full px-3 py-2 text-sm border rounded-lg font-sans focus:outline-none focus:ring-2 focus:ring-navy-500 ${
                    errors.billing_giro ? 'border-red-300 bg-red-50' : 'border-slate-200'
                  }`}
                />
                {errors.billing_giro && (
                  <p className="text-xs text-red-500 mt-1 font-sans">{errors.billing_giro}</p>
                )}
              </div>

              {/* Dirección */}
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1 font-sans">
                  Dirección *
                </label>
                <input
                  type="text"
                  value={facturaData.billing_direccion}
                  onChange={(e) => handleFieldChange('billing_direccion', e.target.value)}
                  onBlur={validateFacturaFields}
                  placeholder="Calle 123, Oficina 456"
                  className={`w-full px-3 py-2 text-sm border rounded-lg font-sans focus:outline-none focus:ring-2 focus:ring-navy-500 ${
                    errors.billing_direccion ? 'border-red-300 bg-red-50' : 'border-slate-200'
                  }`}
                />
                {errors.billing_direccion && (
                  <p className="text-xs text-red-500 mt-1 font-sans">{errors.billing_direccion}</p>
                )}
              </div>

              {/* Comuna + Ciudad */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1 font-sans">
                    Comuna *
                  </label>
                  <input
                    type="text"
                    value={facturaData.billing_comuna}
                    onChange={(e) => handleFieldChange('billing_comuna', e.target.value)}
                    onBlur={validateFacturaFields}
                    placeholder="Santiago"
                    className={`w-full px-3 py-2 text-sm border rounded-lg font-sans focus:outline-none focus:ring-2 focus:ring-navy-500 ${
                      errors.billing_comuna ? 'border-red-300 bg-red-50' : 'border-slate-200'
                    }`}
                  />
                  {errors.billing_comuna && (
                    <p className="text-xs text-red-500 mt-1 font-sans">{errors.billing_comuna}</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1 font-sans">
                    Ciudad *
                  </label>
                  <input
                    type="text"
                    value={facturaData.billing_ciudad}
                    onChange={(e) => handleFieldChange('billing_ciudad', e.target.value)}
                    onBlur={validateFacturaFields}
                    placeholder="Santiago"
                    className={`w-full px-3 py-2 text-sm border rounded-lg font-sans focus:outline-none focus:ring-2 focus:ring-navy-500 ${
                      errors.billing_ciudad ? 'border-red-300 bg-red-50' : 'border-slate-200'
                    }`}
                  />
                  {errors.billing_ciudad && (
                    <p className="text-xs text-red-500 mt-1 font-sans">{errors.billing_ciudad}</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default BillingTypeSelector;
