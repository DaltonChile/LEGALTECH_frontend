import { useState, useMemo, useRef } from 'react';
import api from '../../../services/api';
import { ArrowRight, Edit3, AlertCircle } from 'lucide-react';
import { DocumentPreview } from './DocumentPreview';
import { FieldsForm } from './FieldsForm';
import { EditorHeader } from './EditorHeader';
import { FileUploadStep } from './FileUploadStep';
import { useContractRenderer } from './hooks/useContractRenderer';
import { extractVariables, formatVariableName } from './utils/templateParser';
import { contractEditorStyles } from './styles';
import {
  isRutField,
  isEmailField,
  isPhoneField,
  validateRutFormat,
  validateEmail,
  validatePhone,
  getErrorMessage,
} from '../../../utils/validators';
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
  // Debug: Log variables metadata
  console.log('📋 Template variables_metadata:', template.variables_metadata);
  console.log('📋 Template:', template);
  console.log('📋 ContractData:', {
    id: contractData.id,
    tracking_code: contractData.tracking_code,
    buyer_rut: contractData.buyer_rut,
    status: contractData.status
  });
  
  // Inicializar formData con los datos existentes del contrato
  const [formData, setFormData] = useState<Record<string, string>>(contractData.form_data || {});
  const [searchTerm, setSearchTerm] = useState('');
  const [activeField, setActiveField] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [renderedContractHtml, setRenderedContractHtml] = useState<string>('');
  const [allFilesUploaded, setAllFilesUploaded] = useState(true); // True by default if no files required
  const [attemptedContinue, setAttemptedContinue] = useState(false); // Track si el usuario intentó continuar
  const documentRef = useRef<HTMLDivElement>(null);
  const blurTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  // Verificar errores de validación usando validadores compartidos
  const hasValidationErrors = useMemo(() => {
    return extractedVariables.some((variable) => {
      const value = formData[variable] || '';
      if (isRutField(variable) && validateRutFormat(value) !== null) return true;
      if (isEmailField(variable) && validateEmail(value) !== null) return true;
      if (isPhoneField(variable) && validatePhone(value) !== null) return true;
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

  const handleFieldFocus = (variable: string) => {
    // Cancelar cualquier timeout pendiente de blur
    if (blurTimeoutRef.current) {
      clearTimeout(blurTimeoutRef.current);
      blurTimeoutRef.current = null;
    }
    console.log('🎯 Field focused:', variable);
    setActiveField(variable);
  };

  const handleFieldBlur = () => {
    // Delay para mantener el activeField el tiempo suficiente para ver el tooltip
    blurTimeoutRef.current = setTimeout(() => {
      console.log('👋 Field blur - clearing activeField');
      setActiveField(null);
    }, 200); // 200ms delay
  };

  const handleContinueToReview = async () => {
    setError(null);
    setAttemptedContinue(true); // Marcar que el usuario intentó continuar

    // Validar que todos los archivos estén subidos
    if (!allFilesUploaded) {
      setError('Por favor sube todos los documentos requeridos antes de continuar.');
      return;
    }

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
      const response = await api.put(
        `/contracts/${contractData.id}/complete`,
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
      setError(getErrorMessage(err, 'Error al procesar la solicitud'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="h-full bg-slate-100 flex flex-col">
      {/* Header */}
      <EditorHeader
         steps={steps}
         currentStep="completar"
         rightAction={
            <div className="flex items-center gap-6">
                 <button
                    onClick={handleContinueToReview}
                    disabled={completionPercentage < 100 || hasValidationErrors || isSubmitting || !allFilesUploaded}
                    className="bg-slate-900 text-white px-4 md:px-6 py-2 md:py-3 rounded-xl font-bold hover:bg-slate-800 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:scale-100 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg shadow-slate-900/10 whitespace-nowrap text-sm md:text-base"
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
      
      <div className="relative z-10 flex-1 w-full max-w-480 mx-auto p-3 md:p-6 flex flex-col lg:flex-row gap-4 md:gap-6 overflow-hidden min-h-0" ref={documentRef}>  
        {/* Vista previa del documento */}
        <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col relative z-0 min-h-100 lg:min-h-0">
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
                  onFieldFocus={handleFieldFocus}
                  onFieldBlur={handleFieldBlur}
               />
           </div>

           {/* File Upload Section - Solo mostrar si tenemos los datos necesarios */}
           {contractData.tracking_code && contractData.buyer_rut && (
             <FileUploadStep
               contractId={contractData.id}
               trackingCode={contractData.tracking_code}
               buyerRut={contractData.buyer_rut}
               onAllFilesUploaded={() => setAllFilesUploaded(true)}
               onFilesStatusChange={(allUploaded) => setAllFilesUploaded(allUploaded)}
             />
           )}

           {/* Validation Errors - Solo mostrar si se intentó continuar */}
           {attemptedContinue && error && (
             <div className="p-4 rounded-lg border bg-red-50 border-red-200 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-red-600" />
                <div className="text-sm text-red-700">
                   <p className="font-medium">{error}</p>
                </div>
             </div>
           )}

        </div>
      </div>

      <style>{contractEditorStyles}</style>
    </div>
  );
}
