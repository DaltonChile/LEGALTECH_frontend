import { useState } from 'react';
import { Search, Edit3, Info } from 'lucide-react';
import { formatVariableName } from './utils/templateParser';

interface FieldsFormProps {
  variables: string[];
  formData: Record<string, string>;
  onFormChange: (data: Record<string, string>) => void;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  activeField: string | null;
  onFieldFocus: (variable: string) => void;
  onFieldBlur: () => void;
}

export function FieldsForm({
  variables,
  formData,
  onFormChange,
  searchTerm,
  onSearchChange,
  activeField,
  onFieldFocus,
  onFieldBlur,
}: FieldsFormProps) {
  const [showTooltip, setShowTooltip] = useState<string | null>(null);

  const isFieldEmpty = (variable: string): boolean => {
    return !formData[variable] || formData[variable].trim() === '';
  };

  const getFieldDescription = (variable: string): string => {
    // Descripciones personalizadas para campos comunes
    const descriptions: Record<string, string> = {
      'ciudad': 'Ciudad donde se firma el contrato',
      'dia': 'Día del mes en que se firma',
      'mes': 'Mes en que se firma el contrato',
      'año': 'Año de la firma del contrato',
      'nombre_completo_arrendador': 'Nombre completo de quien arrienda el inmueble',
      'nacionalidad_arrendador': 'Nacionalidad del arrendador',
      'estado_civil_arrendador': 'Estado civil actual del arrendador',
      'rut_arrendador': 'RUT del arrendador sin puntos y con guión',
      'profesion_arrendador': 'Profesión u ocupación del arrendador',
      'direccion_completa_arrendador': 'Dirección completa de residencia del arrendador',
      'comuna_arrendador': 'Comuna donde reside el arrendador',
      'email_arrendador': 'Email de contacto del arrendador',
      'nombre_completo_arrendatario': 'Nombre completo de quien arrienda (inquilino)',
      'nacionalidad_arrendatario': 'Nacionalidad del arrendatario',
      'estado_civil_arrendatario': 'Estado civil actual del arrendatario',
      'rut_arrendatario': 'RUT del arrendatario sin puntos y con guión',
      'profesion_arrendatario': 'Profesión u ocupación del arrendatario',
      'direccion_completa_arrendatario': 'Dirección completa de residencia del arrendatario',
      'comuna_arrendatario': 'Comuna donde reside el arrendatario',
      'email_arrendatario': 'Email de contacto del arrendatario',
      'calle_y_numero': 'Dirección completa del inmueble a arrendar',
      'comuna': 'Comuna donde se ubica el inmueble',
      'region': 'Región donde se ubica el inmueble',
      'descripcion_estacionamiento_bodega_etc': 'Detalles adicionales como estacionamiento, bodega, etc.',
    };
    
    return descriptions[variable.toLowerCase()] || `Información necesaria para el campo ${formatVariableName(variable)}`;
  };

  return (
    <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex-1 flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-br from-blue-600 to-cyan-600 p-5">
        <div className="flex items-center gap-3 p-6">
          <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
            <Edit3 className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="text-white/80 text-xs">Completa los campos</div>
            <div className="text-white font-semibold">Información requerida</div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="p-4 border-b border-slate-100 py-4 px-4">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 " />
          <input
            type="text"
            placeholder="Buscar campo..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Fields List */}
      <div className="flex-1 overflow-y-auto space-y-1.5 py-4 px-4">
        {variables.map((variable) => (
          <div 
            key={variable} 
            className={`flex items-center gap-3 p-2 rounded-lg transition-all duration-200 ${
              activeField === variable 
                ? 'bg-cyan-50 ring-2 ring-cyan-500' 
                : 'bg-white hover:bg-slate-50'
            }`}
          >
            <div className="flex-1">
              <label className="block text-xs text-slate-500 mb-1">
                {formatVariableName(variable)}
                {isFieldEmpty(variable) && <span className="text-red-500 ml-1">*</span>}
              </label>
              <input
                type="text"
                value={formData[variable] || ''}
                onChange={(e) => onFormChange({ ...formData, [variable]: e.target.value })}
                onFocus={() => onFieldFocus(variable)}
                onBlur={onFieldBlur}
                placeholder={`Ingresa ${formatVariableName(variable).toLowerCase()}`}
                className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-colors bg-white ${
                  isFieldEmpty(variable) 
                    ? 'border-red-200' 
                    : 'border-slate-200'
                }`}
              />
            </div>
            
            {/* Info Button */}
            <div className="relative">
              <button
                type="button"
                onMouseEnter={() => setShowTooltip(variable)}
                onMouseLeave={() => setShowTooltip(null)}
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 transition-colors"
              >
                <Info className="w-4 h-4" />
              </button>
              
              {/* Tooltip */}
              {showTooltip === variable && (
                <div className="absolute right-0 top-10 z-50 w-64 bg-slate-900 text-white text-xs rounded-lg p-3 shadow-xl">
                  <div className="absolute -top-2 right-3 w-0 h-0 border-l-8 border-r-8 border-b-8 border-transparent border-b-slate-900"></div>
                  {getFieldDescription(variable)}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
