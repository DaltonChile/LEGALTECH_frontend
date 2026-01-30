import { useState, useMemo, useCallback } from 'react';
import { uploadCustomDocument, calculateCustomPrice, type PricingInfo, type CustomContractSigner } from '../../../services/customContract.service';

interface StepConfig {
    key: string;
    label: string;
}

interface ConfigureStepProps {
    file: File;
    pricing: PricingInfo;
    steps: StepConfig[];
    onContinue: (data: {
        contractId: string;
        trackingCode: string;
        totalAmount: number;
        buyerRut: string;
        buyerEmail: string;
        signatureType: 'simple' | 'fea' | 'none';
        signers: CustomContractSigner[];
        requireNotary: boolean;
    }) => void;
    onBack: () => void;
}

export function ConfigureStep({ file, pricing, steps, onContinue, onBack }: ConfigureStepProps) {
    const [buyerRut, setBuyerRut] = useState('');
    const [buyerEmail, setBuyerEmail] = useState('');
    const [signatureType, setSignatureType] = useState<'simple' | 'fea' | 'none'>('simple');
    const [signers, setSigners] = useState<CustomContractSigner[]>([
        { full_name: '', rut: '', email: '', phone: '', role: 'party' }
    ]);
    const [requireNotary, setRequireNotary] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Calculate price
    const priceInfo = useMemo(() => {
        return calculateCustomPrice(pricing, signatureType, signers.length, requireNotary);
    }, [pricing, signatureType, signers.length, requireNotary]);

    // Format RUT while typing
    const formatRut = (value: string) => {
        let rut = value.replace(/[^0-9kK]/g, '').toUpperCase();
        if (rut.length > 1) {
            const dv = rut.slice(-1);
            let body = rut.slice(0, -1);
            body = body.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
            rut = body + '-' + dv;
        }
        return rut;
    };

    // Validate RUT format
    const isValidRut = (rut: string) => {
        if (!rut || rut.length < 3) return false;
        const cleanRut = rut.replace(/[.-]/g, '').toUpperCase();
        const body = cleanRut.slice(0, -1);
        const dv = cleanRut.slice(-1);

        if (!/^\d+$/.test(body)) return false;

        let sum = 0;
        let multiplier = 2;
        for (let i = body.length - 1; i >= 0; i--) {
            sum += parseInt(body[i]) * multiplier;
            multiplier = multiplier === 7 ? 2 : multiplier + 1;
        }
        const expectedDv = 11 - (sum % 11);
        const dvChar = expectedDv === 11 ? '0' : expectedDv === 10 ? 'K' : expectedDv.toString();

        return dv === dvChar;
    };

    const isValidEmail = (email: string) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    const addSigner = useCallback(() => {
        setSigners(prev => [...prev, { full_name: '', rut: '', email: '', phone: '', role: 'party' }]);
    }, []);

    const removeSigner = useCallback((index: number) => {
        setSigners(prev => prev.filter((_, i) => i !== index));
    }, []);

    const updateSigner = useCallback((index: number, field: keyof CustomContractSigner, value: string) => {
        setSigners(prev => {
            const newSigners = [...prev];
            newSigners[index] = { ...newSigners[index], [field]: value };
            return newSigners;
        });
    }, []);

    const handleSubmit = async () => {
        setError(null);

        // Validate buyer data
        if (!isValidRut(buyerRut)) {
            setError('Por favor ingresa un RUT válido');
            return;
        }

        if (!isValidEmail(buyerEmail)) {
            setError('Por favor ingresa un email válido');
            return;
        }

        // Validate signers if any
        if (signatureType !== 'none') {
            for (let i = 0; i < signers.length; i++) {
                const signer = signers[i];
                if (!signer.full_name.trim()) {
                    setError(`El nombre del firmante ${i + 1} es requerido`);
                    return;
                }
                if (!isValidRut(signer.rut)) {
                    setError(`El RUT del firmante ${i + 1} no es válido`);
                    return;
                }
                if (!isValidEmail(signer.email)) {
                    setError(`El email del firmante ${i + 1} no es válido`);
                    return;
                }
            }
        }

        setIsSubmitting(true);

        try {
            // Clean signers data
            const cleanSigners = signatureType === 'none' ? [] : signers.map(s => ({
                ...s,
                rut: s.rut.replace(/[.-]/g, '').toUpperCase(),
                email: s.email.toLowerCase().trim()
            }));

            const result = await uploadCustomDocument(file, {
                buyer_rut: buyerRut.replace(/[.-]/g, '').toUpperCase(),
                buyer_email: buyerEmail.toLowerCase().trim(),
                signature_type: signatureType,
                signers: cleanSigners,
                require_notary: requireNotary
            });

            onContinue({
                contractId: result.id,
                trackingCode: result.tracking_code,
                totalAmount: result.total_amount,
                buyerRut: buyerRut.replace(/[.-]/g, '').toUpperCase(),
                buyerEmail: buyerEmail.toLowerCase().trim(),
                signatureType,
                signers: cleanSigners,
                requireNotary
            });
        } catch (err: any) {
            console.error('Error uploading custom document:', err);
            const details = err.response?.data?.details;
            setError(details ? details.join(', ') : err.message || 'Error al crear el contrato');
        } finally {
            setIsSubmitting(false);
        }
    };

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('es-CL', {
            style: 'currency',
            currency: 'CLP',
        }).format(price);
    };

    const currentStepIndex = steps.findIndex(s => s.key === 'configure');

    return (
        <div className="h-full flex flex-col">
            {/* Header */}
            <div className="bg-white shadow-sm border-b border-slate-200 px-6 py-4">
                <div className="max-w-4xl mx-auto">
                    <h1 className="text-2xl font-serif font-bold text-navy-900">Configurar firma</h1>
                    <p className="text-slate-600 mt-1 font-sans">Documento: {file.name}</p>

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
                                    {index + 1}
                                </div>
                                <span className={`ml-2 text-sm ${index === currentStepIndex ? 'text-navy-900 font-medium' : 'text-slate-500'
                                    }`}>
                                    {step.label}
                                </span>
                                {index < steps.length - 1 && (
                                    <div className="w-8 h-0.5 mx-2 bg-slate-200" />
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto p-6">
                <div className="max-w-2xl mx-auto space-y-6">
                    {/* Buyer Info */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                        <h3 className="text-lg font-semibold text-navy-900 mb-4">Tus datos</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Tu RUT *</label>
                                <input
                                    type="text"
                                    value={buyerRut}
                                    onChange={(e) => setBuyerRut(formatRut(e.target.value))}
                                    placeholder="12.345.678-9"
                                    maxLength={12}
                                    className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-legal-emerald-500 focus:border-legal-emerald-500 font-mono"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Tu Email *</label>
                                <input
                                    type="email"
                                    value={buyerEmail}
                                    onChange={(e) => setBuyerEmail(e.target.value)}
                                    placeholder="tu@email.com"
                                    className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-legal-emerald-500 focus:border-legal-emerald-500"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Signature Type */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                        <h3 className="text-lg font-semibold text-navy-900 mb-4">Tipo de firma</h3>
                        <div className="space-y-3">
                            <button
                                type="button"
                                onClick={() => setSignatureType('simple')}
                                className={`w-full p-4 rounded-lg border text-left transition-all ${signatureType === 'simple'
                                        ? 'border-legal-emerald-500 bg-legal-emerald-50 ring-1 ring-legal-emerald-500'
                                        : 'border-slate-200 hover:border-slate-300'
                                    }`}
                            >
                                <div className="flex items-center justify-between mb-1">
                                    <span className="font-semibold text-navy-900">Firma Simple (FES)</span>
                                    <span className="text-legal-emerald-700 font-bold">
                                        {formatPrice(pricing.fes.pricePerSigner)}/firmante
                                    </span>
                                </div>
                                <p className="text-sm text-slate-500">Rápida y estándar. Para la mayoría de los casos.</p>
                            </button>

                            <button
                                type="button"
                                onClick={() => setSignatureType('fea')}
                                className={`w-full p-4 rounded-lg border text-left transition-all ${signatureType === 'fea'
                                        ? 'border-legal-emerald-500 bg-legal-emerald-50 ring-1 ring-legal-emerald-500'
                                        : 'border-slate-200 hover:border-slate-300'
                                    }`}
                            >
                                <div className="flex items-center justify-between mb-1">
                                    <span className="font-semibold text-navy-900">Firma Avanzada (FEA)</span>
                                    <span className="text-legal-emerald-700 font-bold">
                                        {formatPrice(pricing.fea.pricePerSigner)}/firmante
                                    </span>
                                </div>
                                <p className="text-sm text-slate-500">Máxima seguridad legal. Verificación de identidad.</p>
                            </button>

                            <button
                                type="button"
                                onClick={() => setSignatureType('none')}
                                className={`w-full p-4 rounded-lg border text-left transition-all ${signatureType === 'none'
                                        ? 'border-legal-emerald-500 bg-legal-emerald-50 ring-1 ring-legal-emerald-500'
                                        : 'border-slate-200 hover:border-slate-300'
                                    }`}
                            >
                                <div className="flex items-center justify-between mb-1">
                                    <span className="font-semibold text-navy-900">Sin firma electrónica</span>
                                    <span className="text-slate-500 font-medium">Gratis</span>
                                </div>
                                <p className="text-sm text-slate-500">Solo almacenamiento y tracking. Sin proceso de firma.</p>
                            </button>
                        </div>
                    </div>

                    {/* Signers */}
                    {signatureType !== 'none' && (
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-navy-900">Firmantes</h3>
                                <button
                                    type="button"
                                    onClick={addSigner}
                                    className="px-4 py-2 text-sm font-medium text-legal-emerald-700 bg-legal-emerald-50 rounded-lg hover:bg-legal-emerald-100 transition-colors"
                                >
                                    + Agregar firmante
                                </button>
                            </div>

                            <div className="space-y-4">
                                {signers.map((signer, index) => (
                                    <div key={index} className="border border-slate-200 rounded-lg p-4">
                                        <div className="flex items-center justify-between mb-3">
                                            <span className="font-medium text-navy-900">Firmante {index + 1}</span>
                                            {signers.length > 1 && (
                                                <button
                                                    type="button"
                                                    onClick={() => removeSigner(index)}
                                                    className="text-red-500 text-sm hover:text-red-700"
                                                >
                                                    Eliminar
                                                </button>
                                            )}
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            <input
                                                type="text"
                                                value={signer.full_name}
                                                onChange={(e) => updateSigner(index, 'full_name', e.target.value)}
                                                placeholder="Nombre completo *"
                                                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-legal-emerald-500"
                                            />
                                            <input
                                                type="text"
                                                value={signer.rut}
                                                onChange={(e) => updateSigner(index, 'rut', formatRut(e.target.value))}
                                                placeholder="RUT *"
                                                maxLength={12}
                                                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-legal-emerald-500 font-mono"
                                            />
                                            <input
                                                type="email"
                                                value={signer.email}
                                                onChange={(e) => updateSigner(index, 'email', e.target.value)}
                                                placeholder="Email *"
                                                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-legal-emerald-500"
                                            />
                                            <input
                                                type="tel"
                                                value={signer.phone || ''}
                                                onChange={(e) => updateSigner(index, 'phone', e.target.value)}
                                                placeholder="Teléfono (opcional)"
                                                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-legal-emerald-500"
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Notary */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                        <label className="flex items-center gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={requireNotary}
                                onChange={(e) => setRequireNotary(e.target.checked)}
                                className="w-5 h-5 rounded border-slate-300 text-legal-emerald-600 focus:ring-legal-emerald-500"
                            />
                            <div>
                                <span className="font-medium text-navy-900">Requiere notarización</span>
                                <p className="text-sm text-slate-500">El documento será enviado a un notario para validación</p>
                                {pricing.notary > 0 && (
                                    <span className="text-sm text-legal-emerald-700 font-medium">
                                        +{formatPrice(pricing.notary)}
                                    </span>
                                )}
                            </div>
                        </label>
                    </div>

                    {/* Price Summary */}
                    <div className="bg-navy-900 text-white rounded-xl p-6">
                        <h3 className="text-lg font-semibold mb-4">Resumen</h3>
                        <div className="space-y-2 text-sm">
                            {priceInfo.basePrice > 0 && (
                                <div className="flex justify-between">
                                    <span>Servicio base</span>
                                    <span>{formatPrice(priceInfo.basePrice)}</span>
                                </div>
                            )}
                            {priceInfo.signaturePrice > 0 && (
                                <div className="flex justify-between">
                                    <span>Firmas ({signers.length} firmante{signers.length > 1 ? 's' : ''})</span>
                                    <span>{formatPrice(priceInfo.signaturePrice)}</span>
                                </div>
                            )}
                            {priceInfo.notaryPrice > 0 && (
                                <div className="flex justify-between">
                                    <span>Notarización</span>
                                    <span>{formatPrice(priceInfo.notaryPrice)}</span>
                                </div>
                            )}
                            <div className="border-t border-white/20 pt-2 flex justify-between text-lg font-bold">
                                <span>Total</span>
                                <span>{formatPrice(priceInfo.totalPrice)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-red-700 text-sm">{error}</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Footer */}
            <div className="bg-white border-t border-slate-200 px-6 py-4">
                <div className="max-w-4xl mx-auto flex justify-between">
                    <button
                        onClick={onBack}
                        disabled={isSubmitting}
                        className="px-6 py-2 text-slate-600 hover:text-slate-800 font-medium disabled:opacity-50"
                    >
                        ← Volver
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting || !buyerRut || !buyerEmail}
                        className={`px-8 py-3 rounded-lg font-medium transition-colors ${isSubmitting || !buyerRut || !buyerEmail
                                ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                : 'bg-navy-900 text-white hover:bg-navy-800'
                            }`}
                    >
                        {isSubmitting ? (
                            <span className="flex items-center gap-2">
                                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/20 border-t-white" />
                                Procesando...
                            </span>
                        ) : (
                            'Continuar al pago →'
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
