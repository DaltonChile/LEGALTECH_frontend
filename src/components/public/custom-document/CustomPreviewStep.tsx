import type { CustomContractSigner } from '../../../services/customContract.service';

interface StepConfig {
    key: string;
    label: string;
}

interface CustomPreviewStepProps {
    contractId: string;
    trackingCode: string;
    buyerRut: string;
    totalAmount: number;
    signers: CustomContractSigner[];
    requireNotary: boolean;
    signatureType: 'simple' | 'fea' | 'none';
    steps: StepConfig[];
    onApprove: () => void;
    onBack: () => void;
    isProcessing: boolean;
}

export function CustomPreviewStep({
    trackingCode,
    totalAmount,
    signers,
    requireNotary,
    signatureType,
    steps,
    onApprove,
    onBack,
    isProcessing
}: CustomPreviewStepProps) {
    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('es-CL', {
            style: 'currency',
            currency: 'CLP',
        }).format(price);
    };

    const getSignatureLabel = () => {
        switch (signatureType) {
            case 'simple': return 'Firma Simple (FES)';
            case 'fea': return 'Firma Avanzada (FEA)';
            case 'none': return 'Sin firma electrónica';
        }
    };

    const currentStepIndex = steps.findIndex(s => s.key === 'preview');

    return (
        <div className="h-full flex flex-col">
            {/* Header */}
            <div className="bg-white shadow-sm border-b border-slate-200 px-6 py-4">
                <div className="max-w-4xl mx-auto">
                    <h1 className="text-2xl font-serif font-bold text-navy-900">Revisar y aprobar</h1>
                    <p className="text-slate-600 mt-1 font-sans">Código de seguimiento: <span className="font-mono font-medium text-navy-900">{trackingCode}</span></p>

                    {/* Progress bar */}
                    <div className="mt-4 flex items-center gap-2">
                        {steps.map((step, index) => (
                            <div key={step.key} className="flex items-center">
                                <div
                                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${index < currentStepIndex
                                        ? 'bg-legal-emerald-500 text-white'
                                        : index === currentStepIndex
                                            ? 'bg-navy-900 text-white'
                                            : 'bg-slate-200 text-slate-500'
                                        }`}
                                >
                                    {index < currentStepIndex ? (
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                    ) : (
                                        index + 1
                                    )}
                                </div>
                                <span className={`ml-2 text-sm ${index === currentStepIndex ? 'text-navy-900 font-medium' : 'text-slate-500'
                                    }`}>
                                    {step.label}
                                </span>
                                {index < steps.length - 1 && (
                                    <div className={`w-8 h-0.5 mx-2 ${index < currentStepIndex ? 'bg-legal-emerald-500' : 'bg-slate-200'
                                        }`} />
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto p-6">
                <div className="max-w-2xl mx-auto space-y-6">
                    {/* Success Banner */}
                    <div className="bg-legal-emerald-50 border border-legal-emerald-200 rounded-xl p-6">
                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-full bg-legal-emerald-100 flex items-center justify-center flex-shrink-0">
                                <svg className="w-6 h-6 text-legal-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-navy-900">¡Pago confirmado!</h3>
                                <p className="text-slate-600 mt-1">Tu documento está listo para ser enviado a firma.</p>
                            </div>
                        </div>
                    </div>

                    {/* Summary Card */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="p-6 border-b border-slate-100">
                            <h3 className="text-lg font-semibold text-navy-900 mb-4">Resumen del documento</h3>

                            <div className="space-y-4">
                                <div className="flex justify-between items-center py-2 border-b border-slate-100">
                                    <span className="text-slate-600">Tipo de firma</span>
                                    <span className="font-medium text-navy-900">{getSignatureLabel()}</span>
                                </div>

                                <div className="flex justify-between items-center py-2 border-b border-slate-100">
                                    <span className="text-slate-600">Total pagado</span>
                                    <span className="font-bold text-legal-emerald-700 text-lg">{formatPrice(totalAmount)}</span>
                                </div>

                                {requireNotary && (
                                    <div className="flex justify-between items-center py-2 border-b border-slate-100">
                                        <span className="text-slate-600">Notarización</span>
                                        <span className="font-medium text-navy-900">Incluida</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Signers List */}
                        {signers.length > 0 && (
                            <div className="p-6">
                                <h4 className="font-medium text-navy-900 mb-3">Firmantes ({signers.length})</h4>
                                <div className="space-y-3">
                                    {signers.map((signer, index) => (
                                        <div key={index} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                                            <div className="w-10 h-10 rounded-full bg-navy-100 flex items-center justify-center">
                                                <span className="text-navy-600 font-medium text-sm">
                                                    {signer.full_name.charAt(0).toUpperCase()}
                                                </span>
                                            </div>
                                            <div className="flex-1">
                                                <p className="font-medium text-navy-900 text-sm">{signer.full_name}</p>
                                                <p className="text-slate-500 text-xs">{signer.email}</p>
                                            </div>
                                            <div className="text-xs text-slate-400 font-mono">{signer.rut}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Info Box */}
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                        <div className="flex items-start gap-3">
                            <svg className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <div>
                                <p className="text-amber-800 text-sm font-medium">Al aprobar, se enviará una invitación a cada firmante.</p>
                                <p className="text-amber-700 text-xs mt-1">Recibirán un email con un enlace para firmar el documento.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="bg-white border-t border-slate-200 px-6 py-4">
                <div className="max-w-4xl mx-auto flex justify-between">
                    <button
                        onClick={onBack}
                        disabled={isProcessing}
                        className="px-6 py-2 text-slate-600 hover:text-slate-800 font-medium disabled:opacity-50"
                    >
                        ← Volver
                    </button>
                    <button
                        onClick={onApprove}
                        disabled={isProcessing}
                        className={`px-8 py-3 rounded-lg font-medium transition-colors ${isProcessing
                            ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                            : 'bg-legal-emerald-600 text-white hover:bg-legal-emerald-700'
                            }`}
                    >
                        {isProcessing ? (
                            <span className="flex items-center gap-2">
                                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/20 border-t-white" />
                                Procesando...
                            </span>
                        ) : (
                            '✓ Aprobar y enviar a firmar'
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
