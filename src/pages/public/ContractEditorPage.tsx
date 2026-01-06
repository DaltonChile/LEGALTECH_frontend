import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ContractEditor } from '../../components/public/contract-editor';
import { ReviewStep } from '../../components/public/contract-editor/ReviewStep';
import { PaymentStep } from '../../components/public/contract-editor/PaymentStep';
import { Navbar } from '../../components/landing/Navbar';
import { ProgressBar } from '../../components/shared/ProgressBar';
import { ArrowLeft } from 'lucide-react';

interface Template {
  id: string;
  version_id: string;
  title: string;
  slug: string;
  description: string;
  base_price: number;
  base_form_schema: any[];
  template_content: string;
  clause_numbering?: any[];
  signers_config?: any[];
  variables_metadata?: {
    variables: any[];
    baseVariables: string[];
  };
  capsules: any[];
}

type Step = 'editor' | 'review' | 'payment' | 'signatures';

const PROGRESS_STEPS = [
  { id: 'editor', label: 'Completar datos' },
  { id: 'review', label: 'Revisar contrato' },
  { id: 'payment', label: 'Pagar' },
  { id: 'signatures', label: 'Firma electrónica' },
];

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
  const [renderedContractHtml, setRenderedContractHtml] = useState<string>('');

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
      console.log('🆔 Template ID:', templateData.id);
      console.log('🆔 Template template_id:', templateData.template_id);
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

  const handleContinueToReview = () => {
    // Validar que todos los campos estén llenos
    const allVariables = getAllVariables();
    const emptyFields = allVariables.filter((v) => !formData[v] || formData[v].trim() === '');

    if (emptyFields.length > 0) {
      alert(`Por favor completa los siguientes campos:\n${emptyFields.map((v) => `- ${formatVariableName(v)}`).join('\n')}`);
      return;
    }

    // Ir a paso de review (sin crear contrato aún)
    setCurrentStep('review');
  };

  const handleApproveReview = async () => {
    try {
      // Crear contrato en el backend al aprobar la revisión
      if (!trackingCode && template) {
        const response = await axios.post(
          `${import.meta.env.VITE_API_URL}/contracts`,
          {
            template_version_id: template.version_id,
            buyer_rut: formData.COMPRADOR_RUT || formData.buyer_rut || '',
            buyer_email: formData.COMPRADOR_EMAIL || formData.buyer_email || '',
            capsule_ids: selectedCapsules,
            form_data: formData
          }
        );

        if (response.data.success) {
          setContractId(response.data.data.id);
          setTrackingCode(response.data.data.tracking_code);
        } else {
          alert('Error al crear el contrato');
          return;
        }
      }
      
      setCurrentStep('payment');
    } catch (error: any) {
      console.error('Error creating contract:', error);
      alert(`Error al crear el contrato: ${error.response?.data?.error || error.message}`);
    }
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
        // El backend genera 'field_name', no 'variable_name'
        const varName = field.field_name || field.name || field.id;
        if (varName) {
          return varName; // Mantener case original
        }
        // Si no hay field_name, convertir label a MAYÚSCULAS con snake_case
        if (field.label) {
          return field.label
            .toUpperCase() // ← Cambiado a mayúsculas para coincidir con el template
            .replace(/\s+/g, '_')
            .replace(/[^A-Z0-9_]/g, '');
        }
        return null;
      })
      .filter((v: string) => v); // Filtrar undefined/null
    
    console.log('Base variables:', baseVars);
    
    // Extract variables from UNSELECTED capsules (para excluirlas)
    const unselectedCapsuleVars = new Set<string>();
    (template.capsules || [])
      .filter((c) => !selectedCapsules.includes(c.id)) // ← Cápsulas NO seleccionadas
      .forEach((c) => {
        // Variables del form_schema
        (c.form_schema || []).forEach((field: any) => {
          const varName = field.field_name || field.name;
          if (varName) unselectedCapsuleVars.add(varName);
        });
        
        // Variables del legal_text
        if (c.legal_text) {
          const varRegex = /\{\{\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*\}\}/g;
          let match;
          while ((match = varRegex.exec(c.legal_text)) !== null) {
            const varName = match[1].trim();
            unselectedCapsuleVars.add(varName);
          }
        }
      });
    
    console.log('Unselected capsule variables:', Array.from(unselectedCapsuleVars));
    
    // Extract variables from SELECTED capsules
    const capsuleVars = (template.capsules || [])
      .filter((c) => selectedCapsules.includes(c.id)) // ← Cápsulas seleccionadas
      .flatMap((c) => {
        // Variables del form_schema (usar field_name)
        const schemaVars = (c.form_schema || [])
          .map((field: any) => field.field_name || field.name) // ← Mantener case original
          .filter((v: string) => v);
        
        // Variables del legal_text (extraer con regex - mantiene mayúsculas)
        const textVars: string[] = [];
        if (c.legal_text) {
          const varRegex = /\{\{\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*\}\}/g;
          let match;
          while ((match = varRegex.exec(c.legal_text)) !== null) {
            const varName = match[1].trim(); // Mantiene el case original del template
            if (!textVars.includes(varName)) {
              textVars.push(varName);
            }
          }
        }
        
        return [...schemaVars, ...textVars];
      });
    
    console.log('Selected capsule variables:', capsuleVars);
    
    // Combinar variables base + cápsulas seleccionadas
    // PERO excluir las que están en cápsulas no seleccionadas
    const allVars = [...baseVars, ...capsuleVars]
      .filter(v => !unselectedCapsuleVars.has(v));
    
    // Eliminar duplicados (case-sensitive para preservar el original)
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
    <div className="h-screen flex flex-col bg-slate-100">
      {/* Navbar */}
      <Navbar />
      
      {/* Progress Bar */}
      <ProgressBar steps={PROGRESS_STEPS} currentStep={currentStep} />

      {/* Main Content */}
      <main className="flex-1 overflow-hidden">
        {currentStep === 'editor' && (
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
            onContinueToPayment={handleContinueToReview}
            onRenderedHtmlChange={setRenderedContractHtml}
          />
        )}

        {currentStep === 'review' && template && renderedContractHtml && (
          <ReviewStep
            renderedContractHtml={renderedContractHtml}
            totalPrice={template.base_price + 
              template.capsules
                .filter((c: any) => selectedCapsules.includes(c.id))
                .reduce((sum: number, c: any) => sum + c.price, 0)
            }
            onApprove={handleApproveReview}
            onBack={() => setCurrentStep('editor')}
          />
        )}

        {currentStep === 'payment' && (
          <PaymentStep
            contractId={contractId}
            trackingCode={trackingCode || ''}
            buyerRut={formData.COMPRADOR_RUT || formData.buyer_rut || ''}
            totalAmount={template.base_price + 
              template.capsules
                .filter((c: any) => selectedCapsules.includes(c.id))
                .reduce((sum: number, c: any) => sum + c.price, 0)
            }
            onPaymentSuccess={() => setCurrentStep('signatures')}
            onPaymentFailed={() => setCurrentStep('review')}
            onBack={() => setCurrentStep('review')}
          />
        )}
      </main>
    </div>
  );
}
