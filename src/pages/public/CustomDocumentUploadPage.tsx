import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Navbar } from '../../components/landing/Navbar';
import { PaymentStep } from '../../components/public/contract-editor/PaymentStep';
import { SignatureStep } from '../../components/public/contract-editor/SignatureStep';
import { WaitingNotaryStep } from '../../components/public/contract-editor/WaitingNotaryStep';
import { UploadConfigureStep } from '../../components/public/custom-document/UploadConfigureStep';
import { CustomPreviewStep } from '../../components/public/custom-document/CustomPreviewStep';
import {
    getCustomPricingInfo,
    resumeCustomContract,
    type PricingInfo,
    type CustomContractSigner,
    type CustomContractResumeData
} from '../../services/customContract.service';

type Step = 'upload-configure' | 'payment' | 'preview' | 'signatures' | 'waiting-notary';

interface StepConfig {
    id: string;
    key: Step;
    label: string;
}

const PROGRESS_STEPS: StepConfig[] = [
    { id: 'upload-configure', key: 'upload-configure', label: 'Documento y firma' },
    { id: 'payment', key: 'payment', label: 'Pago' },
    { id: 'preview', key: 'preview', label: 'Revisar' },
    { id: 'signatures', key: 'signatures', label: 'Firmas' },
];

export function CustomDocumentUploadPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const [currentStep, setCurrentStep] = useState<Step>('upload-configure');
    const [loading, setLoading] = useState(true);
    const [pricing, setPricing] = useState<PricingInfo | null>(null);

    // Configuration state
    const [buyerRut, setBuyerRut] = useState('');
    const [signatureType, setSignatureType] = useState<'simple' | 'fea' | 'none'>('simple');
    const [signers, setSigners] = useState<CustomContractSigner[]>([]);
    const [requireNotary, setRequireNotary] = useState(false);

    // Contract state
    const [contractId, setContractId] = useState<string | null>(null);
    const [trackingCode, setTrackingCode] = useState<string | null>(null);
    const [totalAmount, setTotalAmount] = useState(0);
    const [isProcessing, setIsProcessing] = useState(false);

    // Load pricing info on mount
    useEffect(() => {
        loadPricingInfo();
    }, []);

    // Check for resume flow
    useEffect(() => {
        const idParam = searchParams.get('id');
        const codeParam = searchParams.get('code');
        const rutParam = searchParams.get('rut');
        const stepParam = searchParams.get('step');

        if ((idParam || codeParam) && rutParam) {
            resumeFlow(idParam || undefined, codeParam || undefined, rutParam, stepParam);
        }
    }, [searchParams]);

    const loadPricingInfo = async () => {
        try {
            const data = await getCustomPricingInfo();
            setPricing(data);
        } catch (error) {
            console.error('Error loading pricing info:', error);
        } finally {
            setLoading(false);
        }
    };

    const resumeFlow = async (id?: string, code?: string, rut?: string, step?: string | null) => {
        if (!rut) return;

        try {
            setLoading(true);
            const data: CustomContractResumeData = await resumeCustomContract({
                id,
                code,
                rut
            });

            // Restore state
            setContractId(data.id);
            setTrackingCode(data.tracking_code);
            setBuyerRut(data.buyer_rut);
            setTotalAmount(data.total_amount);
            setSignatureType(data.signature_type as 'simple' | 'fea' | 'none');
            setRequireNotary(data.require_notary);

            // Convert signers
            const loadedSigners = data.signers
                .filter(s => s.role !== 'notary')
                .map(s => ({
                    full_name: s.full_name,
                    rut: s.rut,
                    email: s.email,
                    phone: s.phone,
                    role: s.role
                }));
            setSigners(loadedSigners);

            // Determine step based on status or param
            if (step === 'preview' || data.status === 'draft') {
                setCurrentStep('preview');
            } else if (data.status === 'waiting_signatures') {
                setCurrentStep('signatures');
            } else if (data.status === 'waiting_notary') {
                setCurrentStep('waiting-notary');
            } else if (data.status === 'completed') {
                navigate(`/contracts/success?tracking_code=${data.tracking_code}&completed=true`);
            }
        } catch (error) {
            console.error('Error resuming flow:', error);
            alert('Error al recuperar el contrato');
        } finally {
            setLoading(false);
        }
    };

    const handleUploadConfigureComplete = useCallback((data: {
        contractId: string;
        trackingCode: string;
        totalAmount: number;
        buyerRut: string;
        buyerEmail: string;
        signatureType: 'simple' | 'fea' | 'none';
        signers: CustomContractSigner[];
        requireNotary: boolean;
    }) => {
        setContractId(data.contractId);
        setTrackingCode(data.trackingCode);
        setTotalAmount(data.totalAmount);
        setBuyerRut(data.buyerRut);
        setSignatureType(data.signatureType);
        setSigners(data.signers);
        setRequireNotary(data.requireNotary);
        setCurrentStep('payment');
    }, []);

    const handleApproveReview = async () => {
        if (!contractId || !trackingCode || !buyerRut) {
            alert('Error: Faltan datos del contrato');
            return;
        }

        setIsProcessing(true);

        try {
            const response = await fetch(
                `${import.meta.env.VITE_API_URL}/contracts/${contractId}/approve-review`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        tracking_code: trackingCode,
                        rut: buyerRut,
                    }),
                }
            );

            const result = await response.json();

            if (result.success) {
                const newStatus = result.data.status;

                if (newStatus === 'completed') {
                    navigate(`/contracts/success?tracking_code=${trackingCode}&completed=true`);
                } else if (newStatus === 'waiting_notary') {
                    setCurrentStep('waiting-notary');
                } else {
                    setCurrentStep('signatures');
                }
            } else {
                alert(result.error || 'Error al aprobar la revisión');
            }
        } catch (error: any) {
            console.error('Error approving review:', error);
            alert(`Error: ${error.message}`);
        } finally {
            setIsProcessing(false);
        }
    };

    const hasSigners = signers.length > 0;
    const effectiveSteps = hasSigners || signatureType !== 'none'
        ? PROGRESS_STEPS
        : PROGRESS_STEPS.filter(s => s.key !== 'signatures');

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-navy-900 mx-auto"></div>
                    <p className="mt-4 text-slate-600 font-sans">Cargando...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-screen flex flex-col bg-slate-100">
            <Navbar />

            <main className="flex-1 overflow-hidden">
                {/* Combined Upload + Configure Step */}
                {currentStep === 'upload-configure' && pricing && (
                    <UploadConfigureStep
                        pricing={pricing}
                        steps={effectiveSteps}
                        onContinue={handleUploadConfigureComplete}
                    />
                )}

                {/* Payment Step */}
                {currentStep === 'payment' && contractId && trackingCode && (
                    <PaymentStep
                        contractId={contractId}
                        trackingCode={trackingCode}
                        buyerRut={buyerRut}
                        totalAmount={totalAmount}
                        steps={effectiveSteps}
                        hasSigners={hasSigners}
                        onPaymentFailed={() => setCurrentStep('upload-configure')}
                        onBack={() => setCurrentStep('upload-configure')}
                    />
                )}

                {/* Preview Step */}
                {currentStep === 'preview' && contractId && trackingCode && (
                    <CustomPreviewStep
                        contractId={contractId}
                        trackingCode={trackingCode}
                        buyerRut={buyerRut}
                        totalAmount={totalAmount}
                        signers={signers}
                        requireNotary={requireNotary}
                        signatureType={signatureType}
                        steps={effectiveSteps}
                        onApprove={handleApproveReview}
                        onBack={() => setCurrentStep('payment')}
                        isProcessing={isProcessing}
                    />
                )}

                {/* Signatures Step */}
                {currentStep === 'signatures' && contractId && trackingCode && (
                    <SignatureStep
                        contractId={contractId}
                        trackingCode={trackingCode}
                        steps={effectiveSteps}
                        requiresNotary={requireNotary}
                        signatureType={signatureType}
                    />
                )}

                {/* Waiting Notary Step */}
                {currentStep === 'waiting-notary' && trackingCode && (
                    <WaitingNotaryStep
                        trackingCode={trackingCode}
                        steps={effectiveSteps}
                        title="Esperando notario"
                        description="Tu documento ha sido enviado al notario para su validación."
                    />
                )}
            </main>
        </div>
    );
}

export default CustomDocumentUploadPage;
