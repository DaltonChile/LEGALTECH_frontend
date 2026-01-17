import { useState, useMemo } from 'react';
import axios from 'axios';
import { ArrowLeft, Lock, Shield, Zap, Check, Plus, ArrowRight } from 'lucide-react';
import { DocumentPreview } from './DocumentPreview';
import { FieldsForm } from './FieldsForm';
import { useContractRenderer } from './hooks/useContractRenderer';
import { extractVariables, formatVariableName } from './utils/templateParser';
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
    <div className="relative h-full bg-gradient-to-br from-slate-50 via-cyan-50/30 to-lime-50/30 p-6 overflow-hidden">
      {/* Background Decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-br from-blue-400/20 to-lime-400/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-gradient-to-tr from-cyan-400/20 to-emerald-400/20 rounded-full blur-3xl"></div>
      </div>
      
      {/* Header */}
      <div className="relative mb-4">
        <div className="flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 rounded-lg shadow-md border border-slate-200 transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver al catálogo
          </button>
          
          <div className="text-center flex-1 px-4">
            <h1 className="text-xl font-bold text-slate-900">{template.title}</h1>
            <p className="text-sm text-slate-500">Completa los datos iniciales para continuar al pago</p>
          </div>
          
          <div className="w-[140px]"></div>
        </div>
      </div>
      
      <div className="relative flex gap-6 h-[calc(100%-80px)]">
        {/* Vista previa del documento - usa el mismo DocumentPreview */}
        <div className="flex-1 flex flex-col">
          <DocumentPreview
            templateText={template.template_content}
            renderedContract={renderedContract}
            completionPercentage={completionPercentage}
            activeField={activeField}
            variablesMetadata={template.variables_metadata || []}
            visiblePercentage={VISIBLE_PERCENTAGE}
            lockedOverlayContent={lockedOverlayContent}
          />
        </div>

        {/* Panel derecho: Formulario y opciones */}
        <div className="w-[400px] space-y-4 min-w-0 overflow-y-auto">
          {/* Barra de progreso */}


          {/* Campos de datos del comprador - REQUERIDOS */}
          <div className="bg-gradient-to-r from-cyan-50 to-blue-50 rounded-2xl shadow-lg border-2 border-cyan-200 p-4 space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 bg-cyan-500 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div>
                <span className="text-sm font-semibold text-slate-900">Tus datos de contacto</span>
                <p className="text-xs text-slate-500">Necesarios para continuar con el proceso</p>
              </div>
            </div>

            {/* Campo RUT */}
            <div>
              <label className="text-xs font-medium text-slate-700 mb-1 block">
                Tu RUT <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={contactRut}
                onChange={(e) => setContactRut(formatRut(e.target.value))}
                placeholder="12.345.678-9"
                maxLength={12}
                className="w-full px-4 py-3 rounded-xl border-2 border-cyan-200 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200 outline-none transition-all text-sm"
              />
            </div>

            {/* Campo Email */}
            <div>
              <label className="text-xs font-medium text-slate-700 mb-1 block">
                Tu correo electrónico <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder="ejemplo@correo.com"
                className="w-full px-4 py-3 rounded-xl border-2 border-cyan-200 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200 outline-none transition-all text-sm"
              />
              <p className="text-xs text-slate-500 mt-1">Recibirás tu código de seguimiento aquí</p>
            </div>
          </div>

          {/* 1. Formulario de campos - PRIMERO */}
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

          {/* 2. Selector de cápsulas - SEGUNDO */}
          {template.capsules.length > 0 && (
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
              <div className="p-3 bg-slate-50 flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                  <Plus className="w-4 h-4 text-white" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-900">Cláusulas opcionales</div>
                  <div className="text-xs text-slate-500">{selectedCapsules.length} seleccionadas</div>
                </div>
              </div>
              
              <div className="border-t border-slate-100 p-3 space-y-2 max-h-[150px] overflow-y-auto">
                {template.capsules.map((capsule) => {
                  const isSelected = selectedCapsules.includes(capsule.id);
                  return (
                    <div
                      key={capsule.id}
                      onClick={() => toggleCapsule(capsule.id)}
                      className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-all ${
                        isSelected ? 'bg-cyan-50 ring-2 ring-cyan-500' : 'bg-white hover:bg-slate-50'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                        isSelected ? 'bg-cyan-500 border-cyan-500' : 'border-slate-300 bg-white'
                      }`}>
                        {isSelected && <Check className="w-3 h-3 text-white" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-slate-900 truncate">{capsule.title}</div>
                      </div>
                      <div className={`text-xs font-bold px-2 py-1 rounded ${
                        isSelected ? 'bg-cyan-500 text-white' : 'bg-slate-200 text-slate-600'
                      }`}>
                        +{formatPrice(capsule.price)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 3. Selector de tipo de firma - TERCERO con mejor diseño */}
          {requiresSignature && signatureInfo && (
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-4">
              <h3 className="text-sm font-semibold text-slate-900 mb-2 flex items-center gap-2">
                <Shield className="w-4 h-4 text-cyan-600" />
                Tipo de Firma Electrónica
              </h3>
              <p className="text-xs text-slate-500 mb-4">
                Selecciona el tipo de firma según tus necesidades legales
              </p>
              
              <div className="space-y-3">
                {/* Opción FES */}
                <button
                  onClick={() => setSignatureType('simple')}
                  className={`w-full p-4 rounded-xl border-2 text-left transition-all relative overflow-hidden ${
                    signatureType === 'simple' 
                      ? 'border-green-500 bg-gradient-to-r from-green-50 to-emerald-50 shadow-lg shadow-green-100' 
                      : 'border-gray-200 hover:border-green-300 hover:bg-green-50/30'
                  }`}
                >
                  {signatureType === 'simple' && (
                    <div className="absolute top-2 right-2">
                      <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      signatureType === 'simple' 
                        ? 'bg-green-500' 
                        : 'bg-green-100'
                    }`}>
                      <Zap className={`w-5 h-5 ${signatureType === 'simple' ? 'text-white' : 'text-green-600'}`} />
                    </div>
                    <div>
                      <span className="font-bold text-base">FES - Firma Simple</span>
                      <p className="text-lg font-bold text-green-600">
                        {formatPrice(signatureInfo.pricing.fes.totalPrice)}
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 ml-13">
                    Rápida y sencilla. Ideal para contratos de bajo riesgo y acuerdos internos.
                  </p>
                </button>

                {/* Opción FEA */}
                <button
                  onClick={() => setSignatureType('fea')}
                  className={`w-full p-4 rounded-xl border-2 text-left transition-all relative overflow-hidden ${
                    signatureType === 'fea' 
                      ? 'border-cyan-500 bg-gradient-to-r from-cyan-50 to-blue-50 shadow-lg shadow-cyan-100' 
                      : 'border-gray-200 hover:border-cyan-300 hover:bg-cyan-50/30'
                  }`}
                >
                  {signatureType === 'fea' && (
                    <div className="absolute top-2 right-2">
                      <div className="w-6 h-6 bg-cyan-500 rounded-full flex items-center justify-center">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      signatureType === 'fea' 
                        ? 'bg-cyan-500' 
                        : 'bg-cyan-100'
                    }`}>
                      <Shield className={`w-5 h-5 ${signatureType === 'fea' ? 'text-white' : 'text-cyan-600'}`} />
                    </div>
                    <div>
                      <span className="font-bold text-base">FEA - Firma Avanzada</span>
                      <p className="text-lg font-bold text-cyan-600">
                        {formatPrice(signatureInfo.pricing.fea.totalPrice)}
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 ml-13">
                    Mayor validez legal. Recomendada para contratos importantes y con terceros.
                  </p>
                </button>
              </div>
            </div>
          )}

          {/* Resumen y botón de pago */}
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-4">
            <div className="space-y-2 text-sm mb-4">
              <div className="flex justify-between">
                <span className="text-slate-600">Contrato base</span>
                <span>{formatPrice(template.base_price)}</span>
              </div>
              
              {selectedCapsules.length > 0 && (
                <div className="flex justify-between">
                  <span className="text-slate-600">Cláusulas ({selectedCapsules.length})</span>
                  <span>
                    {formatPrice(
                      template.capsules
                        .filter(c => selectedCapsules.includes(c.id))
                        .reduce((sum, c) => sum + c.price, 0)
                    )}
                  </span>
                </div>
              )}
              
              {requiresSignature && signatureInfo && signatureType !== 'none' && (
                <div className="flex justify-between">
                  <span className="text-slate-600">Firma {signatureType.toUpperCase()}</span>
                  <span>
                    {formatPrice(
                      signatureType === 'fea' 
                        ? signatureInfo.pricing.fea.totalPrice 
                        : signatureInfo.pricing.fes.totalPrice
                    )}
                  </span>
                </div>
              )}
              
              <div className="border-t border-slate-200 pt-2 mt-2">
                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span className="text-cyan-600">{formatPrice(totalPrice)}</span>
                </div>
              </div>
            </div>

            {/* Botón de pago - siempre disponible */}
            <button
              onClick={handleGoToPayment}
              disabled={isSubmitting}
              className="w-full py-4 rounded-xl font-semibold text-white bg-gradient-to-r from-cyan-600 to-cyan-700 hover:from-cyan-700 hover:to-cyan-800 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Procesando...
                </>
              ) : (
                <>
                  Continuar al Pago
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>

            {error && (
              <p className="mt-3 text-red-600 text-sm text-center">{error}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
