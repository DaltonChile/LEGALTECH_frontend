import { Search, Edit3 } from 'lucide-react';
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

  return (
    <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex-1 flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-br from-blue-600 to-cyan-600 p-5">
        <div className="flex items-center gap-3">
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
      <div className="p-4 border-b border-slate-100">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
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
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {variables.map((variable) => (
          <div 
            key={variable} 
            className={`flex items-center gap-3 p-3 rounded-lg transition-all duration-200 ${
              activeField === variable 
                ? 'bg-cyan-50 ring-2 ring-cyan-500' 
                : 'bg-slate-50 hover:bg-slate-100'
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
                className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-colors ${
                  isFieldEmpty(variable) 
                    ? 'border-red-200 bg-red-50 focus:bg-white' 
                    : 'border-slate-200 bg-white'
                }`}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
