import { useState, useMemo, useRef } from 'react';
import axios from 'axios';
import { ArrowRight, CheckCircle, Edit3, AlertCircle } from 'lucide-react';
import { DocumentPreview } from './DocumentPreview';
import { FieldsForm } from './FieldsForm';
import { EditorHeader } from './EditorHeader';
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
  steps: { id: string; label: string }[];
  onComplete: (formData: Record<string, string>, renderedHtml: string) => void;
  onBack?: () => void;
}

export function CompletarFormularioStep({
  template,
  contractData,
  steps,
  onComplete,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onBack: _onBack,
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
    <div className="h-full bg-slate-50 flex flex-col">
       {/* Background Grid */}
      <div className="fixed inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none"></div>

      {/* Header */}
      <EditorHeader
         steps={steps}
         currentStep="completar"
         onBack={_onBack}
         rightAction={
            <div className="flex items-center gap-6">
                 {/* Payment Info Badge */}
                 <div className="hidden lg:flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-3 py-1.5">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <div>
                      <div className="text-xs font-bold text-green-800 leading-none">Pago OK</div>
                      <div className="text-[10px] text-green-600 font-mono leading-none mt-0.5">{contractData.tracking_code}</div>
                    </div>
                </div>

                 <button
                    onClick={handleContinueToReview}
                    disabled={completionPercentage < 100 || hasValidationErrors || isSubmitting}
                    className="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-slate-800 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:scale-100 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg shadow-slate-900/10 whitespace-nowrap"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/20 border-t-white"></div>
                        <span>Guardando...</span>
                      </>
                    ) : (
                      <>
                        <span>Continuar a Revisión</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
            </div>
         }
      />
      
      <div className="relative z-10 flex-1 w-full max-w-[1920px] mx-auto p-6 flex gap-6 overflow-hidden min-h-0" ref={documentRef}>  
        {/* Vista previa del documento */}
        <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col relative z-0">
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
        <div className="flex-1 h-full overflow-y-auto pr-2 pb-20 custom-scrollbar space-y-4">
           <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 transition-shadow hover:shadow-md">
               <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                 <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                    <Edit3 className="w-4 h-4 text-emerald-600" />
                 </div>
                 Completar Contrato
               </h3>
               
               <p className="text-xs text-slate-500 mb-4 bg-slate-50 p-3 rounded-lg border border-slate-100">
                 Has completado el <strong>{completionPercentage}%</strong> del documento. Rellena los campos faltantes para continuar.
               </p>

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
           </div>

           {/* Validation Errors */}
           {(error || (completionPercentage < 100)) && (
             <div className={`p-4 rounded-xl border flex items-start gap-3 ${error ? 'bg-red-50 border-red-100 text-red-700' : 'bg-amber-50 border-amber-100 text-amber-700'}`}>
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                   {error ? <p className="font-medium">{error}</p> : <p>Completa todos los campos obligatorios marcados con * para continuar.</p>}
                </div>
             </div>
           )}

        </div>
      </div>

      <style>{contractEditorStyles}</style>
    </div>
  );
}
