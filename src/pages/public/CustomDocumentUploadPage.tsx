import { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Upload, 
  FileText, 
  Users, 
  CreditCard, 
  Check, 
  X, 
  Plus, 
  Trash2,
  AlertCircle,
  Loader2,
  ChevronRight,
  Shield,
  User,
  PenTool
} from 'lucide-react';
import { Navbar } from '../../components/landing/Navbar';
import { PageFooter } from '../../components/shared/PageFooter';
import customDocumentService from '../../services/customDocumentService';
import type { 
  SignatureType, 
  PricingOptions,
  CreateCustomDocumentParams
} from '../../services/customDocumentService';

interface Signer {
  id: string;
  full_name: string;
  email: string;
  rut: string;
  role: string;
}

type Step = 'upload' | 'signers' | 'review';

const STEPS: { key: Step; label: string; icon: React.ReactNode }[] = [
  { key: 'upload', label: 'Documento', icon: <Upload className="w-5 h-5" /> },
  { key: 'signers', label: 'Firmantes', icon: <Users className="w-5 h-5" /> },
  { key: 'review', label: 'Confirmar', icon: <Check className="w-5 h-5" /> },
];

// Steps shown in progress bar (includes payment which happens after form submission)
const PROGRESS_STEPS: { key: string; label: string; icon: React.ReactNode }[] = [
  { key: 'upload', label: 'Documento', icon: <Upload className="w-5 h-5" /> },
  { key: 'signers', label: 'Firmantes', icon: <Users className="w-5 h-5" /> },
  { key: 'review', label: 'Confirmar', icon: <Check className="w-5 h-5" /> },
  { key: 'payment', label: 'Pago', icon: <CreditCard className="w-5 h-5" /> },
];

