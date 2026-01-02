import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { CapsuleSelector } from '../../components/shared/CapsuleSelector';
import { ContractEditor } from '../../components/shared/ContractEditor';
// import { useAutoSave } from '../../hooks/useAutoSave'; // TODO: implement this hook

interface Capsule {
  id: number;
  slug: string;
  title: string;
  description?: string;
  price: number;
  form_schema?: any[];
  legal_text?: string;
  display_order?: number;
}

interface ClauseNumbering {
  order: number;
  title: string;
  is_in_capsule: boolean;
  capsule_slug: string | null;
}

interface SignerConfig {
  role: string;
  display_name: string;
  signature_order: number;
  name_variable: string;
  rut_variable: string;
  email_variable: string;
}

interface Template {
  id: string;
  version_id: string;
  title: string;
  slug: string;
  description: string;
  base_price: number;
  base_form_schema: any[];
  template_content: string;
  clause_numbering?: ClauseNumbering[];
  signers_config?: SignerConfig[];
  variables_metadata?: {
    variables: any[];
    baseVariables: string[];
  };
  capsules: Capsule[];
}

type Step = 'capsules' | 'editor' | 'payment';

export function ContractEditorPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const [template, setTemplate] = useState<Template | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState<Step>('editor');

  // Contract data
  const [selectedCapsules, setSelectedCapsules] = useState<number[]>([]);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [contractId, setContractId] = useState<string | null>(null);
  const [trackingCode, setTrackingCode] = useState<string | null>(null);
  const [templateText, setTemplateText] = useState<string>('');

  // Auto-save - TODO: implement useAutoSave hook
  // const { isSaving, lastSaved } = useAutoSave(
  //   contractId,
  //   formData,
  //   currentStep === 'editor'
  // );
  const isSaving = false;
  const lastSaved = null;

  useEffect(() => {
    if (slug) {
      loadTemplate();
    }
  }, [slug]);

  const loadTemplate = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/templates/${slug}`);
      const templateData = response.data.data;
      console.log('📄 Template loaded:', templateData);
      console.log('📝 Template content length:', templateData.template_content?.length || 0);
      console.log('📦 Capsules count:', templateData.capsules?.length || 0);
      
      setTemplate(templateData);
      
      // Usar el contenido real del template desde el backend
      setTemplateText(templateData.template_content || '');
      
      if (!templateData.template_content || templateData.template_content.trim() === '') {
        console.error('⚠️ WARNING: Template content is empty!');
      }
    } catch (error: any) {
      console.error('Error al cargar template:', error);
      console.error('Error details:', error.response?.data);
      alert(`Error al cargar el contrato: ${error.response?.data?.error || error.message}`);
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const handleCapsuleSelectionChange = (selectedIds: number[]) => {
    setSelectedCapsules(selectedIds);
  };

  const handleFormChange = (data: Record<string, string>) => {
    setFormData(data);
  };

  const handleContinueToPayment = () => {
    // Validar que todos los campos estén llenos
    const allVariables = getAllVariables();
    const emptyFields = allVariables.filter((v) => !formData[v] || formData[v].trim() === '');

    if (emptyFields.length > 0) {
      alert(`Por favor completa los siguientes campos:\n${emptyFields.map((v) => `- ${formatVariableName(v)}`).join('\n')}`);
      return;
    }

    setCurrentStep('payment');
    // TODO: Implementar flujo de pago
  };

  const handleBack = () => {
    if (currentStep === 'editor') {
      setCurrentStep('capsules');
    } else if (currentStep === 'payment') {
      setCurrentStep('editor');
    }
  };

  const getAllVariables = (): string[] => {
    if (!template) return [];
    
    console.log('Template base_form_schema:', template.base_form_schema);
    console.log('First 3 fields:', template.base_form_schema?.slice(0, 3));
    
    // Extract variables from base_form_schema
    const baseVars = (template.base_form_schema || [])
      .map((field: any) => {
        console.log('Processing field:', field);
        // Priorizar variable_name, luego name, y como último recurso usar label en snake_case
        const varName = field.variable_name || field.name || field.id;
        if (varName) {
          return varName;
        }
        // Si no hay variable_name, convertir label a snake_case
        if (field.label) {
          return field.label
            .toLowerCase()
            .replace(/\s+/g, '_')
            .replace(/[^a-z0-9_]/g, '');
        }
        return null;
      })
      .filter((v: string) => v); // Filtrar undefined/null
    
    console.log('Base variables:', baseVars);
    
    // Extract variables from selected capsules
    const capsuleVars = (template.capsules || [])
      .filter((c) => selectedCapsules.includes(c.id))
      .flatMap((c) => {
        // Variables del form_schema
        const schemaVars = (c.form_schema || [])
          .map((field: any) => field.variable_name || field.name)
          .filter((v: string) => v);
        
        // Variables del legal_text (extraer con regex)
        const textVars: string[] = [];
        if (c.legal_text) {
          const varRegex = /\{\{\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*\}\}/g;
          let match;
          while ((match = varRegex.exec(c.legal_text)) !== null) {
            const varName = match[1].trim();
            if (!textVars.includes(varName)) {
              textVars.push(varName);
            }
          }
        }
        
        return [...schemaVars, ...textVars];
      });
    
    console.log('Capsule variables:', capsuleVars);
    
    // Combinar todas las variables y eliminar duplicados
    const allVars = [...baseVars, ...capsuleVars];
    
    // Asegurar que ciudad_contrato y fecha_contrato estén incluidas (si no están ya)
    if (!allVars.includes('ciudad_contrato')) {
      allVars.unshift('ciudad_contrato');
    }
    if (!allVars.includes('fecha_contrato')) {
      allVars.splice(1, 0, 'fecha_contrato');
    }
    
    // Eliminar duplicados
    const uniqueVars = Array.from(new Set(allVars));
    console.log('All variables (unique):', uniqueVars);
    
    return uniqueVars;
  };

  const formatVariableName = (variable: string): string => {
    return variable
      .replace(/_/g, ' ')
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
    }).format(price);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-cyan-50/30 to-lime-50/30 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando contrato...</p>
        </div>
      </div>
    );
  }

  if (!template) {
    console.log('Template is null, not rendering main content');
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-cyan-50/30 to-lime-50/30 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Contrato no encontrado</p>
          <button
            onClick={() => navigate('/')}
            className="mt-4 text-blue-600 hover:text-blue-700"
          >
            Volver al catálogo
          </button>
        </div>
      </div>
    );
  }

  console.log('Rendering ContractEditorPage with:', { template, currentStep, selectedCapsules });
  console.log('Template has capsules:', template.capsules?.length);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-cyan-50/30 to-lime-50/30">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm shadow-sm border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-5">
          <div className="flex items-center justify-between">
            {/* Botón volver */}
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="font-medium">Volver</span>
            </button>

            <div className="flex-1 mx-8">
              <h1 className="text-3xl font-bold text-slate-900">{template.title}</h1>
              <p className="text-sm text-slate-600 mt-1">{template.description}</p>
              {trackingCode && (
                <p className="text-sm text-slate-600 mt-1">
                  Código: <span className="font-mono font-medium text-cyan-600">{trackingCode}</span>
                </p>
              )}
            </div>

            {/* Step indicator */}
            <div className="hidden md:flex items-center space-x-2">
              <div className={`flex items-center ${currentStep === 'editor' ? 'text-cyan-600' : currentStep === 'payment' ? 'text-lime-600' : 'text-slate-400'}`}>
                <div className={`w-9 h-9 rounded-full flex items-center justify-center font-semibold ${currentStep === 'editor' ? 'bg-gradient-to-br from-blue-600 to-cyan-500 text-white shadow-lg' : currentStep === 'payment' ? 'bg-lime-500 text-white' : 'bg-slate-200 text-slate-500'}`}>
                  1
                </div>
                <span className="ml-2 font-medium text-sm">Editor</span>
              </div>
              <div className="w-8 h-px bg-slate-300"></div>
              <div className={`flex items-center ${currentStep === 'payment' ? 'text-cyan-600' : 'text-slate-400'}`}>
                <div className={`w-9 h-9 rounded-full flex items-center justify-center font-semibold ${currentStep === 'payment' ? 'bg-gradient-to-br from-blue-600 to-cyan-500 text-white shadow-lg' : 'bg-slate-200 text-slate-500'}`}>
                  2
                </div>
                <span className="ml-2 font-medium text-sm">Pago</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-6 lg:px-8 py-12 pb-32">
        {currentStep === 'editor' && (
          <>
            <ContractEditor
              templateText={templateText}
              variables={getAllVariables()}
              formData={formData}
              onFormChange={handleFormChange}
              capsules={template.capsules}
              selectedCapsules={selectedCapsules}
              onCapsuleSelectionChange={handleCapsuleSelectionChange}
              basePrice={template.base_price}
              isLoading={isSaving}
              clauseNumbering={template.clause_numbering}
              signersConfig={template.signers_config}
              variablesMetadata={template.variables_metadata}
            />

            {/* Fixed bottom bar */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-4">
              <div className="max-w-7xl mx-auto flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  {isSaving ? (
                    <span className="flex items-center">
                      <svg className="animate-spin h-4 w-4 mr-2 text-blue-600" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Guardando...
                    </span>
                  ) : lastSaved ? (
                    `Guardado ${lastSaved.toLocaleTimeString()}`
                  ) : (
                    'Sin guardar'
                  )}
                </div>

                <button
                  onClick={handleContinueToPayment}
                  disabled={isSaving}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Continuar al pago →
                </button>
              </div>
            </div>
          </>
        )}

        {currentStep === 'payment' && (
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="bg-white rounded-lg shadow-sm p-8 text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Proceso de Pago</h2>
              <p className="text-gray-600 mb-6">
                Próximamente: Integración con Webpay/Flow para procesar el pago
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <p className="text-lg font-bold text-gray-900 mb-2">
                  Total a pagar: {formatPrice(template.base_price + 
                    template.capsules
                      .filter((c: any) => selectedCapsules.includes(c.id))
                      .reduce((sum: number, c: any) => sum + c.price, 0)
                  )}
                </p>
                <p className="text-sm text-gray-600">
                  Código de seguimiento: <span className="font-mono font-medium">{trackingCode}</span>
                </p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
