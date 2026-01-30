import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { Upload, FileText, X, AlertCircle, Plus, Trash2, User, ArrowRight, Info } from 'lucide-react';
import { EditorHeader } from '../contract-editor/EditorHeader';
import { uploadCustomDocument, calculateCustomPrice, type PricingInfo, type CustomContractSigner } from '../../../services/customContract.service';

interface StepConfig {
    key: string;
    label: string;
}

interface UploadConfigureStepProps {
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
}

// Info tooltip component
function InfoTooltip({ text }: { text: string }) {
    const [show, setShow] = useState(false);

    return (
        <div className="relative inline-block">
            <button
                type="button"
                onClick={() => setShow(!show)}
                onBlur={() => setShow(false)}
                className="w-5 h-5 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-700 transition-colors"
            >
                <Info className="w-3 h-3" />
            </button>
            {show && (
                <div className="absolute left-6 top-0 z-50 w-64 p-3 bg-navy-900 text-white text-xs rounded-lg shadow-lg animate-fade-in">
                    <div className="absolute left-0 top-2 -translate-x-1 w-2 h-2 bg-navy-900 rotate-45" />
                    {text}
                </div>
            )}
        </div>
    );
}

export function UploadConfigureStep({ pricing, steps, onContinue }: UploadConfigureStepProps) {
    // File state
    const [file, setFile] = useState<File | null>(null);
    const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [fileError, setFileError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Form state
    const [signatureType, setSignatureType] = useState<'simple' | 'fea' | 'none'>('simple');
    const [signers, setSigners] = useState<CustomContractSigner[]>([
        { full_name: '', rut: '', email: '', phone: '', role: 'party' }
    ]);
    const [requireNotary, setRequireNotary] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Contact Modal state
    const [showContactModal, setShowContactModal] = useState(false);
    const [buyerRut, setBuyerRut] = useState('');
    const [buyerEmail, setBuyerEmail] = useState('');

    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

    // Cleanup preview URL on unmount
    useEffect(() => {
        return () => {
            if (filePreviewUrl) {
                URL.revokeObjectURL(filePreviewUrl);
            }
        };
    }, [filePreviewUrl]);

    // Calculate price
    const priceInfo = useMemo(() => {
        return calculateCustomPrice(pricing, signatureType, signers.length, requireNotary);
    }, [pricing, signatureType, signers.length, requireNotary]);

    // File validation
    const validateFile = (file: File): boolean => {
        setFileError(null);

        if (file.type !== 'application/pdf') {
            setFileError('Solo se permiten archivos PDF');
            return false;
        }

        if (file.size > MAX_FILE_SIZE) {
            setFileError('El archivo no debe superar los 10MB');
            return false;
        }

        return true;
    };

    // Drag and drop handlers
    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);

        const droppedFile = e.dataTransfer.files[0];
        if (droppedFile && validateFile(droppedFile)) {
            setFile(droppedFile);
            // Create preview URL
            const url = URL.createObjectURL(droppedFile);
            setFilePreviewUrl(url);
        }
    }, []);

    const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile && validateFile(selectedFile)) {
            setFile(selectedFile);
            // Create preview URL
            const url = URL.createObjectURL(selectedFile);
            setFilePreviewUrl(url);
        }
    }, []);

    const removeFile = () => {
        setFile(null);
        setFileError(null);
        // Clean up the preview URL
        if (filePreviewUrl) {
            URL.revokeObjectURL(filePreviewUrl);
            setFilePreviewUrl(null);
        }
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

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
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
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

    const handleContinueClick = () => {
        setError(null);

        // Validate file first
        if (!file) {
            setError('Por favor sube un documento PDF');
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

        // Show contact modal
        setShowContactModal(true);
    };

    const handleGoToPayment = async () => {
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

        setIsSubmitting(true);

        try {
            const cleanSigners = signatureType === 'none' ? [] : signers.map(s => ({
                ...s,
                rut: s.rut.replace(/[.-]/g, '').toUpperCase(),
                email: s.email.toLowerCase().trim()
            }));

            const result = await uploadCustomDocument(file!, {
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

    // Convert steps to EditorHeader format
    const headerSteps = steps.map(s => ({ id: s.key, label: s.label }));

    return (
        <div className="h-full bg-slate-100 flex flex-col">
            {/* Header - Same as template flow */}
            <EditorHeader
                steps={headerSteps}
                currentStep="upload-configure"
                totalPrice={priceInfo.totalPrice}
                rightAction={
                    <button
                        onClick={handleContinueClick}
                        disabled={isSubmitting || !file}
                        className="bg-slate-900 text-white px-4 md:px-6 py-2 md:py-3 rounded-xl font-bold hover:bg-slate-800 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:scale-100 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg shadow-slate-900/10 text-sm md:text-base"
                    >
                        <span>Continuar al pago</span>
                        <ArrowRight className="w-4 h-4" />
                    </button>
                }
            />

            {/* Main Content - Two Column Layout */}
            <div className="relative z-10 flex-1 w-full max-w-[1920px] mx-auto p-3 md:p-6 flex flex-col lg:flex-row gap-4 md:gap-6 overflow-hidden min-h-0">

                {/* Left Column - PDF Upload */}
                <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col relative z-0 min-h-[400px] lg:min-h-0">
                    {/* Header with file info */}
                    <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between gap-4">
                        <h3 className="font-semibold text-navy-900 font-sans">Documento PDF</h3>
                        
                        {file && (
                            <div className="flex items-center gap-3">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 bg-legal-emerald-50 rounded-lg flex items-center justify-center">
                                        <FileText className="w-4 h-4 text-legal-emerald-600" />
                                    </div>
                                    <div className="flex flex-col">
                                        <p className="font-medium text-navy-900 text-sm truncate max-w-[200px]" title={file.name}>
                                            {file.name}
                                        </p>
                                        <p className="text-xs text-slate-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                                    </div>
                                </div>
                                <button
                                    onClick={removeFile}
                                    className="py-1.5 px-3 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg flex items-center gap-1.5 transition-colors whitespace-nowrap"
                                >
                                    <X className="w-3.5 h-3.5" />
                                    Cambiar archivo
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="flex-1 p-4 overflow-auto">
                        {!file ? (
                            <div
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onDrop={handleDrop}
                                onClick={() => fileInputRef.current?.click()}
                                className={`
                  relative h-full min-h-[300px] border-2 border-dashed rounded-xl cursor-pointer transition-all
                  flex flex-col items-center justify-center text-center p-6
                  ${isDragging
                                        ? 'border-legal-emerald-500 bg-legal-emerald-50'
                                        : 'border-slate-300 hover:border-navy-400 hover:bg-slate-50'
                                    }
                `}
                            >
                                <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${isDragging ? 'bg-legal-emerald-100' : 'bg-slate-100'
                                    }`}>
                                    <Upload className={`w-8 h-8 ${isDragging ? 'text-legal-emerald-600' : 'text-slate-400'}`} />
                                </div>

                                <p className="text-lg font-medium text-navy-900 mb-2">
                                    {isDragging ? 'Suelta tu archivo aquí' : 'Arrastra tu PDF aquí'}
                                </p>
                                <p className="text-sm text-slate-500 mb-4">o haz clic para seleccionar</p>
                                <p className="text-xs text-slate-400">PDF • Máximo 10MB</p>

                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="application/pdf"
                                    onChange={handleFileSelect}
                                    className="hidden"
                                />
                            </div>
                        ) : (
                            <div className="h-full min-h-[300px]">
                                {/* PDF Preview - Full height */}
                                {filePreviewUrl && (
                                    <div className="h-full border-2 border-slate-200 rounded-lg overflow-hidden bg-slate-50 relative">
                                        <iframe
                                            src={`${filePreviewUrl}#view=FitH&toolbar=0&navpanes=0&scrollbar=1`}
                                            className="w-full h-full min-h-[400px]"
                                            title="Vista previa del PDF"
                                            style={{ border: 'none' }}
                                        />
                                        <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded text-xs text-slate-600 shadow-sm">
                                            Vista previa
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {fileError && (
                            <div className="mt-4 flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                                <p className="text-sm text-red-700">{fileError}</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Column - Configuration Sidebar */}
                <div className="flex-1 h-full overflow-y-auto pr-2 space-y-4 pb-20 custom-scrollbar">

                    {/* 1. Notary - FIRST */}
                    <div className="bg-white rounded-lg shadow-document border border-slate-200 overflow-hidden transition-shadow hover:shadow-document-hover">
                        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center gap-2">
                            <h3 className="font-semibold text-navy-900 font-sans">Notarización</h3>
                            <InfoTooltip text="La notarización agrega validez legal adicional al documento mediante la certificación de un notario público. Recomendado para contratos de alto valor o documentos que requieran mayor respaldo legal." />
                        </div>
                        <div className="p-4">
                            <label className="flex items-start gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={requireNotary}
                                    onChange={(e) => setRequireNotary(e.target.checked)}
                                    className="mt-1 w-5 h-5 rounded border-slate-300 text-legal-emerald-600 focus:ring-legal-emerald-500"
                                />
                                <div className="flex-1">
                                    <div className="flex items-center justify-between">
                                        <span className="font-medium text-navy-900 text-sm">Incluir notarización</span>
                                        {pricing.notary > 0 && (
                                            <span className="text-sm font-semibold text-legal-emerald-700">
                                                +{formatPrice(pricing.notary)}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-slate-500 mt-1">Validación notarial del documento firmado</p>
                                </div>
                            </label>
                        </div>
                    </div>

                    {/* 2. Signature Type */}
                    <div className="bg-white rounded-lg shadow-document border border-slate-200 overflow-hidden transition-shadow hover:shadow-document-hover">
                        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center gap-2">
                            <h3 className="font-semibold text-navy-900 font-sans">Tipo de firma</h3>
                            <InfoTooltip text="FES (Firma Electrónica Simple): Firma rápida y estándar, válida para la mayoría de documentos. FEA (Firma Electrónica Avanzada): Incluye verificación de identidad biométrica, recomendada para documentos de mayor importancia legal." />
                        </div>
                        <div className="p-4 space-y-2">
                            {[
                                { value: 'simple', label: 'Firma Simple (FES)', desc: 'Rápida y estándar', price: pricing.fes.pricePerSigner },
                                { value: 'fea', label: 'Firma Avanzada (FEA)', desc: 'Verificación de identidad', price: pricing.fea.pricePerSigner },
                                { value: 'none', label: 'Sin firma electrónica', desc: 'Solo almacenamiento', price: 0 },
                            ].map((option) => (
                                <button
                                    key={option.value}
                                    type="button"
                                    onClick={() => setSignatureType(option.value as 'simple' | 'fea' | 'none')}
                                    className={`w-full p-3 rounded-lg border text-left transition-all ${signatureType === option.value
                                        ? 'border-legal-emerald-500 bg-legal-emerald-50 ring-1 ring-legal-emerald-500'
                                        : 'border-slate-200 hover:border-slate-300'
                                        }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <span className="font-medium text-navy-900 text-sm">{option.label}</span>
                                            <p className="text-xs text-slate-500">{option.desc}</p>
                                        </div>
                                        <span className="text-sm font-semibold text-legal-emerald-700">
                                            {option.price > 0 ? formatPrice(option.price) : 'Gratis'}
                                        </span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* 3. Signers */}
                    {signatureType !== 'none' && (
                        <div className="bg-white rounded-lg shadow-document border border-slate-200 overflow-hidden transition-shadow hover:shadow-document-hover">
                            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
                                <div className="flex items-center gap-2">
                                    <h3 className="font-semibold text-navy-900 font-sans flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-lg bg-legal-emerald-50 flex items-center justify-center">
                                            <Plus className="w-4 h-4 text-legal-emerald-600" />
                                        </div>
                                        Firmantes
                                    </h3>
                                    <InfoTooltip text="Agrega a todas las personas que deben firmar el documento. Cada firmante recibirá un correo electrónico con instrucciones para firmar." />
                                </div>
                                <button
                                    type="button"
                                    onClick={addSigner}
                                    className="px-3 py-1 text-xs font-medium text-legal-emerald-700 bg-legal-emerald-50 rounded-lg hover:bg-legal-emerald-100"
                                >
                                    + Agregar
                                </button>
                            </div>
                            <div className="p-4 space-y-3 max-h-80 overflow-y-auto">
                                {signers.map((signer, index) => (
                                    <div key={index} className="border border-slate-200 rounded-lg p-3 relative">
                                        {signers.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => removeSigner(index)}
                                                className="absolute top-2 right-2 text-slate-400 hover:text-red-500"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        )}
                                        <div className="text-xs font-medium text-slate-500 mb-2">Firmante {index + 1}</div>
                                        <div className="grid grid-cols-2 gap-2 pr-6">
                                            <input
                                                type="text"
                                                value={signer.full_name}
                                                onChange={(e) => updateSigner(index, 'full_name', e.target.value)}
                                                placeholder="Nombre completo"
                                                className="col-span-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-legal-emerald-500 focus:border-legal-emerald-500 outline-none"
                                            />
                                            <input
                                                type="text"
                                                value={signer.rut}
                                                onChange={(e) => updateSigner(index, 'rut', formatRut(e.target.value))}
                                                placeholder="RUT"
                                                maxLength={12}
                                                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-mono focus:ring-2 focus:ring-legal-emerald-500 focus:border-legal-emerald-500 outline-none"
                                            />
                                            <input
                                                type="email"
                                                value={signer.email}
                                                onChange={(e) => updateSigner(index, 'email', e.target.value)}
                                                placeholder="Email"
                                                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-legal-emerald-500 focus:border-legal-emerald-500 outline-none"
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Error Display */}
                    {error && !showContactModal && (
                        <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-100 flex items-start gap-2 animate-fade-in-up">
                            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                            <p>{error}</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Contact Data Modal - Same as template flow */}
            {showContactModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white rounded-lg shadow-document max-w-md w-full p-8 animate-fade-in-up border border-slate-200">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-lg bg-legal-emerald-600 flex items-center justify-center">
                                    <User className="w-6 h-6 text-white" />
                                </div>
                                <h3 className="text-xl font-serif font-bold text-navy-900">Datos de contacto</h3>
                            </div>
                            <button
                                onClick={() => setShowContactModal(false)}
                                className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors flex items-center justify-center"
                                disabled={isSubmitting}
                            >
                                ✕
                            </button>
                        </div>

                        <p className="text-slate-600 mb-6 text-sm font-sans leading-relaxed">
                            Ingresa tus datos para enviarte el código de seguimiento y el acceso a tu documento.
                        </p>

                        <div className="space-y-5">
                            <div>
                                <label className="block text-sm font-semibold text-navy-900 mb-2 font-sans">
                                    Tu RUT <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={buyerRut}
                                    onChange={(e) => setBuyerRut(formatRut(e.target.value))}
                                    placeholder="12.345.678-9"
                                    maxLength={12}
                                    disabled={isSubmitting}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-legal-emerald-500 focus:border-legal-emerald-500 transition-all font-mono disabled:opacity-50 text-navy-900"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-navy-900 mb-2 font-sans">
                                    Tu Email <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="email"
                                    value={buyerEmail}
                                    onChange={(e) => setBuyerEmail(e.target.value)}
                                    placeholder="nombre@ejemplo.com"
                                    disabled={isSubmitting}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-legal-emerald-500 focus:border-legal-emerald-500 transition-all disabled:opacity-50 font-sans text-navy-900"
                                />
                            </div>

                            {/* Error Display inside Modal */}
                            {error && (
                                <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm border border-red-100 flex items-start gap-3">
                                    <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                                    <p className="font-sans">{error}</p>
                                </div>
                            )}

                            <button
                                onClick={handleGoToPayment}
                                disabled={isSubmitting || !buyerRut || !buyerEmail}
                                className="w-full px-4 py-3.5 bg-navy-900 text-white font-semibold rounded-lg hover:bg-navy-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-sans shadow-lg"
                            >
                                {isSubmitting ? (
                                    <>
                                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/20 border-t-white"></div>
                                        <span>Procesando...</span>
                                    </>
                                ) : (
                                    <span>Continuar al pago</span>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
