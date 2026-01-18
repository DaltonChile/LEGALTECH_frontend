import { useState, useMemo } from 'react';
import axios from 'axios';
import { ArrowLeft, Lock, Shield, Check, Plus, ArrowRight, AlertCircle, Edit3, User, FileText } from 'lucide-react';
import { DocumentPreview } from './DocumentPreview';
import { FieldsForm } from './FieldsForm';
import { EditorHeader } from './EditorHeader';
import { useContractRenderer } from './hooks/useContractRenderer';
import { extractVariables, formatVariableName } from './utils/templateParser';
import { formatPrice } from './utils/formatPrice';
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
    clauseNumbering: [],
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
          buyerEmail: contactEmail
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
    <div className="h-full bg-slate-50 flex flex-col">
      {/* Grid Pattern */}
      <div className="fixed inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none"></div>

      {/* Header */}
      <EditorHeader 
         steps={steps}
         currentStep="formulario-inicial"
         onBack={onBack}
         totalPrice={totalPrice}
         rightAction={
            <button
              onClick={handleGoToPayment}
              disabled={isSubmitting}
              className="bg-slate-900 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-slate-800 transition-colors disabled:opacity-50 flex items-center gap-2 shadow-sm"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/20 border-t-white"></div>
                  <span>Procesando...</span>
                </>
              ) : (
                <>
                  <span>Continuar al pago</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
         }
      />

      {/* Main Content */}
      <div className="relative z-10 flex-1 w-full max-w-[1920px] mx-auto p-6 flex gap-6 overflow-hidden min-h-0">
        
        {/* Left: Document Preview */}
        <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col relative z-0">
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
        <div className="w-[420px] h-full overflow-y-auto pr-2 space-y-4 pb-20 custom-scrollbar">
           
           {/* Contact Info Card */}
           <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 transition-shadow hover:shadow-md">
              <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                   <User className="w-4 h-4 text-blue-600" />
                </div>
                Datos de contacto
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">Tu RUT <span className="text-red-500">*</span></label>
                  <input 
                    type="text" 
                    value={contactRut}
                    onChange={(e) => setContactRut(formatRut(e.target.value))}
                    placeholder="12.345.678-9"
                    maxLength={12}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">Tu Email <span className="text-red-500">*</span></label>
                  <input 
                    type="email" 
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="nombre@ejemplo.com"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                  />
                  <p className="text-[10px] text-slate-500 mt-1.5">Aquí recibirás el código de seguimiento</p>
                </div>
              </div>
           </div>

           {/* Fields Form */}
           <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 transition-shadow hover:shadow-md">
              <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                   <Edit3 className="w-4 h-4 text-emerald-600" />
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

            {/* Capsules */}
            {template.capsules.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden transition-shadow hover:shadow-md">
                <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                  <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-violet-50 flex items-center justify-center">
                       <Plus className="w-4 h-4 text-violet-600" />
                    </div>
                    Cláusulas adicionales
                  </h3>
                   <span className="text-xs font-medium text-slate-500 bg-white px-2 py-1 rounded border border-slate-200">{selectedCapsules.length} seleccionadas</span>
                </div>
                <div className="divide-y divide-slate-100 max-h-[300px] overflow-y-auto">
                   {template.capsules.map((capsule) => {
                      const isSelected = selectedCapsules.includes(capsule.id);
                      return (
                        <div 
                          key={capsule.id}
                          onClick={() => toggleCapsule(capsule.id)}
                          className={`p-4 cursor-pointer transition-colors hover:bg-slate-50 flex items-start gap-3 group ${isSelected ? 'bg-violet-50/30' : ''}`}
                        >
                           <div className={`mt-0.5 w-5 h-5 rounded border flex-shrink-0 flex items-center justify-center transition-colors ${isSelected ? 'bg-violet-600 border-violet-600' : 'border-slate-300 bg-white group-hover:border-violet-400'}`}>
                              {isSelected && <Check className="w-3 h-3 text-white" />}
                           </div>
                           <div className="flex-1">
                              <div className="flex items-center justify-between gap-2 mb-1">
                                <span className={`text-sm font-medium ${isSelected ? 'text-violet-900' : 'text-slate-900'}`}>{capsule.title}</span>
                                <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">+{formatPrice(capsule.price)}</span>
                              </div>
                              <p className="text-xs text-slate-500 line-clamp-2">{capsule.description || capsule.legal_text}</p>
                           </div>
                        </div>
                      )
                   })}
                </div>
              </div>
            )}

            {/* Signature Type */}
            {requiresSignature && signatureInfo && (
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 transition-shadow hover:shadow-md">
                <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                   <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
                      <Shield className="w-4 h-4 text-amber-600" />
                   </div>
                   Tipo de Firma
                </h3>

                <div className="space-y-3">
                   {/* Simple */}
                   <button
                     onClick={() => setSignatureType('simple')}
                     className={`w-full p-3 rounded-lg border text-left transition-all relative ${
                        signatureType === 'simple' 
                        ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500' 
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                     }`}
                   >
                     <div className="flex items-center justify-between mb-1">
                        <span className={`text-sm font-semibold ${signatureType === 'simple' ? 'text-blue-900' : 'text-slate-900'}`}>Firma Simple (FES)</span>
                        <span className="font-bold text-slate-900">{formatPrice(signatureInfo.pricing.fes.totalPrice)}</span>
                     </div>
                     <p className="text-xs text-slate-500">Rápida y estándar. Para la mayoría de los casos.</p>
                   </button>

                   {/* Advanced */}
                   <button
                     onClick={() => setSignatureType('fea')}
                     className={`w-full p-3 rounded-lg border text-left transition-all ${
                        signatureType === 'fea' 
                        ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500' 
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                     }`}
                   >
                     <div className="flex items-center justify-between mb-1">
                        <span className={`text-sm font-semibold ${signatureType === 'fea' ? 'text-blue-900' : 'text-slate-900'}`}>Firma Avanzada (FEA)</span>
                        <span className="font-bold text-slate-900">{formatPrice(signatureInfo.pricing.fea.totalPrice)}</span>
                     </div>
                     <p className="text-xs text-slate-500">Máxima seguridad legal. Verificación de identidad.</p>
                   </button>
                </div>
              </div>
            )}
            
            {/* Error Display */}
            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-100 flex items-start gap-2 animate-fade-in-up">
                 <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                 <p>{error}</p>
              </div>
            )}
        </div>
      </div>
      <style>{contractEditorStyles}</style>
    </div>
  );
}
