import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { ContractEditor } from '../../components/public/contract-editor';
import { ReviewStep } from '../../components/public/contract-editor/ReviewStep';
import type { SignatureInfo } from '../../components/public/contract-editor/ReviewStep';
import { PaymentStep } from '../../components/public/contract-editor/PaymentStep';
import { SignatureStep } from '../../components/public/contract-editor/SignatureStep';
import { FormularioInicialStep } from '../../components/public/contract-editor/FormularioInicialStep';
import { CompletarFormularioStep } from '../../components/public/contract-editor/CompletarFormularioStep';
import { Navbar } from '../../components/landing/Navbar';
import { ProgressBar } from '../../components/shared/ProgressBar';
import { extractVariables } from '../../components/public/contract-editor/utils/templateParser';
import type { ContractData } from '../../types/contract';

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
  variables_metadata?: Array<{ name: string; description: string | null; type: string }>;
  capsules: any[];
}

type Step = 'formulario-inicial' | 'payment' | 'completar' | 'review' | 'signatures' | 'editor';

// Nuevo flujo: Formulario Inicial -> Pago -> Completar -> Review -> Firmas
const NEW_FLOW_STEPS = [
  { id: 'formulario-inicial', label: 'Datos iniciales' },
  { id: 'payment', label: 'Pago' },
  { id: 'completar', label: 'Completar formulario' },
  { id: 'review', label: 'Revisar' },
  { id: 'signatures', label: 'Firmar' },
];

// Flujo original (mantenido por compatibilidad)
const PROGRESS_STEPS = [
  { id: 'editor', label: 'Completar datos' },
  { id: 'review', label: 'Revisar contrato' },
  { id: 'payment', label: 'Pagar' },
  { id: 'signatures', label: 'Firma electrónica' },
];

