import { useState, useMemo, useRef } from 'react';
import axios from 'axios';
import { ArrowLeft, ArrowRight, FileText, CheckCircle } from 'lucide-react';
import { DocumentPreview } from './DocumentPreview';
import { FieldsForm } from './FieldsForm';
import { useContractRenderer } from './hooks/useContractRenderer';
import { extractVariables, formatVariableName } from './utils/templateParser';
import { contractEditorStyles } from './styles';
import type { ContractData } from '../../../types/contract';
import type { Capsule } from './types';

interface Template {
  id: string;
  version_id: string;
  title: string;
  base_price: number;
  template_content: string;
  capsules: Capsule[];
  signers_config?: any[];
  clause_numbering?: any[];
  variables_metadata?: Array<{ name: string; description: string | null; type: string }>;
}

interface CompletarFormularioStepProps {
  template: Template;
  contractData: ContractData;
  onComplete: (formData: Record<string, string>, renderedHtml: string) => void;
  onBack: () => void;
}

export function CompletarFormularioStep({
  template,
  contractData,
  onComplete,
  onBack,
}: CompletarFormularioStepProps) {
  // Inicializar formData con los datos existentes del contrato
  const [formData, setFormData] = useState<Record<string, string>>(contractData.form_data || {});
  const [searchTerm, setSearchTerm] = useState('');
  const [activeField, setActiveField] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [renderedContractHtml, setRenderedContractHtml] = useState<string>('');
  const documentRef = useRef<HTMLDivElement>(null);

  // Obtener las cápsulas seleccionadas (IDs)
  const selectedCapsuleIds = useMemo(() => {
    return contractData.selectedCapsules?.map(c => c.id) || [];
  }, [contractData.selectedCapsules]);

  // Extraer variables del template
  const extractedVariables = useMemo(
    () => extractVariables(template.template_content, template.capsules, selectedCapsuleIds),
    [template.template_content, template.capsules, selectedCapsuleIds]
  );

  // Filtrar variables por búsqueda
  const filteredVariables = useMemo(() => {
    const validVariables = extractedVariables.filter(v => v);
    if (!searchTerm) return validVariables;
    const term = searchTerm.toLowerCase();
    return validVariables.filter((v) => 
      v.toLowerCase().includes(term) || 
      formatVariableName(v).toLowerCase().includes(term)
    );
  }, [extractedVariables, searchTerm]);

  // Calcular porcentaje de completado
  const completionPercentage = useMemo(() => {
    const validVariables = extractedVariables.filter(v => v);
    const filled = validVariables.filter((v) => formData[v] && formData[v].trim() !== '').length;
    return validVariables.length > 0 ? Math.round((filled / validVariables.length) * 100) : 0;
  }, [formData, extractedVariables]);

  // Validaciones
  const isRutField = (variable: string): boolean => variable.toLowerCase().includes('rut');
  const isEmailField = (variable: string): boolean => {
    const v = variable.toLowerCase();
    return v.includes('email') || v.includes('correo') || v.includes('mail');
  };
  const isPhoneField = (variable: string): boolean => {
    const v = variable.toLowerCase();
    return v.includes('telefono') || v.includes('teléfono') || v.includes('celular') || v.includes('phone');
  };

  const validateRut = (value: string): boolean => {
    if (!value || value.trim() === '') return true;
    const rutPattern = /^\d{7,8}-[\dkK]$/;
    return rutPattern.test(value.trim());
  };

  const validateEmail = (value: string): boolean => {
    if (!value || value.trim() === '') return true;
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailPattern.test(value.trim());
  };

  const validatePhone = (value: string): boolean => {
    if (!value || value.trim() === '') return false;
    const cleaned = value.replace(/\s/g, '');
    const phonePattern = /^(\+?56)?9\d{8}$/;
    return phonePattern.test(cleaned);
  };

  // Verificar errores de validación
  const hasValidationErrors = useMemo(() => {
    return extractedVariables.some((variable) => {
      const value = formData[variable] || '';
      if (isRutField(variable) && !validateRut(value)) return true;
      if (isEmailField(variable) && !validateEmail(value)) return true;
      if (isPhoneField(variable) && !validatePhone(value)) return true;
      return false;
    });
  }, [formData, extractedVariables]);

  // Renderizar contrato
  const { renderedContract } = useContractRenderer({
    templateText: template.template_content,
    formData,
    extractedVariables,
    capsules: template.capsules,
    selectedCapsules: selectedCapsuleIds,
    clauseNumbering: template.clause_numbering || [],
    signersConfig: template.signers_config || [],
    activeField,
  });

  const handleFormChange = (data: Record<string, string>) => {
    setFormData(data);
  };

  const handleContinueToReview = async () => {
    setError(null);

    // Validar que todos los campos estén completos
    const emptyFields = extractedVariables.filter(v => !formData[v] || formData[v].trim() === '');
    
    if (emptyFields.length > 0) {
      setError(`Por favor completa todos los campos. Faltan: ${emptyFields.slice(0, 3).map(v => formatVariableName(v)).join(', ')}${emptyFields.length > 3 ? ` y ${emptyFields.length - 3} más` : ''}`);
      return;
    }

    if (hasValidationErrors) {
      setError('Por favor corrige los errores de validación en el formulario.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Guardar formulario completo en el backend
      const response = await axios.put(
        `${import.meta.env.VITE_API_URL}/contracts/${contractData.id}/complete`,
        {
          tracking_code: contractData.tracking_code,
          rut: contractData.buyer_rut,
          form_data: formData
        }
      );

      if (response.data.success) {
        onComplete(formData, renderedContractHtml);
      } else {
        setError(response.data.error || 'Error al guardar el formulario');
      }
    } catch (err: any) {
      console.error('Error completing form:', err);
      setError(err.response?.data?.error || 'Error al procesar la solicitud');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative h-full bg-gradient-to-br from-slate-50 via-cyan-50/30 to-lime-50/30 p-6 overflow-hidden">
      {/* Background Decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-br from-blue-400/20 to-lime-400/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-gradient-to-tr from-cyan-400/20 to-emerald-400/20 rounded-full blur-3xl"></div>
      </div>
      
      {/* Header con info del pago */}
      <div className="relative mb-6">
        <div className="flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 rounded-lg shadow-md border border-slate-200 transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver
          </button>
          
          <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-lg px-4 py-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <div>
              <span className="text-sm font-medium text-green-800">Pago confirmado</span>
              <span className="text-xs text-green-600 ml-2">Código: {contractData.tracking_code}</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="relative flex gap-6 h-[calc(100%-80px)]" ref={documentRef}>  
        {/* Vista previa del documento */}
        <div className="flex-1 flex flex-col">
          <DocumentPreview
            templateText={template.template_content}
            renderedContract={renderedContract}
            completionPercentage={completionPercentage}
            activeField={activeField}
            variablesMetadata={template.variables_metadata || []}
            onHtmlReady={setRenderedContractHtml}
          />
        </div>

        {/* Formulario */}
        <div className="w-[400px] flex flex-col gap-4 min-w-0">
          {/* Info de progreso */}
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-slate-700">Completa tu contrato</span>
              <span className="text-sm font-bold text-cyan-600">{completionPercentage}%</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-300 ${
                  completionPercentage === 100 
                    ? 'bg-gradient-to-r from-green-500 to-green-600' 
                    : 'bg-gradient-to-r from-cyan-500 to-cyan-600'
                }`}
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
          </div>

          {/* Campos del formulario */}
          <FieldsForm
            variables={filteredVariables}
            formData={formData}
            onFormChange={handleFormChange}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            activeField={activeField}
            onFieldFocus={setActiveField}
            onFieldBlur={() => setActiveField(null)}
          />

          {/* Error message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Botón de continuar */}
          <button
            onClick={handleContinueToReview}
            disabled={completionPercentage < 100 || hasValidationErrors || isSubmitting}
            className={`w-full py-4 rounded-xl font-semibold text-white transition-all shadow-lg flex items-center justify-center gap-2 ${
              completionPercentage === 100 && !hasValidationErrors && !isSubmitting
                ? 'bg-gradient-to-r from-cyan-600 to-cyan-700 hover:from-cyan-700 hover:to-cyan-800 transform hover:scale-[1.02]'
                : 'bg-slate-400 cursor-not-allowed'
            }`}
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Guardando...
              </>
            ) : (
              <>
                <FileText className="w-5 h-5" />
                Continuar a Revisión
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>

          {completionPercentage < 100 && (
            <p className="text-center text-sm text-slate-500">
              Completa todos los campos para continuar
            </p>
          )}
        </div>
      </div>

      <style>{contractEditorStyles}</style>
    </div>
  );
}
