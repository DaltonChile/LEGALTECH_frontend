import { useState, useMemo } from 'react';
import axios from 'axios';
import { Lock, Shield, Check, Plus, ArrowRight, AlertCircle, Edit3, User, ChevronDown, ChevronUp } from 'lucide-react';
import { DocumentPreview } from './DocumentPreview';
import { FieldsForm } from './FieldsForm';
import { EditorHeader } from './EditorHeader';
import { useContractRenderer } from './hooks/useContractRenderer';
import { extractVariables, formatVariableName } from './utils/templateParser';
import { contractEditorStyles } from './styles';
import type { InitialFormResponse } from '../../../types/contract';
import type { Capsule } from './types';

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
  base_price: number;
  template_content: string;
  capsules: Capsule[];
  clause_numbering?: Array<{
    order: number;
    title: string;
    is_in_capsule: boolean;
    capsule_slug: string | null;
  }>;
  signers_config?: Array<{
    role: string;
    name_variable: string;
    rut_variable: string;
    email_variable: string;
    phone_variable: string;
  }>;
  variables_metadata?: Array<{ name: string; description: string | null; type: string }>;
}

interface FormularioInicialStepProps {
  template: Template;
  steps: { id: string; label: string }[];
  signatureInfo?: SignatureInfo;
  onContinue: (data: {
    contractId: string;
    trackingCode: string;
    totalAmount: number;
    formData: Record<string, string>;
    selectedCapsules: number[];
    signatureType: 'none' | 'simple' | 'fea';
    buyerRut: string;
    buyerEmail: string;
    requiresNotary: boolean;
  }) => void;
  onBack: () => void;
}

const VISIBLE_PERCENTAGE = 60; // Mostrar solo el 60% del documento