export function ContractEditorPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [template, setTemplate] = useState<Template | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState<Step>('formulario-inicial');
  const [signatureInfo, setSignatureInfo] = useState<SignatureInfo | undefined>(undefined);
  
  // Usar nuevo flujo por defecto
  const [useNewFlow, setUseNewFlow] = useState(true);

  // Contract data
  const [selectedCapsules, setSelectedCapsules] = useState<number[]>([]);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [contractId, setContractId] = useState<string | null>(null);
  const [trackingCode, setTrackingCode] = useState<string | null>(null);
  const [contractTotalAmount, setContractTotalAmount] = useState<number>(0);
  const [templateText, setTemplateText] = useState<string>('');
  const [renderedContractHtml, setRenderedContractHtml] = useState<string>('');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  
  // Datos del contrato para el nuevo flujo
  const [contractData, setContractData] = useState<ContractData | null>(null);
  const [buyerRut, setBuyerRut] = useState<string>('');
  const [signatureType, setSignatureType] = useState<'none' | 'simple' | 'fea'>('simple');

  // Auto-save - TODO: implement useAutoSave hook
  // const { isSaving, lastSaved } = useAutoSave(
  //   contractId,
  //   formData,
  //   currentStep === 'editor'
  // );
  const isSaving = false;

  useEffect(() => {
    if (slug) {
      loadTemplate();
      loadSignatureInfo();
      
      // Verificar si hay parámetros de resume
      const stepParam = searchParams.get('step');
      const idParam = searchParams.get('id');
      const rutParam = searchParams.get('rut');
      
      if (stepParam && idParam && rutParam) {
        // Cargar contrato existente
        loadExistingContract(idParam, rutParam, stepParam);
      }
    }
  }, [slug, searchParams]);

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

  const loadSignatureInfo = async () => {
    if (!slug) return;
    
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/templates/${slug}/signature-info`);
      if (response.data.success) {
        setSignatureInfo(response.data.data);
        console.log('📝 Signature info loaded:', response.data.data);
      }
    } catch (error) {
      console.error('Error loading signature info:', error);
    }
  };

  const loadExistingContract = async (id: string, rut: string, step: string) => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/contracts/resume?id=${id}&rut=${encodeURIComponent(rut)}`
      );
      
      if (response.data.success) {
        const data = response.data.data;
        setContractData(data);
        setContractId(data.id);
        setTrackingCode(data.tracking_code);
        setBuyerRut(data.buyer_rut);
        setFormData(data.form_data || {});
        setContractTotalAmount(data.total_amount);
        setSignatureType(data.signature_type || 'simple');
        
        // Establecer cápsulas seleccionadas
        if (data.selectedCapsules) {
          setSelectedCapsules(data.selectedCapsules.map((c: any) => c.id));
        }
        
        // Ir al paso correspondiente
        if (step === 'completar' && data.status === 'draft') {
          setCurrentStep('completar');
        } else if (data.status === 'waiting_signatures') {
          setCurrentStep('signatures');
        }
      }
    } catch (error) {
      console.error('Error loading existing contract:', error);
    }
  };

  const handleCapsuleSelectionChange = (selectedIds: number[]) => {
    setSelectedCapsules(selectedIds);
  };

  const handleFormChange = (data: Record<string, string>) => {
    setFormData(data);
  };

  const handleContinueToReview = () => {
    if (!template) return;
    
    // Validar que todos los campos estén llenos
    const allVariables = extractVariables(templateText, template.capsules, selectedCapsules);
    const emptyFields = allVariables.filter((v: string) => !formData[v] || formData[v].trim() === '');

    if (emptyFields.length > 0) {
      const formatName = (variable: string): string => {
        return variable
          .replace(/_/g, ' ')
          .split(' ')
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
      };
      alert(`Por favor completa los siguientes campos:\n${emptyFields.map((v: string) => `- ${formatName(v)}`).join('\n')}`);
      return;
    }

    // Ir a paso de review (sin crear contrato aún)
    setCurrentStep('review');
  };

  const handleApproveReview = async (pdfBlob: Blob, signatureType?: 'simple' | 'fea' | 'none') => {
    // Prevent duplicate calls
    if (contractId) {
      console.log('⚠️ Contract already created, skipping duplicate call');
      setCurrentStep('payment');
      return;
    }

    // Prevent duplicate processing
    if (isProcessingPayment) {
      console.log('⚠️ Already processing, ignoring duplicate call');
      return;
    }

    setIsProcessingPayment(true);

    try {
      // Crear contrato en el backend al aprobar la revisión
      if (!trackingCode && template) {
        // Obtener datos del comprador desde signers_config (primer firmante)
        const buyerSigner = template.signers_config?.[0];
        const buyerRut = buyerSigner ? formData[buyerSigner.rut_variable] : '';
        const buyerEmail = buyerSigner ? formData[buyerSigner.email_variable] : '';

        console.log('📝 Buyer signer config:', buyerSigner);
        console.log('📝 Form data keys:', Object.keys(formData));
        console.log('📝 Looking for RUT variable:', buyerSigner?.rut_variable);
        console.log('📝 Looking for Email variable:', buyerSigner?.email_variable);
        console.log('📝 Found RUT:', buyerRut);
        console.log('📝 Found Email:', buyerEmail);

        if (!buyerRut || !buyerEmail) {
          alert(`Error: Faltan datos del comprador.\nRUT: ${buyerRut || 'FALTA'}\nEmail: ${buyerEmail || 'FALTA'}\nVerificar variables: ${buyerSigner?.rut_variable}, ${buyerSigner?.email_variable}`);
          return;
        }

        // Validar formato de email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(buyerEmail)) {
          alert(`Error: El email "${buyerEmail}" no es válido. Por favor verifica el campo ${buyerSigner?.email_variable}`);
          return;
        }

        console.log('📝 Creating contract with:', {
          template_version_id: template.version_id,
          buyer_rut: buyerRut,
          buyer_email: buyerEmail,
          capsule_ids: selectedCapsules,
          signature_type: signatureType || 'simple'
        });

        const response = await axios.post(
          `${import.meta.env.VITE_API_URL}/contracts`,
          {
            template_version_id: template.version_id,
            buyer_rut: buyerRut,
            buyer_email: buyerEmail,
            capsule_ids: selectedCapsules,
            form_data: formData,
            signature_type: signatureType || 'simple'
          }
        );

        if (response.data.success) {
          const newContractId = response.data.data.id;
          const newTrackingCode = response.data.data.tracking_code;
          const totalAmount = response.data.data.total_amount;
          setContractId(newContractId);
          setTrackingCode(newTrackingCode);
          setContractTotalAmount(totalAmount);
          
          console.log('💰 Contract created with total amount:', totalAmount);
          
          // Upload draft PDF to backend
          await uploadDraftPdf(newContractId, newTrackingCode, formData[template.signers_config?.[0]?.rut_variable || ''], pdfBlob);
        } else {
          alert('Error al crear el contrato');
          return;
        }
      }
      
      setCurrentStep('payment');
    } catch (error: any) {
      console.error('Error creating contract:', error);
      alert(`Error al crear el contrato: ${error.response?.data?.error || error.message}`);
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const uploadDraftPdf = async (contractId: string, trackingCode: string, rut: string, pdfBlob: Blob) => {
    try {
      console.log('📤 Uploading draft PDF to server...');
      
      const formData = new FormData();
      formData.append('draft_pdf', pdfBlob, 'contract.pdf');
      formData.append('tracking_code', trackingCode);
      formData.append('rut', rut);
      
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/contracts/${contractId}/upload-draft-pdf`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      
      if (response.data.success) {
        console.log('✅ Draft PDF uploaded successfully:', response.data.data.pdf_path);
      } else {
        console.error('❌ Failed to upload draft PDF:', response.data.error);
      }
    } catch (error: any) {
      console.error('❌ Error uploading draft PDF:', error);
      // Don't block the flow - just log the error
      // The PDF will be missing but user can continue
    }
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

  console.log('Rendering ContractEditorPage with:', { template, currentStep, selectedCapsules, useNewFlow });
  console.log('Template has capsules:', template.capsules?.length);

  // Función para aprobar revisión y enviar a firma (nuevo flujo)
  const handleApproveAndSign = async () => {
    if (!contractId || !trackingCode || !buyerRut) {
      alert('Error: Faltan datos del contrato');
      return;
    }

    setIsProcessingPayment(true);

    try {
      // Primero subir el PDF borrador
      if (renderedContractHtml) {
        // Generar PDF y subirlo
        const html2pdf = (await import('html2pdf.js')).default;
        
        const container = document.createElement('div');
        container.innerHTML = renderedContractHtml;
        container.style.cssText = 'font-family: Arial, sans-serif; background: white; color: #1f2937; padding: 20px; font-size: 14px;';
        document.body.appendChild(container);

        const pdfBlob = await html2pdf()
          .set({
            margin: [20, 20, 20, 20],
            filename: 'contract.pdf',
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
          })
          .from(container)
          .output('blob');

        document.body.removeChild(container);

        // Subir PDF
        await uploadDraftPdf(contractId, trackingCode, buyerRut, pdfBlob);
      }

      // Aprobar revisión
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/contracts/${contractId}/approve-review`,
        {
          tracking_code: trackingCode,
          rut: buyerRut
        }
      );

      if (response.data.success) {
        setCurrentStep('signatures');
      } else {
        alert(response.data.error || 'Error al aprobar la revisión');
      }
    } catch (error: any) {
      console.error('Error approving review:', error);
      alert(`Error: ${error.response?.data?.error || error.message}`);
    } finally {
      setIsProcessingPayment(false);
    }
  };

  // Determinar qué pasos mostrar según el flujo
  const currentSteps = useNewFlow ? NEW_FLOW_STEPS : PROGRESS_STEPS;

  return (
    <div className="h-screen flex flex-col bg-slate-100">
      {/* Navbar */}
      <Navbar />
      
      {/* Progress Bar */}
      <ProgressBar steps={currentSteps} currentStep={currentStep} />

      {/* Main Content */}
      <main className="flex-1 overflow-hidden">
        {/* NUEVO FLUJO: Paso 1 - Formulario Inicial */}
        {currentStep === 'formulario-inicial' && useNewFlow && template && (
          <FormularioInicialStep
            template={template}
            signatureInfo={signatureInfo}
            onContinue={(data) => {
              setContractId(data.contractId);
              setTrackingCode(data.trackingCode);
              setContractTotalAmount(data.totalAmount);
              setFormData(data.formData);
              setSelectedCapsules(data.selectedCapsules);
              setSignatureType(data.signatureType);
              setBuyerRut(template.signers_config?.[0] ? data.formData[template.signers_config[0].rut_variable] : '');
              
              // Crear contractData para pasar a los siguientes pasos
              setContractData({
                id: data.contractId,
                tracking_code: data.trackingCode,
                status: 'pending_payment',
                form_data: data.formData,
                template_version_id: template.version_id,
                total_amount: data.totalAmount,
                signature_type: data.signatureType,
                signature_price: 0,
                selectedCapsules: data.selectedCapsules.map(id => ({ id, price_at_purchase: 0 })),
                buyer_rut: template.signers_config?.[0] ? data.formData[template.signers_config[0].rut_variable] : '',
                buyer_email: template.signers_config?.[0] ? data.formData[template.signers_config[0].email_variable] : '',
              });
              
              setCurrentStep('payment');
            }}
            onBack={() => navigate('/')}
          />
        )}

        {/* NUEVO FLUJO: Paso 2 - Pago (después del formulario inicial) */}
        {currentStep === 'payment' && useNewFlow && template && contractId && (
          <PaymentStep
            contractId={contractId}
            trackingCode={trackingCode || ''}
            buyerRut={buyerRut || (template.signers_config?.[0] ? formData[template.signers_config[0].rut_variable] : '')}
            totalAmount={contractTotalAmount}
            onPaymentSuccess={() => {
              // Actualizar contractData con estado draft
              if (contractData) {
                setContractData({ ...contractData, status: 'draft' });
              }
              setCurrentStep('completar');
            }}
            onPaymentFailed={() => setCurrentStep('formulario-inicial')}
            onBack={() => setCurrentStep('formulario-inicial')}
          />
        )}

        {/* NUEVO FLUJO: Paso 3 - Completar Formulario */}
        {currentStep === 'completar' && useNewFlow && template && contractData && (
          <CompletarFormularioStep
            template={template}
            contractData={contractData}
            onComplete={(newFormData, html) => {
              setFormData(newFormData);
              setRenderedContractHtml(html);
              setCurrentStep('review');
            }}
            onBack={() => setCurrentStep('payment')}
          />
        )}

        {/* NUEVO FLUJO: Paso 4 - Revisión */}
        {currentStep === 'review' && useNewFlow && template && renderedContractHtml && (
          <ReviewStep
            renderedContractHtml={renderedContractHtml}
            totalPrice={contractTotalAmount}
            onApprove={() => {}} // No usado en nuevo flujo
            onBack={() => setCurrentStep('completar')}
            isProcessing={isProcessingPayment}
            signatureInfo={signatureInfo}
            isNewFlow={true}
            contractId={contractId || undefined}
            trackingCode={trackingCode || undefined}
            buyerRut={buyerRut}
            onApproveAndSign={handleApproveAndSign}
          />
        )}

        {/* FLUJO ORIGINAL: Editor */}
        {currentStep === 'editor' && !useNewFlow && (
          <ContractEditor
            templateText={templateText}
            formData={formData}
            onFormChange={handleFormChange}
            capsules={template.capsules}
            selectedCapsules={selectedCapsules}
            onCapsuleSelectionChange={handleCapsuleSelectionChange}
            basePrice={template.base_price}
            isLoading={isSaving}
            clauseNumbering={template.clause_numbering}
            signersConfig={template.signers_config}
            variablesMetadata={
              template.variables_metadata && template.variables_metadata.length > 0
                ? template.variables_metadata
                : template.base_form_schema?.map(field => ({
                    name: field.field_name,
                    description: field.description || field.placeholder || null,
                    type: field.field_type || 'text'
                  })) || []
            }
            onContinueToPayment={handleContinueToReview}
            onRenderedHtmlChange={setRenderedContractHtml}
            onBack={() => navigate('/')}
          />
        )}

        {/* FLUJO ORIGINAL: Review */}
        {currentStep === 'review' && !useNewFlow && template && renderedContractHtml && (
          <ReviewStep
            renderedContractHtml={renderedContractHtml}
            totalPrice={template.base_price + 
              template.capsules
                .filter((c: any) => selectedCapsules.includes(c.id))
                .reduce((sum: number, c: any) => sum + c.price, 0)
            }
            onApprove={handleApproveReview}
            onBack={() => setCurrentStep('editor')}
            isProcessing={isProcessingPayment}
            signatureInfo={signatureInfo}
          />
        )}

        {/* FLUJO ORIGINAL: Payment */}
        {currentStep === 'payment' && !useNewFlow && template && (
          <PaymentStep
            contractId={contractId}
            trackingCode={trackingCode || ''}
            buyerRut={template.signers_config?.[0] ? formData[template.signers_config[0].rut_variable] : ''}
            totalAmount={contractTotalAmount || (template.base_price +
              template.capsules
                .filter((c: any) => selectedCapsules.includes(c.id))
                .reduce((sum: number, c: any) => sum + c.price, 0)
            )}
            onPaymentSuccess={() => setCurrentStep('signatures')}
            onPaymentFailed={() => setCurrentStep('review')}
            onBack={() => setCurrentStep('review')}
          />
        )}

        {/* AMBOS FLUJOS: Paso de Firmas */}
        {currentStep === 'signatures' && contractId && trackingCode && (
          <SignatureStep
            contractId={contractId}
            trackingCode={trackingCode}
            onBack={() => setCurrentStep(useNewFlow ? 'review' : 'payment')}
          />
        )}
      </main>
    </div>
  );
}
