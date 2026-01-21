import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { ReviewStep } from '../../components/public/contract-editor/ReviewStep';
import { PaymentStep } from '../../components/public/contract-editor/PaymentStep';
import { SignatureStep } from '../../components/public/contract-editor/SignatureStep';
import { FormularioInicialStep } from '../../components/public/contract-editor/FormularioInicialStep';
import { CompletarFormularioStep } from '../../components/public/contract-editor/CompletarFormularioStep';
import { WaitingNotaryStep } from '../../components/public/contract-editor/WaitingNotaryStep';
import { Navbar } from '../../components/landing/Navbar';
import { getFlowConfig, type SignatureType } from '../../utils/flowConfig';
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

type Step = 'formulario-inicial' | 'payment' | 'completar' | 'review' | 'signatures' | 'waiting-notary';

export function ContractEditorPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [template, setTemplate] = useState<Template | null>(null);
  const [loading, setLoading] = useState(true);
  const [signatureInfoLoaded, setSignatureInfoLoaded] = useState(false);
  const [currentStep, setCurrentStep] = useState<Step>('formulario-inicial');
  const [signatureInfo, setSignatureInfo] = useState<SignatureInfo | undefined>(undefined);

  // Contract data
  const [selectedCapsules, setSelectedCapsules] = useState<number[]>([]);
  const [_formData, setFormData] = useState<Record<string, string>>({});
  const [contractId, setContractId] = useState<string | null>(null);
  const [trackingCode, setTrackingCode] = useState<string | null>(null);
  const [contractTotalAmount, setContractTotalAmount] = useState<number>(0);
  const [_renderedContractHtml, setRenderedContractHtml] = useState<string>('');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  
  // Datos del contrato para el nuevo flujo
  const [contractData, setContractData] = useState<ContractData | null>(null);
  const [buyerRut, setBuyerRut] = useState<string>('');
  const [signatureType, setSignatureType] = useState<SignatureType>('simple');
  const [requiresNotary, setRequiresNotary] = useState<boolean>(false);

  // Determinar si hay firmantes basándose en signatureInfo o template
  // Esta es la fuente de verdad para saber si el flujo tiene paso de firma
  const hasSigners = (): boolean => {
    // Primero verificar signatureInfo (viene del endpoint signature-info)
    if (signatureInfo) {
      return signatureInfo.numberOfSigners > 0;
    }
    // Si no hay signatureInfo, usar signers_config del template
    if (template?.signers_config) {
      return template.signers_config.length > 0;
    }
    return false;
  };

  // Determinar si requiere notario
  const getRequiresNotary = (): boolean => {
    // Si ya se estableció desde un contrato existente, usarlo
    if (requiresNotary) return true;
    // Usar signatureInfo si está disponible
    if (signatureInfo?.requiresNotary) return true;
    return false;
  };

  // Para los pasos, lo que importa es si hay firmantes o no:
  // - Sin firmantes (flujos 1 y 2): 4 pasos
  // - Con firmantes (flujos 3, 4, 5, 6): 5 pasos
  const effectiveSignatureType = hasSigners() ? signatureType : 'none';
  const effectiveRequiresNotary = getRequiresNotary();

  // Obtener la configuración del flujo actual
  const flowConfig = getFlowConfig(effectiveSignatureType, effectiveRequiresNotary);

  // Los pasos del progress bar vienen de la configuración del flujo
  const PROGRESS_STEPS = flowConfig.steps;


  useEffect(() => {
    const stepParam = searchParams.get('step');
    const idParam = searchParams.get('id');
    const codeParam = searchParams.get('code');
    const rutParam = searchParams.get('rut');
    
    // Si viene con code, primero cargar el contrato para obtener el slug
    if (codeParam && rutParam) {
      loadContractByCode(codeParam, rutParam, stepParam || 'completar');
      return;
    }
    
    // Si no hay slug, no podemos continuar
    if (!slug) {
      return;
    }
    
    // Cargar template normalmente
    loadTemplate();
    loadSignatureInfo();
    
    // Si hay parámetros de resume con ID, cargar el contrato
    if (stepParam && idParam && rutParam) {
      loadExistingContract(idParam, rutParam, stepParam);
    }
  }, [slug, searchParams]);

  const loadTemplate = async () => {
    try {
      console.log('🔍 Intentando cargar template con slug:', slug);
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
      console.error('Slug que se intentó cargar:', slug);
      alert(`Error al cargar el contrato: ${error.response?.data?.error || error.message}`);
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const loadSignatureInfo = async () => {
    if (!slug) {
      setSignatureInfoLoaded(true);
      return;
    }
    
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/templates/${slug}/signature-info`);
      if (response.data.success) {
        setSignatureInfo(response.data.data);
        console.log('📝 Signature info loaded:', response.data.data);
      }
    } catch (error) {
      console.error('Error loading signature info:', error);
    } finally {
      setSignatureInfoLoaded(true);
    }
  };

  const loadContractByCode = async (code: string, rut: string, step: string) => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/contracts/resume?code=${code}&rut=${encodeURIComponent(rut)}`
      );
      
      if (response.data.success) {
        const data = response.data.data;
        const templateSlug = data.template?.slug;
        
        if (!templateSlug) {
          alert('Error: No se encontró el template del contrato');
          navigate('/seguimiento');
          return;
        }
        
        // Redirigir al template correcto con el ID del contrato
        navigate(`/${templateSlug}?step=${step}&id=${data.id}&rut=${encodeURIComponent(rut)}`);
      } else {
        alert('Error al cargar el contrato');
        navigate('/seguimiento');
      }
    } catch (error: any) {
      console.error('Error loading contract by code:', error);
      alert(`Error al cargar el contrato: ${error.response?.data?.error || error.message}`);
      navigate('/seguimiento');
    } finally {
      setLoading(false);
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
        setRequiresNotary(data.template?.requires_notary || false);
        
        // Establecer cápsulas seleccionadas
        if (data.selectedCapsules) {
          setSelectedCapsules(data.selectedCapsules.map((c: any) => c.id));
        }
        
        // Ir al paso correspondiente según el estado
        if (step === 'completar' && data.status === 'draft') {
          setCurrentStep('completar');
        } else if (data.status === 'waiting_signatures') {
          setCurrentStep('signatures');
        } else if (data.status === 'waiting_notary') {
          setCurrentStep('waiting-notary');
        }
      }
    } catch (error) {
      console.error('Error loading existing contract:', error);
    }
  };

  // Función para aprobar revisión y avanzar al siguiente paso según el flujo
  const handleApproveAndSign = async () => {
    if (!contractId || !trackingCode || !buyerRut) {
      alert('Error: Faltan datos del contrato');
      return;
    }

    setIsProcessingPayment(true);

    try {
      // Aprobar revisión - el backend genera el PDF
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/contracts/${contractId}/approve-review`,
        {
          tracking_code: trackingCode,
          rut: buyerRut
        }
      );

      if (response.data.success) {
        const newStatus = response.data.data.status;
        
        console.log(`✅ Revisión aprobada. Nuevo estado: ${newStatus}. Flujo caso #${flowConfig.caseNumber}`);
        
        // Decidir siguiente paso basado en si hay firmantes o no
        const hasFirmantes = hasSigners();
        const needsNotary = effectiveRequiresNotary;
        
        if (!hasFirmantes && !needsNotary) {
          // Caso 1: Sin firmantes + Sin notario → Página de éxito
          console.log('🎉 Caso 1: Contrato completado directamente');
          navigate(`/contracts/success?tracking_code=${trackingCode}&completed=true`);
        } else if (!hasFirmantes && needsNotary) {
          // Caso 2: Sin firmantes + Con notario → Esperando notario
          console.log('⏳ Caso 2: Esperando notario');
          setCurrentStep('waiting-notary');
        } else {
          // Casos 3-6: Con firmantes → Paso de firmas (que mostrará si requiere notario o no)
          console.log(`📝 Caso ${flowConfig.caseNumber}: Esperando firmas`);
          setCurrentStep('signatures');
        }
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

  // Esperar a que se cargue el template Y la información de firma
  if (loading || !signatureInfoLoaded) {
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
      
      {/* Progress Bar - Only show for steps that don't have their own Header (Review, Signatures, Payment use internal or we migrate them later) */}
      {/* ProgressBar removed, now all steps handle their own header */}

      {/* Main Content */}
      <main className="flex-1 overflow-hidden">
        {/* Paso 1 - Formulario Inicial */}
        {currentStep === 'formulario-inicial' && template && (
          <FormularioInicialStep
            template={template}
            steps={PROGRESS_STEPS}
            signatureInfo={signatureInfo}
            onContinue={(data) => {
              setContractId(data.contractId);
              setTrackingCode(data.trackingCode);
              setContractTotalAmount(data.totalAmount);
              setFormData(data.formData);
              setSelectedCapsules(data.selectedCapsules);
              setSignatureType(data.signatureType);
              setBuyerRut(data.buyerRut);
              setRequiresNotary(data.requiresNotary || false);
              
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
                buyer_rut: data.buyerRut,
                buyer_email: data.buyerEmail,
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
            buyerRut={buyerRut || ''}
            totalAmount={contractTotalAmount}
            steps={PROGRESS_STEPS}
            hasSigners={hasSigners()}
            onPaymentFailed={() => setCurrentStep('formulario-inicial')}
            onBack={() => setCurrentStep('formulario-inicial')}
          />
        )}

        {/* Paso 3 - Completar Formulario */}
        {currentStep === 'completar' && template && contractData && (
          <CompletarFormularioStep
            template={template}
            contractData={contractData}
            steps={PROGRESS_STEPS}
            onComplete={(newFormData, html) => {
              setFormData(newFormData);
              setRenderedContractHtml(html);
              setCurrentStep('review');
            }}
            onBack={() => setCurrentStep('payment')}
          />
        )}

        {/* Paso 4 - Revisión */}
        {currentStep === 'review' && contractId && trackingCode && buyerRut && (
          <ReviewStep
            contractId={contractId}
            trackingCode={trackingCode}
            buyerRut={buyerRut}
            totalPrice={contractTotalAmount}
            steps={PROGRESS_STEPS}
            onApprove={handleApproveAndSign}
            onBack={() => setCurrentStep('completar')}
            isProcessing={isProcessingPayment}
            signatureType={signatureType}
          />
        )}

        {/* Paso 5 - Firmas (Casos 3, 4, 5, 6) */}
        {currentStep === 'signatures' && contractId && trackingCode && (
          <SignatureStep
            contractId={contractId}
            trackingCode={trackingCode}
            steps={PROGRESS_STEPS}
            requiresNotary={requiresNotary}
            signatureType={signatureType}
          />
        )}

        {/* Paso Esperando Notario (Caso 2: sin firma + con notario) */}
        {currentStep === 'waiting-notary' && trackingCode && (
          <WaitingNotaryStep
            trackingCode={trackingCode}
            steps={PROGRESS_STEPS}
            title={flowConfig.finalStateTitle}
            description={flowConfig.finalStateDescription}
          />
        )}
      </main>
    </div>
  );
}
