import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ContractEditor } from '../../components/public/contract-editor';
import { ReviewStep } from '../../components/public/contract-editor/ReviewStep';
import type { SignatureInfo } from '../../components/public/contract-editor/ReviewStep';
import { PaymentStep } from '../../components/public/contract-editor/PaymentStep';
import { SignatureStep } from '../../components/public/contract-editor/SignatureStep';
import { Navbar } from '../../components/landing/Navbar';
import { ProgressBar } from '../../components/shared/ProgressBar';
import { extractVariables } from '../../components/public/contract-editor/utils/templateParser';

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
  const [signatureInfo, setSignatureInfo] = useState<SignatureInfo | undefined>(undefined);

  // Contract data
  const [selectedCapsules, setSelectedCapsules] = useState<number[]>([]);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [contractId, setContractId] = useState<string | null>(null);
  const [trackingCode, setTrackingCode] = useState<string | null>(null);
  const [contractTotalAmount, setContractTotalAmount] = useState<number>(0);
  const [templateText, setTemplateText] = useState<string>('');
  const [renderedContractHtml, setRenderedContractHtml] = useState<string>('');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

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
            isProcessing={isProcessingPayment}
            signatureInfo={signatureInfo}
          />
        )}

        {currentStep === 'payment' && template && (
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

        {currentStep === 'signatures' && contractId && trackingCode && (
          <SignatureStep
            contractId={contractId}
            trackingCode={trackingCode}
            onBack={() => setCurrentStep('payment')}
          />
        )}
      </main>
    </div>
  );
}
