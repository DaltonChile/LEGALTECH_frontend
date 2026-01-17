import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { ReviewStep } from '../../components/public/contract-editor/ReviewStep';
import { PaymentStep } from '../../components/public/contract-editor/PaymentStep';
import { SignatureStep } from '../../components/public/contract-editor/SignatureStep';
import { FormularioInicialStep } from '../../components/public/contract-editor/FormularioInicialStep';
import { CompletarFormularioStep } from '../../components/public/contract-editor/CompletarFormularioStep';
import { Navbar } from '../../components/landing/Navbar';
import { ProgressBar } from '../../components/shared/ProgressBar';
import type { ContractData } from '../../types/contract';

interface SignatureInfo {
  numberOfSigners: number;
  requiresNotary: boolean;
  requiresSignatures: boolean;
  pricing: {
    fes: { pricePerSigner: number; totalPrice: number };
    fea: { pricePerSigner: number; totalPrice: number };
  };
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
  clause_numbering?: any[];
  signers_config?: any[];
  variables_metadata?: Array<{ name: string; description: string | null; type: string }>;
  capsules: any[];
}

type Step = 'formulario-inicial' | 'payment' | 'completar' | 'review' | 'signatures';

// Flujo: Formulario Inicial -> Pago -> Completar -> Review -> Firmas
const PROGRESS_STEPS = [
  { id: 'formulario-inicial', label: 'Datos iniciales' },
  { id: 'payment', label: 'Pago' },
  { id: 'completar', label: 'Completar formulario' },
  { id: 'review', label: 'Revisar' },
  { id: 'signatures', label: 'Firmar' },
];

export function ContractEditorPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [template, setTemplate] = useState<Template | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState<Step>('formulario-inicial');
  const [signatureInfo, setSignatureInfo] = useState<SignatureInfo | undefined>(undefined);

  // Contract data
  const [selectedCapsules, setSelectedCapsules] = useState<number[]>([]);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [contractId, setContractId] = useState<string | null>(null);
  const [trackingCode, setTrackingCode] = useState<string | null>(null);
  const [contractTotalAmount, setContractTotalAmount] = useState<number>(0);
  const [renderedContractHtml, setRenderedContractHtml] = useState<string>('');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  
  // Datos del contrato para el nuevo flujo
  const [contractData, setContractData] = useState<ContractData | null>(null);
  const [buyerRut, setBuyerRut] = useState<string>('');
  const [signatureType, setSignatureType] = useState<'none' | 'simple' | 'fea'>('simple');


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

  // Función para subir PDF borrador
  const uploadDraftPdf = async (cId: string, tCode: string, rut: string, pdfBlob: Blob) => {
    try {
      console.log('📤 Uploading draft PDF to server...');
      
      const uploadFormData = new FormData();
      uploadFormData.append('draft_pdf', pdfBlob, 'contract.pdf');
      uploadFormData.append('tracking_code', tCode);
      uploadFormData.append('rut', rut);
      
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/contracts/${cId}/upload-draft-pdf`,
        uploadFormData,
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
    }
  };

  // Función para aprobar revisión y enviar a firma
  const handleApproveAndSign = async () => {
    if (!contractId || !trackingCode || !buyerRut) {
      alert('Error: Faltan datos del contrato');
      return;
    }

    setIsProcessingPayment(true);

    try {
      // Primero subir el PDF borrador
      if (renderedContractHtml) {
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
        {/* Paso 1 - Formulario Inicial */}
        {currentStep === 'formulario-inicial' && template && (
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

        {/* Paso 2 - Pago */}
        {currentStep === 'payment' && template && contractId && (
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

        {/* Paso 3 - Completar Formulario */}
        {currentStep === 'completar' && template && contractData && (
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

        {/* Paso 4 - Revisión */}
        {currentStep === 'review' && template && renderedContractHtml && (
          <ReviewStep
            renderedContractHtml={renderedContractHtml}
            totalPrice={contractTotalAmount}
            onApprove={handleApproveAndSign}
            onBack={() => setCurrentStep('completar')}
            isProcessing={isProcessingPayment}
            signatureType={signatureType}
          />
        )}

        {/* Paso 5 - Firmas */}
        {currentStep === 'signatures' && contractId && trackingCode && (
          <SignatureStep
            contractId={contractId}
            trackingCode={trackingCode}
            onBack={() => setCurrentStep('review')}
          />
        )}
      </main>
    </div>
  );
}
