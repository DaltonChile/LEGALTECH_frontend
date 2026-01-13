import { Search, Edit3, AlertCircle } from 'lucide-react';
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
  const isFieldEmpty = (variable: string): boolean => {
    return !formData[variable] || formData[variable].trim() === '';
  };

  // Función para detectar si una variable es un nombre
  const isNameField = (variable: string): boolean => {
    const varLower = variable.toLowerCase();
    return varLower.includes('nombre');
  };

  // Función para detectar si una variable es un RUT
  const isRutField = (variable: string): boolean => {
    const varLower = variable.toLowerCase();
    return varLower.includes('rut');
  };

  // Función para detectar si una variable es un email
  const isEmailField = (variable: string): boolean => {
    const varLower = variable.toLowerCase();
    return varLower.includes('email') || varLower.includes('correo') || varLower.includes('mail');
  };

  // Validación para campo nombre (mínimo 2 caracteres)
  const validateName = (value: string): string | null => {
    if (!value || value.trim() === '') return null; // No validar si está vacío
    if (value.trim().length < 2) {
      return 'El nombre debe tener al menos 2 caracteres';
    }
    return null;
  };

  // Validación para campo RUT (formato XXXXXXXX-X)
  const validateRut = (value: string): string | null => {
    if (!value || value.trim() === '') return null; // No validar si está vacío
    const rutPattern = /^\d{7,8}-[\dkK]$/;
    if (!rutPattern.test(value.trim())) {
      return 'Debe ser formato XXXXXXXX-X (sin puntos, con guion)';
    }
    return null;
  };

  // Validación para campo email
  const validateEmail = (value: string): string | null => {
    if (!value || value.trim() === '') return null; // No validar si está vacío
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(value.trim())) {
      return 'Debe ser un email válido (ejemplo@dominio.com)';
    }
    return null;
  };

  // Función para obtener el error de validación de un campo
  const getFieldError = (variable: string): string | null => {
    const value = formData[variable] || '';
    
    if (isNameField(variable)) {
      return validateName(value);
    }
    
    if (isRutField(variable)) {
      return validateRut(value);
    }
    
    if (isEmailField(variable)) {
      return validateEmail(value);
    }
    
    return null;
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
        {variables.map((variable) => {
          const fieldError = getFieldError(variable);
          const hasError = fieldError !== null;
          
          return (
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
                  className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 transition-colors bg-white ${
                    hasError
                      ? 'border-red-300 focus:ring-red-500'
                      : isFieldEmpty(variable)
                        ? 'border-red-200 focus:ring-cyan-500'
                        : 'border-slate-200 focus:ring-cyan-500'
                  }`}
                />
                {hasError && (
                  <div className="flex items-start gap-1.5 mt-1.5">
                    <AlertCircle className="w-3.5 h-3.5 text-red-500 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-red-600">{fieldError}</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