export function FormularioInicialStep({
  template,
  steps,
  signatureInfo,
  onContinue,
  onBack,
}: FormularioInicialStepProps) {
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [selectedCapsules, setSelectedCapsules] = useState<number[]>([]);
  const [signatureType, setSignatureType] = useState<'none' | 'simple' | 'fea'>('simple');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeField, setActiveField] = useState<string | null>(null);
  const [contactEmail, setContactEmail] = useState(''); // Email para recibir el código
  const [contactRut, setContactRut] = useState(''); // RUT del comprador
  const [showContactModal, setShowContactModal] = useState(false); // Mostrar modal al inicio
  const [expandedCapsules, setExpandedCapsules] = useState<number[]>([]);

  const requiresSignature = signatureInfo?.requiresSignatures ?? true;

  // Extraer variables del template
  const allVariables = useMemo(
    () => extractVariables(template.template_content, template.capsules, selectedCapsules),
    [template.template_content, template.capsules, selectedCapsules]
  );

  // Filtrar variables por búsqueda
  const filteredVariables = useMemo(() => {
    const validVariables = allVariables.filter(v => v);
    if (!searchTerm) return validVariables;
    const term = searchTerm.toLowerCase();
    return validVariables.filter((v) => 
      v.toLowerCase().includes(term) || 
      formatVariableName(v).toLowerCase().includes(term)
    );
  }, [allVariables, searchTerm]);

  // Calcular porcentaje de completado
  const completionPercentage = useMemo(() => {
    const validVariables = allVariables.filter(v => v);
    const filled = validVariables.filter(v => formData[v] && formData[v].trim() !== '').length;
    return validVariables.length > 0 ? Math.round((filled / validVariables.length) * 100) : 0;
  }, [formData, allVariables]);

  // Usar el mismo hook de renderizado que CompletarFormularioStep
  const { renderedContract } = useContractRenderer({
    templateText: template.template_content,
    formData,
    extractedVariables: allVariables,
    capsules: template.capsules,
    selectedCapsules,
    clauseNumbering: template.clause_numbering || [],
    signersConfig: (template.signers_config || []) as any,
    activeField,
  });

  // Calcular precio total
  const totalPrice = useMemo(() => {
    let price = template.base_price || 0;
    template.capsules
      .filter(c => selectedCapsules.includes(c.id))
      .forEach(c => { price += c.price; });
    if (signatureInfo && signatureType !== 'none') {
      price += signatureType === 'fea' 
        ? signatureInfo.pricing.fea.totalPrice 
        : signatureInfo.pricing.fes.totalPrice;
    }
    return price;
  }, [template.base_price, template.capsules, selectedCapsules, signatureInfo, signatureType]);

  const toggleCapsule = (capsuleId: number) => {
    setSelectedCapsules(prev => 
      prev.includes(capsuleId) 
        ? prev.filter(id => id !== capsuleId)
        : [...prev, capsuleId]
    );
  };

  const handleFormChange = (newFormData: Record<string, string>) => {
    setFormData(newFormData);
  };

  // Función para formatear RUT mientras se escribe
  const formatRut = (value: string) => {
    // Eliminar todo excepto números y K
    let rut = value.replace(/[^0-9kK]/g, '').toUpperCase();
    if (rut.length > 1) {
      // Separar cuerpo del dígito verificador
      const dv = rut.slice(-1);
      let body = rut.slice(0, -1);
      // Agregar puntos cada 3 dígitos desde la derecha
      body = body.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
      rut = body + '-' + dv;
    }
    return rut;
  };

  // Validar formato de RUT chileno
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

  const handleGoToPayment = async () => {
    setError(null);
    setIsSubmitting(true);

    try {
      // Validar RUT del comprador
      if (!contactRut || !isValidRut(contactRut)) {
        setError('Por favor ingresa un RUT válido.');
        setIsSubmitting(false);
        return;
      }

      // Validar email de contacto
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!contactEmail || !emailRegex.test(contactEmail)) {
        setError('Por favor ingresa un correo electrónico válido para recibir tu código de seguimiento.');
        setIsSubmitting(false);
        return;
      }

      const response = await axios.post<{ success: boolean; data: InitialFormResponse; error?: string }>(
        `${import.meta.env.VITE_API_URL}/contracts/initial`,
        {
          template_version_id: template.version_id,
          buyer_rut: contactRut.replace(/[.-]/g, ''), // Enviar sin formato
          buyer_email: contactEmail,
          capsule_ids: selectedCapsules,
          form_data: formData,
          signature_type: requiresSignature ? signatureType : 'none'
        }
      );

      if (response.data.success) {
        onContinue({
          contractId: response.data.data.id,
          trackingCode: response.data.data.tracking_code,
          totalAmount: response.data.data.total_amount,
          formData,
          selectedCapsules,
          signatureType: requiresSignature ? signatureType : 'none',
          buyerRut: contactRut.replace(/[.-]/g, ''),
          buyerEmail: contactEmail,
          requiresNotary: signatureInfo?.requiresNotary ?? false
        });
      } else {
        setError(response.data.error || 'Error al crear el contrato');
      }
    } catch (err: any) {
      console.error('Error creating initial contract:', err);
      setError(err.response?.data?.error || 'Error al procesar la solicitud');
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

  // Contenido del overlay para la sección bloqueada
  const lockedOverlayContent = (
    <div className="text-center">
      <Lock className="w-10 h-10 text-slate-400 mx-auto mb-2" />
      <p className="text-slate-500 text-sm">Realiza el pago para ver el documento completo</p>
    </div>
  );

  return (
    <div className="h-full bg-slate-100 flex flex-col">
      {/* Header */}
      <EditorHeader 
         steps={steps}
         currentStep="formulario-inicial"
         onBack={onBack}
         totalPrice={totalPrice}
         rightAction={
            <button
              onClick={() => setShowContactModal(true)}
              disabled={isSubmitting}
              className="bg-slate-900 text-white px-4 md:px-6 py-2 md:py-3 rounded-xl font-bold hover:bg-slate-800 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:scale-100 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg shadow-slate-900/10 text-sm md:text-base"
            >
              <span>Continuar al pago</span>
              <ArrowRight className="w-4 h-4" />
            </button>
         }
      />

      {/* Main Content */}
      <div className="relative z-10 flex-1 w-full max-w-[1920px] mx-auto p-3 md:p-6 flex flex-col lg:flex-row gap-4 md:gap-6 overflow-hidden min-h-0">
        
        {/* Left: Document Preview */}
        <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col relative z-0 min-h-[400px] lg:min-h-0">
          <DocumentPreview
            templateText={template.template_content}
            renderedContract={renderedContract}
            completionPercentage={completionPercentage}
            activeField={activeField}
            visiblePercentage={VISIBLE_PERCENTAGE}
            lockedOverlayContent={lockedOverlayContent}
            variablesMetadata={template.variables_metadata || []}
          />
        </div>

        {/* Right: Sidebar */}
        <div className="flex-1 h-full overflow-y-auto pr-2 space-y-4 pb-20 custom-scrollbar">

            {/* Capsules */}
            {template.capsules.length > 0 && (
              <div className="bg-white rounded-lg shadow-document border border-slate-200 overflow-hidden transition-shadow hover:shadow-document-hover">
                <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
                  <h3 className="font-semibold text-navy-900 flex items-center gap-2 font-sans">
                    <div className="w-8 h-8 rounded-lg bg-legal-emerald-50 flex items-center justify-center">
                       <Plus className="w-4 h-4 text-legal-emerald-600" />
                    </div>
                    Cláusulas adicionales
                  </h3>
                   <span className="text-xs font-medium text-slate-500 bg-white px-2 py-1 rounded-md border border-slate-200 font-sans">{selectedCapsules.length} seleccionadas</span>
                </div>
                <div className="divide-y divide-slate-100 overflow-y-auto">
                   {template.capsules.map((capsule) => {
                      const isSelected = selectedCapsules.includes(capsule.id);
                      const isExpanded = expandedCapsules.includes(capsule.id);
                      return (
                        <div 
                          key={capsule.id}
                          className={`transition-colors flex flex-col group ${isSelected ? 'bg-legal-emerald-50/30' : 'hover:bg-slate-50'}`}
                        >
                           {/* Header */}
                           <div className="flex items-center gap-3 p-4 cursor-pointer" onClick={() => toggleCapsule(capsule.id)}>
                               <div className={`w-5 h-5 rounded border flex-shrink-0 flex items-center justify-center transition-colors ${isSelected ? 'bg-legal-emerald-600 border-legal-emerald-600' : 'border-slate-300 bg-white group-hover:border-legal-emerald-400'}`}>
                                  {isSelected && <Check className="w-3 h-3 text-white" />}
                               </div>
                               <div className="flex-1 flex items-center justify-between gap-2">
                                  <span className={`text-sm font-medium font-sans ${isSelected ? 'text-navy-900' : 'text-slate-700'}`}>{capsule.title}</span>
                                  <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 font-sans">+{formatPrice(capsule.price)}</span>
                               </div>
                               <button 
                                 onClick={(e) => {
                                   e.stopPropagation();
                                   setExpandedCapsules(prev => prev.includes(capsule.id) ? prev.filter(id => id !== capsule.id) : [...prev, capsule.id]);
                                 }}
                                 className="p-1 hover:bg-slate-200 rounded-full transition-colors"
                               >
                                 {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                               </button>
                           </div>
                           
                           {/* Body (Accordion Content) */}
                           {isExpanded && (
                             <div className="px-4 pb-4 pl-12">
                               <p className="text-xs text-slate-500 leading-relaxed font-sans">{capsule.description || capsule.legal_text}</p>
                             </div>
                           )}
                        </div>
                      )
                   })}
                </div>
              </div>
            )}

            {/* Signature Type */}
            {requiresSignature && signatureInfo && (
              <div className="bg-white rounded-lg shadow-document border border-slate-200 p-5 transition-shadow hover:shadow-document-hover">
                <h3 className="font-semibold text-navy-900 mb-4 flex items-center gap-2 font-sans">
                   <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
                      <Shield className="w-4 h-4 text-amber-600" />
                   </div>
                   Tipo de Firma
                </h3>

                <div className="space-y-3">
                   {/* Simple */}
                   <button
                     onClick={() => setSignatureType('simple')}
                     className={`w-full p-4 rounded-lg border text-left transition-all relative ${
                        signatureType === 'simple' 
                        ? 'border-legal-emerald-500 bg-legal-emerald-50 ring-1 ring-legal-emerald-500' 
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                     }`}
                   >
                     <div className="flex items-center justify-between mb-1">
                        <span className={`text-sm font-semibold font-sans ${signatureType === 'simple' ? 'text-navy-900' : 'text-slate-700'}`}>Firma Simple (FES)</span>
                        <span className={`font-bold font-sans ${signatureType === 'simple' ? 'text-legal-emerald-700' : 'text-slate-700'}`}>{formatPrice(signatureInfo.pricing.fes.totalPrice)}</span>
                     </div>
                     <p className="text-xs text-slate-500 font-sans">Rápida y estándar. Para la mayoría de los casos.</p>
                   </button>

                   {/* Advanced */}
                   <button
                     onClick={() => setSignatureType('fea')}
                     className={`w-full p-4 rounded-lg border text-left transition-all ${
                        signatureType === 'fea' 
                        ? 'border-legal-emerald-500 bg-legal-emerald-50 ring-1 ring-legal-emerald-500' 
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                     }`}
                   >
                     <div className="flex items-center justify-between mb-1">
                        <span className={`text-sm font-semibold font-sans ${signatureType === 'fea' ? 'text-navy-900' : 'text-slate-700'}`}>Firma Avanzada (FEA)</span>
                        <span className={`font-bold font-sans ${signatureType === 'fea' ? 'text-legal-emerald-700' : 'text-slate-700'}`}>{formatPrice(signatureInfo.pricing.fea.totalPrice)}</span>
                     </div>
                     <p className="text-xs text-slate-500 font-sans">Máxima seguridad legal. Verificación de identidad.</p>
                   </button>
                </div>
              </div>
            )}

           {/* Fields Form */}
           <div className="bg-white rounded-lg shadow-document border border-slate-200 p-5 transition-shadow hover:shadow-document-hover">
              <h3 className="font-semibold text-navy-900 mb-4 flex items-center gap-2 font-sans">
                <div className="w-8 h-8 rounded-lg bg-legal-emerald-50 flex items-center justify-center">
                   <Edit3 className="w-4 h-4 text-legal-emerald-600" />
                </div>
                Datos del documento
              </h3>
              <FieldsForm
                 variables={filteredVariables}
                 formData={formData}
                 onFormChange={handleFormChange}
                 searchTerm={searchTerm}
                 onSearchChange={setSearchTerm}
                 activeField={activeField}
                 onFieldFocus={setActiveField}
                 onFieldBlur={() => setActiveField(null)}
              />
           </div>
            
            {/* Error Display */}
            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-100 flex items-start gap-2 animate-fade-in-up">
                 <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                 <p>{error}</p>
              </div>
            )}
        </div>
      </div>
      {/* Contact Data Modal */}
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
              Ingresa tus datos para enviarte el código de seguimiento y el acceso a tu borrador.
            </p>
            
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-navy-900 mb-2 font-sans">
                  Tu RUT <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={contactRut}
                  onChange={(e) => setContactRut(formatRut(e.target.value))}
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
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
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
                disabled={isSubmitting || !contactRut || !contactEmail}
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
      <style>{contractEditorStyles}</style>
    </div>
  );
}
