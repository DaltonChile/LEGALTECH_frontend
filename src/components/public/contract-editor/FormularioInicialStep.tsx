import { useState, useMemo } from 'react';
import axios from 'axios';
import { ArrowLeft, Lock, CreditCard, Shield, Zap, Check, Plus } from 'lucide-react';
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
  }) => void;
  onBack: () => void;
}

const BLUR_THRESHOLD = 30; // 30% para activar el blur

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

  const requiresSignature = signatureInfo?.requiresSignatures ?? true;

  // Extraer todas las variables del template
  const allVariables = useMemo(
    () => extractVariables(template.template_content, template.capsules, selectedCapsules),
    [template.template_content, template.capsules, selectedCapsules]
  );

  // Calcular porcentaje de completado
  const completionPercentage = useMemo(() => {
    const validVariables = allVariables.filter(v => v);
    const filled = validVariables.filter(v => formData[v] && formData[v].trim() !== '').length;
    return validVariables.length > 0 ? Math.round((filled / validVariables.length) * 100) : 0;
  }, [formData, allVariables]);

  // Determinar si se debe mostrar el blur
  const showBlur = completionPercentage >= BLUR_THRESHOLD;

  // Calcular precio total
  const totalPrice = useMemo(() => {
    let price = template.base_price || 0;
    
    // Agregar precio de cápsulas
    template.capsules
      .filter(c => selectedCapsules.includes(c.id))
      .forEach(c => { price += c.price; });
    
    // Agregar precio de firma
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

  const handleInputChange = (variable: string, value: string) => {
    setFormData(prev => ({ ...prev, [variable]: value }));
  };

  // Obtener datos del comprador desde signers_config
  const getBuyerData = () => {
    const buyerSigner = template.signers_config?.[0];
    if (!buyerSigner) return { rut: '', email: '' };
    
    return {
      rut: formData[buyerSigner.rut_variable] || '',
      email: formData[buyerSigner.email_variable] || ''
    };
  };

  const handleGoToPayment = async () => {
    setError(null);
    setIsSubmitting(true);

    try {
      const buyerData = getBuyerData();

      if (!buyerData.rut || !buyerData.email) {
        setError('Por favor completa tu RUT y correo electrónico antes de continuar.');
        setIsSubmitting(false);
        return;
      }

      // Validar email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(buyerData.email)) {
        setError('Por favor ingresa un correo electrónico válido.');
        setIsSubmitting(false);
        return;
      }

      // Crear contrato con formulario inicial
      const response = await axios.post<{ success: boolean; data: InitialFormResponse; error?: string }>(
        `${import.meta.env.VITE_API_URL}/contracts/initial`,
        {
          template_version_id: template.version_id,
          buyer_rut: buyerData.rut,
          buyer_email: buyerData.email,
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
          signatureType: requiresSignature ? signatureType : 'none'
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

  // Detectar tipo de campo
  const isRutField = (variable: string): boolean => {
    return variable.toLowerCase().includes('rut');
  };

  const isEmailField = (variable: string): boolean => {
    const v = variable.toLowerCase();
    return v.includes('email') || v.includes('correo') || v.includes('mail');
  };

  const isPhoneField = (variable: string): boolean => {
    const v = variable.toLowerCase();
    return v.includes('telefono') || v.includes('teléfono') || v.includes('celular') || v.includes('phone');
  };

  const getInputType = (variable: string): string => {
    if (isEmailField(variable)) return 'email';
    if (isPhoneField(variable)) return 'tel';
    return 'text';
  };

  const getPlaceholder = (variable: string): string => {
    if (isRutField(variable)) return 'Ej: 12345678-9';
    if (isEmailField(variable)) return 'ejemplo@correo.com';
    if (isPhoneField(variable)) return '+56912345678';
    return '';
  };

  return (
    <div className="h-full bg-gradient-to-br from-slate-50 via-cyan-50/30 to-lime-50/30 p-6 overflow-auto">
      {/* Botón Volver */}
      <div className="mb-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 rounded-lg shadow-md border border-slate-200 transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver al catálogo
        </button>
      </div>

      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Columna izquierda: Formulario */}
          <div className="lg:col-span-2 space-y-6 relative">
            {/* Header */}
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
              <h1 className="text-2xl font-bold text-slate-900 mb-2">{template.title}</h1>
              <p className="text-slate-600">
                Completa los datos iniciales para continuar al pago. Podrás completar el resto después de pagar.
              </p>
              
              {/* Barra de progreso */}
              <div className="mt-4">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-slate-600">Progreso del formulario</span>
                  <span className="font-semibold text-cyan-600">{completionPercentage}%</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-cyan-500 to-cyan-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${completionPercentage}%` }}
                  />
                </div>
                {completionPercentage < BLUR_THRESHOLD && (
                  <p className="text-xs text-slate-500 mt-2">
                    Completa al menos {BLUR_THRESHOLD}% del formulario para continuar al pago
                  </p>
                )}
              </div>
            </div>

            {/* Formulario de campos */}
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 relative">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Datos del contrato</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {allVariables.filter(v => v).map((variable) => (
                  <div key={variable} className="relative">
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      {formatVariableName(variable)}
                    </label>
                    <input
                      type={getInputType(variable)}
                      value={formData[variable] || ''}
                      onChange={(e) => handleInputChange(variable, e.target.value)}
                      placeholder={getPlaceholder(variable)}
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
                    />
                  </div>
                ))}
              </div>

              {/* Overlay de blur cuando alcanza el umbral */}
              {showBlur && (
                <div className="absolute inset-0 bg-white/80 backdrop-blur-sm rounded-2xl flex items-center justify-center z-10">
                  <div className="text-center p-8 max-w-md">
                    <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Lock className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">
                      ¡Excelente! Has completado suficiente
                    </h3>
                    <p className="text-slate-600 mb-6">
                      Continúa al pago para desbloquear el resto del formulario y completar tu contrato.
                    </p>
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
                          <CreditCard className="w-5 h-5" />
                          Ir al Pago - {formatPrice(totalPrice)}
                        </>
                      )}
                    </button>
                    {error && (
                      <p className="mt-4 text-red-600 text-sm">{error}</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Columna derecha: Sidebar */}
          <div className="space-y-6">
            {/* Selector de tipo de firma */}
            {requiresSignature && signatureInfo && (
              <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
                <h3 className="text-sm font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-cyan-600" />
                  Tipo de Firma Electrónica
                </h3>
                
                <div className="space-y-3">
                  {/* FES Option */}
                  <label className={`flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                    signatureType === 'simple' 
                      ? 'border-cyan-600 bg-cyan-50' 
                      : 'border-gray-200 hover:border-cyan-300'
                  }`}>
                    <input
                      type="radio"
                      name="signatureType"
                      value="simple"
                      checked={signatureType === 'simple'}
                      onChange={() => setSignatureType('simple')}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Zap className="w-4 h-4 text-green-600" />
                        <span className="font-semibold text-sm">FES (Simple)</span>
                      </div>
                      <p className="text-xs text-gray-600 mt-1">
                        Firma electrónica simple
                      </p>
                      <p className="text-sm font-bold text-green-600 mt-1">
                        {formatPrice(signatureInfo.pricing.fes.totalPrice)}
                      </p>
                    </div>
                  </label>

                  {/* FEA Option */}
                  <label className={`flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                    signatureType === 'fea' 
                      ? 'border-cyan-600 bg-cyan-50' 
                      : 'border-gray-200 hover:border-cyan-300'
                  }`}>
                    <input
                      type="radio"
                      name="signatureType"
                      value="fea"
                      checked={signatureType === 'fea'}
                      onChange={() => setSignatureType('fea')}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4 text-cyan-600" />
                        <span className="font-semibold text-sm">FEA (Avanzada)</span>
                      </div>
                      <p className="text-xs text-gray-600 mt-1">
                        Firma electrónica avanzada
                      </p>
                      <p className="text-sm font-bold text-cyan-600 mt-1">
                        {formatPrice(signatureInfo.pricing.fea.totalPrice)}
                      </p>
                    </div>
                  </label>
                </div>

                <p className="text-xs text-gray-500 mt-3">
                  {signatureInfo.numberOfSigners} {signatureInfo.numberOfSigners === 1 ? 'firmante' : 'firmantes'}
                  {signatureInfo.requiresNotary && ' + firma manual notario'}
                </p>
              </div>
            )}

            {/* Selector de cápsulas */}
            {template.capsules.length > 0 && (
              <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
                <div className="p-4 bg-slate-50 flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                    <Plus className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-900">Cláusulas opcionales</div>
                    <div className="text-xs text-slate-500">{selectedCapsules.length} seleccionadas</div>
                  </div>
                </div>
                
                <div className="border-t border-slate-100 p-4 space-y-2">
                  {template.capsules.map((capsule) => {
                    const isSelected = selectedCapsules.includes(capsule.id);
                    return (
                      <div
                        key={capsule.id}
                        onClick={() => toggleCapsule(capsule.id)}
                        className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all ${
                          isSelected ? 'bg-cyan-50 ring-2 ring-cyan-500' : 'bg-white hover:bg-slate-50'
                        }`}
                      >
                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                          isSelected ? 'bg-cyan-500 border-cyan-500' : 'border-slate-300 bg-white'
                        }`}>
                          {isSelected && <Check className="w-3 h-3 text-white" />}
                        </div>
                        <div className="flex-1">
                          <div className="text-sm font-medium text-slate-900">{capsule.title}</div>
                          {capsule.description && (
                            <div className="text-xs text-slate-500">{capsule.description}</div>
                          )}
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

            {/* Resumen de precio */}
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
              <h3 className="text-sm font-medium text-slate-500 mb-3">Resumen</h3>
              
              <div className="space-y-2 text-sm">
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
                    <span className="text-slate-600">
                      Firma {signatureType === 'fea' ? 'FEA' : 'FES'}
                    </span>
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
            </div>

            {/* Botón de pago (visible cuando no hay blur) */}
            {!showBlur && (
              <div className="bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl p-6 text-center">
                <Lock className="w-10 h-10 text-slate-400 mx-auto mb-3" />
                <p className="text-sm text-slate-600">
                  Completa al menos {BLUR_THRESHOLD}% del formulario para desbloquear el pago
                </p>
                <div className="mt-3 text-2xl font-bold text-slate-400">
                  {completionPercentage}% / {BLUR_THRESHOLD}%
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
