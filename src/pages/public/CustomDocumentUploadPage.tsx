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
  Eye,
  ChevronRight,
  Shield,
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

type Step = 'upload' | 'options' | 'signers' | 'review';

const STEPS: { key: Step; label: string; icon: React.ReactNode }[] = [
  { key: 'upload', label: 'Subir PDF', icon: <Upload className="w-5 h-5" /> },
  { key: 'options', label: 'Opciones', icon: <PenTool className="w-5 h-5" /> },
  { key: 'signers', label: 'Firmantes', icon: <Users className="w-5 h-5" /> },
  { key: 'review', label: 'Confirmar', icon: <Check className="w-5 h-5" /> },
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
      // For already-signed documents, notary is required and no signers needed
      setCustomNotary(true);
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

  // Validation
  const validateStep = (step: Step): boolean => {
    switch (step) {
      case 'upload':
        return !!pdfFile;
      case 'options':
        return !!signatureType && 
          buyerEmail.trim() !== '' && 
          buyerRut.trim() !== '' &&
          /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(buyerEmail);
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
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-serif font-bold text-navy-900 mb-2">
          Sube tu documento PDF
        </h2>
        <p className="text-slate-600 font-sans">
          Sube el documento que necesitas firmar. Solo aceptamos archivos PDF.
        </p>
      </div>

      {/* Drop zone */}
      <div
        className={`
          border-2 border-dashed rounded-xl p-12 text-center transition-all cursor-pointer
          ${dragOver 
            ? 'border-legal-emerald-500 bg-legal-emerald-50' 
            : 'border-slate-300 hover:border-slate-400 bg-slate-50'
          }
          ${pdfFile ? 'border-legal-emerald-500 bg-legal-emerald-50' : ''}
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
        
        {pdfFile ? (
          <div className="space-y-4">
            <div className="w-16 h-16 bg-legal-emerald-100 rounded-full flex items-center justify-center mx-auto">
              <FileText className="w-8 h-8 text-legal-emerald-600" />
            </div>
            <div>
              <p className="text-lg font-medium text-navy-900">{pdfFile.name}</p>
              <p className="text-sm text-slate-500">
                {(pdfFile.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setPdfFile(null);
                setPdfPreviewUrl(null);
              }}
              className="text-sm text-red-600 hover:text-red-700 font-medium"
            >
              Cambiar archivo
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="w-16 h-16 bg-slate-200 rounded-full flex items-center justify-center mx-auto">
              <Upload className="w-8 h-8 text-slate-500" />
            </div>
            <div>
              <p className="text-lg font-medium text-navy-900">
                Arrastra tu PDF aquí
              </p>
              <p className="text-sm text-slate-500">
                o haz clic para seleccionar un archivo
              </p>
            </div>
            <p className="text-xs text-slate-400">Máximo 10MB</p>
          </div>
        )}
      </div>

      {/* Preview */}
      {pdfPreviewUrl && (
        <div className="border border-slate-200 rounded-lg overflow-hidden">
          <div className="bg-slate-100 px-4 py-2 flex items-center justify-between">
            <span className="text-sm font-medium text-slate-700 flex items-center gap-2">
              <Eye className="w-4 h-4" />
              Vista previa
            </span>
          </div>
          <iframe
            src={pdfPreviewUrl}
            className="w-full h-[400px]"
            title="Vista previa del PDF"
          />
        </div>
      )}
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

  const renderOptionsStep = () => (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-serif font-bold text-navy-900 mb-2">
          ¿Qué necesitas hacer con tu documento?
        </h2>
        <p className="text-slate-600 font-sans">
          Elige el tipo de firma electrónica que necesitas.
        </p>
      </div>

      {/* Base price info */}
      {pricingOptions && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
          <strong>Precio base del servicio:</strong> {formatPrice(pricingOptions.base_price)}
          <span className="text-blue-600 ml-1">(incluido en el total)</span>
        </div>
      )}

      {/* Signature type selection */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {pricingOptions && (['none', 'simple', 'fea'] as const).map((key) => {
          const option = pricingOptions[key];
          return (
            <div
              key={key}
              onClick={() => setSignatureType(key)}
              className={`
                p-6 rounded-xl border-2 cursor-pointer transition-all
                ${signatureType === key 
                  ? 'border-legal-emerald-500 bg-legal-emerald-50' 
                  : 'border-slate-200 hover:border-slate-300'
                }
              `}
            >
              <div className="flex items-start justify-between mb-3">
                <div className={`
                  w-6 h-6 rounded-full border-2 flex items-center justify-center
                  ${signatureType === key 
                    ? 'border-legal-emerald-500 bg-legal-emerald-500' 
                    : 'border-slate-300'
                  }
                `}>
                  {signatureType === key && <Check className="w-4 h-4 text-white" />}
                </div>
                <span className="text-lg font-bold text-navy-900">
                  {key === 'none' ? 'Solo notario' : `+${formatPrice(option.price_per_signer)}/firmante`}
                </span>
              </div>
              <h3 className="font-medium text-navy-900 mb-1">{option.label}</h3>
              <p className="text-sm text-slate-600">{option.description}</p>
            </div>
          );
        })}
      </div>

      {/* Notary option - only show for signature types that don't require it */}
      {signatureType !== 'none' && (
        <div
          onClick={() => setCustomNotary(!customNotary)}
          className={`
            p-6 rounded-xl border-2 cursor-pointer transition-all
            ${customNotary 
              ? 'border-legal-emerald-500 bg-legal-emerald-50' 
              : 'border-slate-200 hover:border-slate-300'
            }
          `}
        >
          <div className="flex items-center gap-4">
            <div className={`
              w-6 h-6 rounded border-2 flex items-center justify-center
              ${customNotary 
                ? 'border-legal-emerald-500 bg-legal-emerald-500' 
                : 'border-slate-300'
              }
            `}>
              {customNotary && <Check className="w-4 h-4 text-white" />}
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-navy-900">Agregar visación notarial</h3>
              <p className="text-sm text-slate-600">
                El documento pasará por revisión de un notario antes de completarse.
              </p>
            </div>
            <Shield className="w-8 h-8 text-slate-400" />
          </div>
        </div>
      )}

      {/* Info banner when 'none' is selected */}
      {signatureType === 'none' && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
          <Shield className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-amber-800 font-medium">Visación notarial incluida</p>
            <p className="text-sm text-amber-700">
              Tu documento ya firmado será enviado a un notario para su visación oficial.
            </p>
          </div>
        </div>
      )}

      {/* Buyer information */}
      <div className="bg-slate-50 rounded-xl p-6">
        <h3 className="font-medium text-navy-900 mb-4">Tus datos de contacto</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Tu email *
            </label>
            <input
              type="email"
              value={buyerEmail}
              onChange={(e) => setBuyerEmail(e.target.value)}
              placeholder="tu@email.com"
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-legal-emerald-500 focus:border-transparent bg-white"
            />
            <p className="text-xs text-slate-500 mt-1">
              Te enviaremos el código de seguimiento aquí
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Tu RUT *
            </label>
            <input
              type="text"
              value={buyerRut}
              onChange={(e) => setBuyerRut(formatRut(e.target.value))}
              placeholder="12.345.678-9"
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-legal-emerald-500 focus:border-transparent bg-white"
            />
          </div>
        </div>
      </div>

      {/* Price summary */}
      <div className="bg-navy-900 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-slate-300 text-sm">Total a pagar</p>
            <p className="text-3xl font-bold">
              {loadingPrice ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                formatPrice(totalPrice)
              )}
            </p>
          </div>
          <div className="text-right text-sm text-slate-300">
            <p>{signers.length} firmante{signers.length > 1 ? 's' : ''}</p>
            <p>{signatureType === 'fea' ? 'Firma Avanzada' : 'Firma Simple'}</p>
          </div>
        </div>
      </div>
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
      case 'options':
        return renderOptionsStep();
      case 'review':
        return renderReviewStep();
      default:
        return null;
    }
  };

  // Get filtered steps based on signature type
  const filteredSteps = STEPS.filter(step => !(step.key === 'signers' && signatureType === 'none'));
  const currentStepIndex = filteredSteps.findIndex(s => s.key === currentStep);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />
      
      {/* Progress header with actions */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-3 md:py-4">
          <div className="flex items-center justify-between gap-4">
            {/* Left: Back button */}
            <button
              onClick={currentStep === 'upload' ? () => navigate('/catalogo') : goToPrevStep}
              className="flex items-center gap-1 text-slate-600 hover:text-navy-900 transition-colors text-sm font-medium shrink-0"
            >
              <ChevronRight className="w-4 h-4 rotate-180" />
              <span className="hidden sm:inline">{currentStep === 'upload' ? 'Volver' : 'Anterior'}</span>
            </button>

            {/* Center: Progress Steps */}
            <div className="flex-1 flex items-center justify-center overflow-x-auto scrollbar-none">
              <div className="flex items-center">
                {filteredSteps.map((step, index) => {
                  const isActive = step.key === currentStep;
                  const isPast = currentStepIndex > index;
                  
                  return (
                    <div key={step.key} className="flex items-center">
                      <div className={`
                        flex items-center gap-1.5 px-2.5 md:px-4 py-1.5 md:py-2 rounded-full transition-all
                        ${isActive ? 'bg-navy-900 text-white' : ''}
                        ${isPast ? 'text-legal-emerald-600' : ''}
                        ${!isActive && !isPast ? 'text-slate-400' : ''}
                      `}>
                        {isPast ? (
                          <Check className="w-4 h-4 md:w-5 md:h-5" />
                        ) : (
                          <span className="[&>svg]:w-4 [&>svg]:h-4 md:[&>svg]:w-5 md:[&>svg]:h-5">{step.icon}</span>
                        )}
                        <span className="hidden md:inline text-sm font-medium">{step.label}</span>
                      </div>
                      {index < filteredSteps.length - 1 && (
                        <ChevronRight className="w-4 h-4 md:w-5 md:h-5 text-slate-300 mx-1 md:mx-2" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right: Price + Action button */}
            <div className="flex items-center gap-3 shrink-0">
              {/* Price display */}
              <div className="text-right hidden sm:block">
                <div className="text-xs text-slate-500">Total</div>
                <div className="text-base md:text-lg font-bold text-navy-900">{formatPrice(totalPrice)}</div>
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
                  disabled={!canProceed}
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

      {/* Main content */}
      <div className="flex-1 py-6 md:py-8">
        <div className="max-w-2xl mx-auto px-4 md:px-6">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 text-red-700">
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