export function CustomDocumentUploadPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // State
  const [currentStep, setCurrentStep] = useState<Step>('upload');
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);
  const [signers, setSigners] = useState<Signer[]>([
    { id: '1', full_name: '', email: '', rut: '', role: 'Firmante 1' }
  ]);
  const [signatureType, setSignatureType] = useState<SignatureType>('simple');
  const [customNotary, setCustomNotary] = useState(false);
  const [buyerEmail, setBuyerEmail] = useState('');
  const [buyerRut, setBuyerRut] = useState('');
  
  // Pricing
  const [pricingOptions, setPricingOptions] = useState<PricingOptions | null>(null);
  const [totalPrice, setTotalPrice] = useState(0);
  const [loadingPrice, setLoadingPrice] = useState(false);
  
  // UI State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);

  // Load pricing options on mount
  useEffect(() => {
    loadPricingOptions();
  }, []);

  // Calculate price when options change
  useEffect(() => {
    if (pricingOptions) {
      calculateTotalPrice();
    }
  }, [signatureType, signers.length, customNotary, pricingOptions]);

  // Handle signature type changes
  useEffect(() => {
    if (signatureType === 'none') {
      // No signatures selected - clear signers
      setSigners([]);
    } else if (signers.length === 0) {
      // Ensure at least one signer exists for signature types that need it
      setSigners([{ id: '1', full_name: '', email: '', rut: '', role: 'Firmante 1' }]);
    }
  }, [signatureType]);

  const loadPricingOptions = async () => {
    try {
      const options = await customDocumentService.getPricingOptions();
      setPricingOptions(options);
    } catch (err) {
      console.error('Error loading pricing options:', err);
    }
  };

  const calculateTotalPrice = async () => {
    setLoadingPrice(true);
    try {
      const result = await customDocumentService.calculatePrice({
        signer_count: signers.length,
        signature_type: signatureType,
        custom_notary: customNotary
      });
      setTotalPrice(result.total);
    } catch (err) {
      console.error('Error calculating price:', err);
    } finally {
      setLoadingPrice(false);
    }
  };

  // File handling
  const handleFileSelect = useCallback((file: File) => {
    if (file.type !== 'application/pdf') {
      setError('Solo se permiten archivos PDF');
      return;
    }
    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      setError('El archivo no puede superar los 10MB');
      return;
    }
    
    setPdfFile(file);
    setPdfPreviewUrl(URL.createObjectURL(file));
    setError(null);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  }, [handleFileSelect]);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
  };

  // Signer management
  const addSigner = () => {
    const newId = String(Date.now());
    setSigners([
      ...signers,
      { id: newId, full_name: '', email: '', rut: '', role: `Firmante ${signers.length + 1}` }
    ]);
  };

  const removeSigner = (id: string) => {
    if (signers.length <= 1) return;
    setSigners(signers.filter(s => s.id !== id));
  };

  const updateSigner = (id: string, field: keyof Signer, value: string) => {
    setSigners(signers.map(s => 
      s.id === id ? { ...s, [field]: value } : s
    ));
  };

  // Validation for upload step (PDF + options selected)
  // Must have PDF and at least one service selected (signatures or notary)
  const hasServiceSelected = signatureType !== 'none' || customNotary;
  const canProceedFromUpload = !!pdfFile && hasServiceSelected;
  
  // Validation for contact info (used in modal)
  const hasValidContactInfo = buyerEmail.trim() !== '' && 
    buyerRut.trim() !== '' &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(buyerEmail);

  // Validation
  const validateStep = (step: Step): boolean => {
    switch (step) {
      case 'upload':
        return canProceedFromUpload && hasValidContactInfo;
      case 'signers':
        // If signature_type is 'none', signers are not required
        if (signatureType === 'none') {
          return true;
        }
        // Otherwise, at least one valid signer is required
        return signers.length > 0 && signers.every(s => 
          s.full_name.trim() && 
          s.email.trim() && 
          s.rut.trim() &&
          /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.email)
        );
      case 'review':
        return true;
      default:
        return false;
    }
  };

  const canProceed = validateStep(currentStep);

  // Navigation
  const goToNextStep = () => {
    // Show contact modal at the appropriate time:
    // - If no signatures needed (none): after 'upload' step
    // - If signatures needed: after 'signers' step
    const shouldShowModal = !hasValidContactInfo && (
      (currentStep === 'upload' && signatureType === 'none') ||
      (currentStep === 'signers' && signatureType !== 'none')
    );
    
    if (shouldShowModal) {
      setShowContactModal(true);
      return;
    }
    
    const currentIndex = STEPS.findIndex(s => s.key === currentStep);
    if (currentIndex < STEPS.length - 1) {
      let nextIndex = currentIndex + 1;
      
      // Skip 'signers' step if signature_type is 'none'
      if (STEPS[nextIndex].key === 'signers' && signatureType === 'none') {
        // Clear signers when skipping
        setSigners([]);
        nextIndex = nextIndex + 1;
      }
      
      if (nextIndex < STEPS.length) {
        setCurrentStep(STEPS[nextIndex].key);
      }
    }
  };
  
  // Handle contact modal confirmation
  const handleContactModalConfirm = () => {
    if (hasValidContactInfo) {
      setShowContactModal(false);
      goToNextStep();
    }
  };

  const goToPrevStep = () => {
    const currentIndex = STEPS.findIndex(s => s.key === currentStep);
    if (currentIndex > 0) {
      let prevIndex = currentIndex - 1;
      
      // Skip 'signers' step if signature_type is 'none'
      if (STEPS[prevIndex].key === 'signers' && signatureType === 'none') {
        prevIndex = prevIndex - 1;
      }
      
      if (prevIndex >= 0) {
        setCurrentStep(STEPS[prevIndex].key);
      }
    }
  };

  // Submit
  const handleSubmit = async () => {
    if (!pdfFile) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Build signers array only if signature_type requires it
      const signersToSend = signatureType !== 'none' 
        ? signers.map(s => ({
            full_name: s.full_name,
            email: s.email,
            rut: s.rut,
            role: s.role
          }))
        : [];

      const params: CreateCustomDocumentParams = {
        pdf: pdfFile,
        buyer_rut: buyerRut,
        buyer_email: buyerEmail,
        signature_type: signatureType,
        custom_notary: signatureType === 'none' ? true : customNotary, // Always true for 'none'
        signers: signersToSend
      };
      
      const result = await customDocumentService.createCustomDocument(params);
      
      // Redirect to unified payment page
      navigate(`/payment/${result.id}?tracking_code=${result.tracking_code}&rut=${buyerRut}`);
    } catch (err: any) {
      console.error('Error creating custom document:', err);
      // Handle both string and object error formats
      const errorData = err.response?.data?.error;
      if (typeof errorData === 'object' && errorData !== null) {
        setError(errorData.message || 'Error al crear el documento');
      } else {
        setError(errorData || 'Error al crear el documento');
      }
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number | undefined | null) => {
    const numPrice = typeof price === 'number' && !isNaN(price) ? price : 0;
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
    }).format(numPrice);
  };

  const formatRut = (value: string) => {
    // Remove non-alphanumeric characters
    let rut = value.replace(/[^0-9kK]/g, '');
    
    if (rut.length > 1) {
      // Add dots and dash
      const dv = rut.slice(-1);
      const body = rut.slice(0, -1);
      rut = body.replace(/\B(?=(\d{3})+(?!\d))/g, '.') + '-' + dv;
    }
    
    return rut.toUpperCase();
  };

  // Render steps
  const renderUploadStep = () => (
    <div className="flex flex-col lg:flex-row gap-6 h-full min-h-[600px]">
      {/* Left column - PDF Preview (half screen) */}
      <div className="flex-1 bg-white rounded-lg shadow-document border border-slate-200 overflow-hidden flex flex-col min-h-[400px] lg:min-h-0">
        {/* Header */}
        <div className="border-b border-slate-200 p-4 flex items-center justify-between bg-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-navy-900 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-serif font-semibold text-navy-900">
                {pdfFile ? pdfFile.name : 'Tu documento'}
              </h2>
              <p className="text-sm text-slate-500 font-sans">
                {pdfFile 
                  ? `${(pdfFile.size / 1024 / 1024).toFixed(2)} MB` 
                  : 'Sube un archivo PDF para continuar'
                }
              </p>
            </div>
          </div>
          {pdfFile && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setPdfFile(null);
                setPdfPreviewUrl(null);
              }}
              className="text-sm text-red-600 hover:text-red-700 font-medium px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
            >
              Cambiar
            </button>
          )}
        </div>

        {/* PDF Content */}
        <div className="flex-1 overflow-hidden relative bg-slate-50">
          {!pdfFile ? (
            <div
              className={`
                absolute inset-0 flex flex-col items-center justify-center cursor-pointer transition-all
                ${dragOver ? 'bg-legal-emerald-50' : 'hover:bg-slate-100'}
              `}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                className="hidden"
                onChange={handleFileInputChange}
              />
              <div className={`
                w-20 h-20 rounded-full flex items-center justify-center mb-4 transition-colors
                ${dragOver ? 'bg-legal-emerald-100' : 'bg-slate-200'}
              `}>
                <Upload className={`w-10 h-10 ${dragOver ? 'text-legal-emerald-600' : 'text-slate-400'}`} />
              </div>
              <p className="text-lg font-medium text-navy-900 mb-1">
                {dragOver ? 'Suelta el archivo aquí' : 'Arrastra tu PDF aquí'}
              </p>
              <p className="text-sm text-slate-500 mb-4">
                o haz clic para seleccionar un archivo
              </p>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <FileText className="w-4 h-4" />
                <span>Solo archivos PDF • Máximo 10MB</span>
              </div>
            </div>
          ) : pdfPreviewUrl ? (
            <iframe
              src={pdfPreviewUrl}
              className="w-full h-full border-0"
              title="Vista previa del PDF"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
            </div>
          )}
        </div>
      </div>

      {/* Right column - Options (scrollable) */}
      <div className="w-full lg:w-96 flex flex-col gap-4 lg:order-last overflow-y-auto max-h-[calc(100vh-280px)] lg:max-h-none custom-scrollbar">
        
        {/* Base service info */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-navy-900">Servicio base</h3>
            <span className="text-lg font-bold text-navy-900">{formatPrice(pricingOptions?.base_price || 10000)}</span>
          </div>
          <p className="text-xs text-slate-500">Incluye gestión documental, procesamiento y almacenamiento seguro.</p>
        </div>

        {/* Signature options */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-5">
          <h3 className="font-semibold text-navy-900 mb-4">¿Necesitas firmas electrónicas?</h3>
          <p className="text-xs p-1 text-slate-500">Podras elegir quienes deben firmar el documento electrónicamente.</p>
          
          <div className="space-y-3">
            {/* Firma Simple option */}
            <div
              onClick={() => setSignatureType(signatureType === 'simple' ? 'none' : 'simple')}
              className={`
                p-4 rounded-lg border-2 cursor-pointer transition-all
                ${signatureType === 'simple' 
                  ? 'border-legal-emerald-500 bg-legal-emerald-50' 
                  : 'border-slate-200 hover:border-slate-300'
                }
              `}
            >
              <div className="flex items-center gap-3">
                <div className={`
                  w-5 h-5 rounded border-2 flex items-center justify-center shrink-0
                  ${signatureType === 'simple' 
                    ? 'border-legal-emerald-500 bg-legal-emerald-500' 
                    : 'border-slate-300'
                  }
                `}>
                  {signatureType === 'simple' && <Check className="w-3 h-3 text-white" />}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium text-navy-900 text-sm">Agregar Firma Simple</h4>
                    <div className="group relative">
                      <AlertCircle className="w-4 h-4 text-slate-400 cursor-help" />
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-navy-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity w-48 pointer-events-none z-10">
                        Firma electrónica con validez legal para documentos civiles y comerciales.
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">Validez legal para contratos</p>
                </div>
                <span className="text-sm font-bold text-legal-emerald-600 shrink-0">
                  +{formatPrice(pricingOptions?.simple?.price_per_signer || 0)}/firma
                </span>
              </div>
            </div>

            {/* FEA option */}
            <div
              onClick={() => setSignatureType(signatureType === 'fea' ? 'none' : 'fea')}
              className={`
                p-4 rounded-lg border-2 cursor-pointer transition-all
                ${signatureType === 'fea' 
                  ? 'border-legal-emerald-500 bg-legal-emerald-50' 
                  : 'border-slate-200 hover:border-slate-300'
                }
              `}
            >
              <div className="flex items-center gap-3">
                <div className={`
                  w-5 h-5 rounded border-2 flex items-center justify-center shrink-0
                  ${signatureType === 'fea' 
                    ? 'border-legal-emerald-500 bg-legal-emerald-500' 
                    : 'border-slate-300'
                  }
                `}>
                  {signatureType === 'fea' && <Check className="w-3 h-3 text-white" />}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium text-navy-900 text-sm">Agregar FEA</h4>
                    <div className="group relative">
                      <AlertCircle className="w-4 h-4 text-slate-400 cursor-help" />
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-navy-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity w-48 pointer-events-none z-10">
                        Firma Electrónica Avanzada con verificación de identidad mediante clave única.
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">Firma Electrónica Avanzada</p>
                </div>
                <span className="text-sm font-bold text-legal-emerald-600 shrink-0">
                  +{formatPrice(pricingOptions?.fea?.price_per_signer || 0)}/firma
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Notary option - always visible */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-5">
          <h3 className="font-semibold text-navy-900 mb-4">¿Necesitas revisión de un notario?</h3>
          <div
            onClick={() => setCustomNotary(!customNotary)}
            className={`
              p-4 rounded-lg border-2 cursor-pointer transition-all
              ${customNotary 
                ? 'border-legal-emerald-500 bg-legal-emerald-50' 
                : 'border-slate-200 hover:border-slate-300'
              }
            `}
          >
            <div className="flex items-center gap-3">
              <div className={`
                w-5 h-5 rounded border-2 flex items-center justify-center shrink-0
                ${customNotary 
                  ? 'border-legal-emerald-500 bg-legal-emerald-500' 
                  : 'border-slate-300'
                }
              `}>
                {customNotary && <Check className="w-3 h-3 text-white" />}
              </div>
              
              <div className="flex-1">
                <h4 className="font-medium text-navy-900 text-sm">Agregar visación notarial</h4>
                <p className="text-xs text-slate-500">Un notario revisará y visará tu documento</p>
              </div>
              <Shield className="w-5 h-5 text-slate-400 shrink-0" />
            </div>
          </div>
        </div>

        {/* Price summary */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Servicio base</span>
              <span className="font-medium text-navy-900">{formatPrice(pricingOptions?.base_price || 0)}</span>
            </div>
            
            {signatureType !== 'none' && (
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">
                  {signatureType === 'fea' ? 'FEA' : 'Firma Simple'} ({signers.length} firma{signers.length > 1 ? 's' : ''})
                </span>
                <span className="font-medium text-legal-emerald-600">
                  +{formatPrice(signers.length * (pricingOptions?.[signatureType]?.price_per_signer || 0))}
                </span>
              </div>
            )}
            
            {customNotary && (
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Visación notarial</span>
                <span className="font-medium text-slate-500">Incluido</span>
              </div>
            )}
            
            {/* Warning when nothing selected */}
            {!hasServiceSelected && (
              <div className="pt-2 border-t border-slate-100">
                <p className="text-xs text-amber-600 text-center">
                  Selecciona al menos un servicio para continuar
                </p>
              </div>
            )}
          </div>
          
          <div className="bg-navy-900 px-4 py-3">
            <div className="flex items-center justify-between">
              <span className="text-white text-sm font-medium">Total</span>
              <span className="text-xl font-bold text-white">
                {loadingPrice ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  formatPrice(totalPrice)
                )}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderSignersStep = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-serif font-bold text-navy-900 mb-2">
          ¿Quiénes firmarán este documento?
        </h2>
        <p className="text-slate-600 font-sans">
          Agrega los datos de todas las personas que deben firmar.
        </p>
      </div>

      <div className="space-y-4">
        {signers.map((signer, index) => (
          <div 
            key={signer.id}
            className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-navy-900">
                Firmante {index + 1}
              </h3>
              {signers.length > 1 && (
                <button
                  onClick={() => removeSigner(signer.id)}
                  className="text-red-500 hover:text-red-600 p-1"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Nombre completo *
                </label>
                <input
                  type="text"
                  value={signer.full_name}
                  onChange={(e) => updateSigner(signer.id, 'full_name', e.target.value)}
                  placeholder="Juan Pérez González"
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-legal-emerald-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  RUT *
                </label>
                <input
                  type="text"
                  value={signer.rut}
                  onChange={(e) => updateSigner(signer.id, 'rut', formatRut(e.target.value))}
                  placeholder="12.345.678-9"
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-legal-emerald-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  value={signer.email}
                  onChange={(e) => updateSigner(signer.id, 'email', e.target.value)}
                  placeholder="juan@email.com"
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-legal-emerald-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Rol (opcional)
                </label>
                <input
                  type="text"
                  value={signer.role}
                  onChange={(e) => updateSigner(signer.id, 'role', e.target.value)}
                  placeholder="Ej: Arrendador, Comprador..."
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-legal-emerald-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={addSigner}
        className="w-full py-3 border-2 border-dashed border-slate-300 rounded-lg text-slate-600 hover:border-legal-emerald-500 hover:text-legal-emerald-600 transition-colors flex items-center justify-center gap-2"
      >
        <Plus className="w-5 h-5" />
        Agregar otro firmante
      </button>
    </div>
  );

  const renderReviewStep = () => {
    const getSignatureTypeLabel = () => {
      switch (signatureType) {
        case 'fea': return 'Firma Electrónica Avanzada (FEA)';
        case 'simple': return 'Firma Electrónica Simple (FES)';
        case 'none': return 'Documento ya firmado (solo notario)';
        default: return signatureType;
      }
    };

    return (
      <div className="space-y-6">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-serif font-bold text-navy-900 mb-2">
            Confirma tu solicitud
          </h2>
          <p className="text-slate-600 font-sans">
            {totalPrice > 0 
              ? 'Revisa los datos antes de continuar al pago.'
              : 'Revisa los datos antes de continuar.'
            }
          </p>
        </div>

        {/* Document info */}
        <div className="bg-white border border-slate-200 rounded-lg p-6">
          <h3 className="font-medium text-navy-900 mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-legal-emerald-600" />
            Documento
          </h3>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center">
              <FileText className="w-6 h-6 text-slate-500" />
            </div>
            <div>
              <p className="font-medium text-navy-900">{pdfFile?.name}</p>
              <p className="text-sm text-slate-500">
                {pdfFile && (pdfFile.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
          </div>
        </div>

        {/* Signers summary - only show if there are signers */}
        {signers.length > 0 && (
          <div className="bg-white border border-slate-200 rounded-lg p-6">
            <h3 className="font-medium text-navy-900 mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-legal-emerald-600" />
              Firmantes ({signers.length})
            </h3>
            <div className="space-y-3">
              {signers.map((signer, index) => (
                <div key={signer.id} className="flex items-center gap-4 py-2 border-b border-slate-100 last:border-0">
                  <div className="w-8 h-8 bg-legal-emerald-100 rounded-full flex items-center justify-center text-sm font-medium text-legal-emerald-700">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-navy-900">{signer.full_name}</p>
                    <p className="text-sm text-slate-500">{signer.email} • {signer.rut}</p>
                  </div>
                  <span className="text-xs text-slate-500">{signer.role}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Options summary */}
        <div className="bg-white border border-slate-200 rounded-lg p-6">
          <h3 className="font-medium text-navy-900 mb-4 flex items-center gap-2">
            <PenTool className="w-5 h-5 text-legal-emerald-600" />
            Opciones
          </h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-600">Tipo</span>
              <span className="font-medium text-navy-900">
                {getSignatureTypeLabel()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Visación notarial</span>
              <span className="font-medium text-navy-900">
                {signatureType === 'none' ? 'Sí (requerido)' : (customNotary ? 'Sí' : 'No')}
              </span>
            </div>
          </div>
        </div>

        {/* Contact info */}
        <div className="bg-white border border-slate-200 rounded-lg p-6">
          <h3 className="font-medium text-navy-900 mb-4 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-legal-emerald-600" />
            Datos de contacto
          </h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-600">Email</span>
              <span className="font-medium text-navy-900">{buyerEmail}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">RUT</span>
              <span className="font-medium text-navy-900">{buyerRut}</span>
            </div>
          </div>
        </div>

        {/* Total */}
        <div className="bg-navy-900 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <span className="text-slate-300">Total a pagar</span>
            <span className="text-3xl font-bold">{formatPrice(totalPrice)}</span>
          </div>
          <div className="text-sm text-slate-400 space-y-1 border-t border-slate-700 pt-3">
            <div className="flex justify-between">
              <span>Precio base del servicio</span>
              <span>{formatPrice(pricingOptions?.base_price || 0)}</span>
            </div>
            {signers.length > 0 && signatureType !== 'none' && (
              <div className="flex justify-between">
                <span>Firmas ({signers.length} × {formatPrice(pricingOptions?.[signatureType]?.price_per_signer || 0)})</span>
                <span>{formatPrice(signers.length * (pricingOptions?.[signatureType]?.price_per_signer || 0))}</span>
              </div>
            )}
            {signatureType === 'none' && (
              <div className="flex justify-between">
                <span>Visación notarial</span>
                <span className="text-slate-500">Incluida en precio base</span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'upload':
        return renderUploadStep();
      case 'signers':
        return renderSignersStep();
      case 'review':
        return renderReviewStep();
      default:
        return null;
    }
  };

  // Get filtered steps based on signature type (for progress bar display)
  const filteredSteps = PROGRESS_STEPS.filter(step => !(step.key === 'signers' && signatureType === 'none'));
  const currentStepIndex = filteredSteps.findIndex(s => s.key === currentStep);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />
      
      {/* Progress header with actions */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="w-full px-4 md:px-6 lg:px-8 py-3 md:py-4">
          <div className="flex items-center justify-between gap-2 md:gap-4 max-w-[1800px] mx-auto">
            {/* Left: Back button */}
            <button
              onClick={currentStep === 'upload' ? () => navigate('/') : goToPrevStep}
              className="flex items-center gap-1 text-slate-600 hover:text-navy-900 transition-colors text-sm font-medium shrink-0"
            >
              <ChevronRight className="w-4 h-4 rotate-180" />
              <span className="hidden sm:inline">{currentStep === 'upload' ? 'Volver' : 'Anterior'}</span>
            </button>

            {/* Center: Progress Steps */}
            <div className="flex-1 flex items-center justify-center min-w-0">
              <div className="flex items-center gap-1 md:gap-2">
                {filteredSteps.map((step, index) => {
                  const isActive = step.key === currentStep;
                  const isPast = currentStepIndex > index;
                  
                  return (
                    <div key={step.key} className="flex items-center">
                      <div className={`
                        flex items-center gap-1 md:gap-1.5 px-2 md:px-4 py-1.5 md:py-2 rounded-full transition-all whitespace-nowrap
                        ${isActive ? 'bg-navy-900 text-white' : ''}
                        ${isPast ? 'text-legal-emerald-600' : ''}
                        ${!isActive && !isPast ? 'text-slate-400' : ''}
                      `}>
                        {isPast ? (
                          <Check className="w-4 h-4" />
                        ) : (
                          <span className="[&>svg]:w-4 [&>svg]:h-4">{step.icon}</span>
                        )}
                        <span className="hidden sm:inline text-xs md:text-sm font-medium">{step.label}</span>
                      </div>
                      {index < filteredSteps.length - 1 && (
                        <ChevronRight className="w-3 h-3 md:w-4 md:h-4 text-slate-300 mx-0.5 md:mx-1 shrink-0" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right: Price + Action button */}
            <div className="flex items-center gap-2 md:gap-3 shrink-0">
              {/* Price display */}
              <div className="text-right hidden sm:block">
                <div className="text-xs text-slate-500">Total</div>
                <div className="text-sm md:text-lg font-bold text-navy-900">{formatPrice(totalPrice)}</div>
              </div>

              {/* Action button */}
              {currentStep === 'review' ? (
                <button
                  onClick={handleSubmit}
                  disabled={loading || !canProceed}
                  className="px-4 md:px-6 py-2 md:py-2.5 bg-legal-emerald-600 hover:bg-legal-emerald-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="hidden sm:inline">Procesando...</span>
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4" />
                      <span className="hidden sm:inline">Continuar al pago</span>
                      <span className="sm:hidden">Pagar</span>
                    </>
                  )}
                </button>
              ) : (
                <button
                  onClick={goToNextStep}
                  disabled={currentStep === 'upload' ? !canProceedFromUpload : !canProceed}
                  className="px-4 md:px-6 py-2 md:py-2.5 bg-navy-900 hover:bg-navy-800 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                >
                  <span>Siguiente</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Contact Data Modal */}
      {showContactModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 animate-fade-in-up border border-slate-200">
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
              >
                <X className="w-5 h-5" />
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
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-legal-emerald-500 focus:border-legal-emerald-500 transition-all font-mono text-navy-900"
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
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-legal-emerald-500 focus:border-legal-emerald-500 transition-all font-sans text-navy-900"
                />
              </div>

              <button
                onClick={handleContactModalConfirm}
                disabled={!hasValidContactInfo}
                className="w-full px-4 py-3.5 bg-navy-900 text-white font-semibold rounded-lg hover:bg-navy-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-sans shadow-lg"
              >
                <span>Continuar</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className={`flex-1 ${currentStep === 'upload' ? 'py-4 md:py-6' : 'py-6 md:py-8'}`}>
        <div className={`mx-auto px-4 md:px-6 h-full ${currentStep === 'upload' ? 'max-w-[1400px]' : 'max-w-2xl'}`}>
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 text-red-700">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{error}</span>
              <button onClick={() => setError(null)} className="ml-auto">
                <X className="w-5 h-5" />
              </button>
            </div>
          )}

          {renderCurrentStep()}
        </div>
      </div>

      <PageFooter />
    </div>
  );
}

export default CustomDocumentUploadPage;
