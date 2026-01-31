import { useRef, useState } from 'react';
import { Search, AlertCircle, Lock } from 'lucide-react';
import { formatVariableName } from './utils/templateParser';
import {
  isNameField,
  isRutField,
  isEmailField,
  isPhoneField,
  validateName,
  validateRutFormat,
  validateEmail,
  validatePhone,
} from '../../../utils/validators';

interface FieldsFormProps {
  variables: string[];
  formData: Record<string, string>;
  onFormChange: (data: Record<string, string>) => void;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  activeField: string | null;
  onFieldFocus: (variable: string) => void;
  onFieldBlur: () => void;
  /** If defined, only this percentage of fields will be editable (0-100) */
  visiblePercentage?: number;
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
  visiblePercentage,
}: FieldsFormProps) {
  // Calculate how many fields are editable based on visiblePercentage
  const editableFieldCount = visiblePercentage !== undefined
    ? Math.ceil((variables.length * visiblePercentage) / 100)
    : variables.length;
  // Referencias para los campos de input
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  // Track which fields have been touched (interacted with)
  const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set());

  // Función para mover al siguiente campo al presionar Enter
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, currentVariable: string) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();

      const currentIndex = variables.indexOf(currentVariable);
      const nextIndex = currentIndex + 1;

      if (nextIndex < variables.length) {
        const nextVariable = variables[nextIndex];
        // Usar setTimeout para asegurar que el DOM esté listo
        setTimeout(() => {
          const nextInput = inputRefs.current[nextVariable];
          if (nextInput) {
            nextInput.focus();
          }
        }, 0);
      }
    }
  };

  const isFieldEmpty = (variable: string): boolean => {
    return !formData[variable] || formData[variable].trim() === '';
  };

  // Función para obtener el error de validación de un campo
  const getFieldError = (variable: string): string | null => {
    const value = formData[variable] || '';

    // Solo mostrar errores si el campo ha sido tocado
    if (!touchedFields.has(variable)) {
      return null;
    }

    if (isNameField(variable)) {
      return validateName(value);
    }

    if (isRutField(variable)) {
      return validateRutFormat(value);
    }

    if (isEmailField(variable)) {
      return validateEmail(value);
    }

    if (isPhoneField(variable)) {
      return validatePhone(value);
    }

    return null;
  };

  // Handler para cuando el campo pierde el foco
  const handleFieldBlur = (variable: string) => {
    setTouchedFields(prev => new Set(prev).add(variable));
    onFieldBlur();
  };

  return (
    <div className="flex flex-col h-full">
      {/* Search */}
      <div className="mb-4 relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Buscar campo..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-sans focus:outline-none focus:ring-2 focus:ring-navy-100 focus:border-navy-500 transition-colors placeholder-slate-400"
        />
      </div>

      {/* Fields List - Only show editable fields */}
      <div className="space-y-4 pr-1">
        {variables.slice(0, editableFieldCount).map((variable) => {
          const fieldError = getFieldError(variable);
          const hasError = fieldError !== null;
          const isActive = activeField === variable;

          return (
            <div key={variable} className={`transition-all ${isActive ? 'scale-[1.01]' : ''}`}>
              <label className={`block text-xs font-medium font-sans mb-1.5 ml-1 transition-colors ${isActive ? 'text-navy-900' : 'text-slate-600'}`}>
                {formatVariableName(variable)}
                {isFieldEmpty(variable) && <span className="text-red-500 ml-1">*</span>}
              </label>
              <input
                ref={(el) => { inputRefs.current[variable] = el; }}
                type="text"
                value={formData[variable] || ''}
                onChange={(e) => onFormChange({ ...formData, [variable]: e.target.value })}
                onFocus={() => onFieldFocus(variable)}
                onBlur={() => handleFieldBlur(variable)}
                onKeyDown={(e) => handleKeyDown(e, variable)}
                placeholder={`Ingresa ${formatVariableName(variable).toLowerCase()}`}
                className={`w-full px-3 py-2.5 text-sm font-sans border rounded-lg focus:outline-none focus:ring-2 transition-all bg-white ${hasError
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-100'
                    : isActive
                      ? 'border-navy-500 ring-navy-100'
                      : 'border-slate-200 focus:border-navy-500 focus:ring-navy-100'
                  }`}
              />

              {hasError && (
                <div className="flex items-start gap-1.5 mt-1.5 ml-1 animate-fade-in-down">
                  <AlertCircle className="w-3.5 h-3.5 text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-red-600 font-medium font-sans">{fieldError}</p>
                </div>
              )}
            </div>
          );
        })}

        {/* Locked fields indicator */}
        {variables.length > editableFieldCount && (
          <div className="mt-6 p-4 bg-slate-50 border border-slate-200 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-slate-200 rounded-lg flex items-center justify-center">
                <Lock className="w-5 h-5 text-slate-500" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-700 font-sans">
                  +{variables.length - editableFieldCount} campos adicionales
                </p>
                <p className="text-xs text-slate-500 font-sans">
                  Realiza el pago para completar todos los campos
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
