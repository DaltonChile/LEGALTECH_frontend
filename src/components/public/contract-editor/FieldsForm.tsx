import { useRef, useState } from 'react';
import { Search, AlertCircle } from 'lucide-react';
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

  // Función para detectar si una variable es un teléfono
  const isPhoneField = (variable: string): boolean => {
    const varLower = variable.toLowerCase();
    return varLower.includes('telefono') ||
           varLower.includes('teléfono') ||
           varLower.includes('celular') ||
           varLower.includes('phone');
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

  // Validación para campo teléfono (formato chileno)
  const validatePhone = (value: string): string | null => {
    if (!value || value.trim() === '') return 'Teléfono es requerido';
    
    const cleaned = value.replace(/\s/g, '');
    const phonePattern = /^(\+?56)?9\d{8}$/;
    
    if (!phonePattern.test(cleaned)) {
      return 'Formato: +56912345678 o 912345678';
    }
    return null;
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
      return validateRut(value);
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

      {/* Fields List */}
      <div className="space-y-4 pr-1">
        {variables.map((variable) => {
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
                  className={`w-full px-3 py-2.5 text-sm font-sans border rounded-lg focus:outline-none focus:ring-2 transition-all bg-white ${
                    hasError
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
      </div>
    </div>
  );
}
