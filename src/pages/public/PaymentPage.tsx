import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { Payment } from '@mercadopago/sdk-react';
import { CreditCard, Shield, AlertTriangle, Loader2, FileText, PenTool, Package, Users, CheckCircle2, Upload } from 'lucide-react';
import paymentService from '../../services/paymentService';
import { formatPrice } from '../../components/public/contract-editor/utils/formatPrice';
import { getErrorMessage } from '../../utils/validators';
import mercadoPagoConfig, { initMPWithKey } from '../../config/mercadopago';
import { Navbar } from '../../components/landing/Navbar';
import { EditorHeader } from '../../components/public/contract-editor/EditorHeader';
import { getStepsForFlow, getCustomDocumentSteps } from '../../utils/flowConfig';
import api, { getContractDetails } from '../../services/api';
import BillingTypeSelector from '../../components/public/contract-editor/BillingTypeSelector';
import type { BillingData } from '../../types/billing';

interface Signer {
  id: string;
  full_name: string;
  email: string;
  rut: string;
  role: string;
}

interface ContractDetails {
  template_title: string;
  signature_type: 'none' | 'simple' | 'fea';
  base_price: number;
  signature_price: number;
  capsules: Array<{
    id: number;
    title: string;
    price: number;
  }>;
  // Custom document fields
  is_custom_document?: boolean;
  custom_notary?: boolean;
  signer_count?: number;
  signers?: Signer[];
}

const PaymentPage: React.FC = () => {
  const { contractId } = useParams<{ contractId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const trackingCode = searchParams.get('tracking_code') || '';
  const rut = searchParams.get('rut') || '';
  // hasSigners determina si el flujo tiene paso de firmas (5 pasos) o no (4 pasos)
  const hasSigners = searchParams.get('hasSigners') === 'true';

  const [preferenceId, setPreferenceId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [amount, setAmount] = useState<number>(0);
  const [contractDetails, setContractDetails] = useState<ContractDetails | null>(null);
  const [mpPublicKey, setMpPublicKey] = useState<string | null>(null);
  const [isMpReady, setIsMpReady] = useState(false);
  const billingDataRef = useRef<BillingData>({ billing_type: 'boleta' });
  const [brickKey, setBrickKey] = useState(0);
  const brickReady = useRef(false);
  const preferenceCreated = useRef(false);
  const mpKeyInitialized = useRef<string | null>(null);
  const brickRetryCount = useRef(0);

  const handleBillingChange = useCallback((data: BillingData) => {
    billingDataRef.current = data;
  }, []);

  // Calcular los pasos basándose en el tipo de documento y si hay firmantes
  const PROGRESS_STEPS = useMemo(() => {
    if (contractDetails?.is_custom_document) {
      const signerCount = contractDetails?.signer_count || contractDetails?.signers?.length || 0;
      return getCustomDocumentSteps(signerCount > 0);
    }
    return getStepsForFlow(hasSigners);
  }, [hasSigners, contractDetails?.is_custom_document, contractDetails?.signer_count, contractDetails?.signers?.length]);

  useEffect(() => {
    if (!contractId || !trackingCode || !rut) {
      setError('Faltan datos del contrato');
      setLoading(false);
      return;
    }
    loadContractAndPreference();
  }, [contractId, trackingCode, rut]);

  useEffect(() => {
    const keyToUse = mpPublicKey || mercadoPagoConfig.publicKey;
    if (!keyToUse || mpKeyInitialized.current === keyToUse) {
      return;
    }

    console.log('Inicializando MercadoPago SDK');
    initMPWithKey(keyToUse);
    mpKeyInitialized.current = keyToUse;

    // Give SDK extra time to fully initialize before marking as ready
    setTimeout(() => {
      setIsMpReady(true);
    }, 300);
  }, [mpPublicKey, mercadoPagoConfig.publicKey]);

  const loadContractAndPreference = async () => {
    // Prevent duplicate calls (React Strict Mode or re-renders)
    if (preferenceCreated.current) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      brickReady.current = false;
      preferenceCreated.current = true;

      // Cargar detalles del contrato y preferencia en paralelo
      const [contractResponse, preferenceResponse] = await Promise.all([
        getContractDetails(contractId!, trackingCode, rut),
        paymentService.createPreference({
          contract_id: contractId!,
          tracking_code: trackingCode,
          rut: rut,
          billing_data: billingDataRef.current
        })
      ]);

      // Procesar respuesta del contrato
      if (contractResponse.data?.success && contractResponse.data?.data) {
        const contract = contractResponse.data.data;

        // Check if it's a custom document
        if (contract.is_custom_document) {
          // Custom document - different data structure
          setContractDetails({
            template_title: 'Documento personalizado',
            signature_type: contract.signature_type || 'simple',
            base_price: 0,
            signature_price: parseFloat(contract.signature_price) || contract.total_amount,
            capsules: [],
            is_custom_document: true,
            custom_notary: contract.custom_notary || false,
            signer_count: contract.signers?.length || 0,
            signers: contract.signers || []
          });
        } else {
          // Template-based contract
          const basePrice = contract.templateVersion?.base_price || contract.total_amount - (contract.signature_price || 0);
          const templateTitle = contract.template?.title || contract.templateVersion?.template?.title || 'Contrato';

          const capsules = (contract.selectedCapsules || []).map((c: any) => ({
            id: c.id,
            title: c.title,
            price: c.SelectedCapsule?.price_at_moment || c.price || 0
          }));

          setContractDetails({
            template_title: templateTitle,
            signature_type: contract.signature_type || 'none',
            base_price: parseFloat(basePrice) || 0,
            signature_price: parseFloat(contract.signature_price) || 0,
            capsules,
            is_custom_document: false
          });
        }
      }

      // Procesar respuesta de preferencia
      if (preferenceResponse.success && preferenceResponse.data) {
        setPreferenceId(preferenceResponse.data.preference_id);
        setAmount(preferenceResponse.data.amount);
        if (preferenceResponse.data.public_key) {
          setMpPublicKey(preferenceResponse.data.public_key);
        }
      } else {
        throw new Error('Error al crear preferencia de pago');
      }

      setLoading(false);
    } catch (err: any) {
      console.error('Error cargando datos:', err);
      preferenceCreated.current = false; // Reset flag to allow retry
      setError(getErrorMessage(err, 'Error al iniciar el pago'));
      setLoading(false);
    }
  };

  const getSignatureLabel = (type: string) => {
    switch (type) {
      case 'fea': return 'Firma Electrónica Avanzada (FEA)';
      case 'simple': return 'Firma Electrónica Simple (FES)';
      default: return 'Sin firma electrónica';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-100">
        <Navbar />
        <EditorHeader
          steps={PROGRESS_STEPS}
          currentStep="payment"
          onBack={() => navigate(-1)}
        />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-16 h-16 text-navy-900 mx-auto mb-4 animate-spin" />
            <p className="text-slate-600 font-medium font-sans">Preparando tu pago...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-100">
        <Navbar />
        <EditorHeader
          steps={PROGRESS_STEPS}
          currentStep="payment"
          onBack={() => navigate(-1)}
        />
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-document border border-slate-200 p-8 max-w-md w-full text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
            <h1 className="text-xl font-serif font-bold text-navy-900 mb-2">Error iniciando el pago</h1>
            <p className="text-slate-600 mb-6 font-sans">{error}</p>
            <div className="space-y-3">
              <button
                onClick={() => {
                  preferenceCreated.current = false; // Reset flag before retry
                  loadContractAndPreference();
                }}
                className="w-full bg-navy-900 hover:bg-navy-800 text-white font-medium py-3 px-4 rounded-lg transition-colors font-sans"
              >
                Reintentar
              </button>
              <button
                onClick={() => navigate(-1)}
                className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium py-3 px-4 rounded-lg transition-colors font-sans"
              >
                Volver
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-100">
      {/* Navbar */}
      <Navbar />

      {/* Header */}
      <EditorHeader
        steps={PROGRESS_STEPS}
        currentStep="payment"
        onBack={() => navigate(-1)}
        totalPrice={amount}
      />

      <div className="flex-1 flex items-center justify-center p-6 relative z-10">
        <div className="bg-white rounded-lg shadow-document-hover border border-slate-200 p-8 max-w-4xl w-full">

          {/* Header del Card */}
          <div className="flex items-center gap-4 mb-8 pb-6 border-b border-slate-100">
            <div className="w-12 h-12 bg-navy-900 rounded-lg flex items-center justify-center">
              <CreditCard className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-serif font-bold text-navy-900">Completar Pago</h1>
              <p className="text-slate-500 font-sans">Finaliza tu compra de forma segura con Mercado Pago</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Left Column: Summary */}
            <div className="space-y-6">
              {/* Desglose del pedido */}
              <div className="bg-slate-50 rounded-lg p-5 border border-slate-100">
                <h3 className="font-semibold text-navy-900 mb-4 flex items-center gap-2 font-sans">
                  <FileText className="w-4 h-4" />
                  Resumen del pedido
                </h3>

                <div className="space-y-4">
                  {/* Document/Contract title */}
                  {contractDetails && (
                    <div className="pb-3 border-b border-slate-200">
                      <div className="flex items-center gap-2 mb-1">
                        {contractDetails.is_custom_document ? (
                          <Upload className="w-4 h-4 text-slate-400" />
                        ) : null}
                        <p className="text-xs text-slate-500 font-sans">
                          {contractDetails.is_custom_document ? 'Documento' : 'Contrato'}
                        </p>
                      </div>
                      <p className="font-medium text-navy-900 font-sans">{contractDetails.template_title}</p>
                      {!contractDetails.is_custom_document && contractDetails.base_price > 0 && (
                        <div className="flex justify-between mt-1">
                          <span className="text-sm text-slate-500 font-sans">Precio base</span>
                          <span className="text-sm font-medium text-slate-700 font-sans">{formatPrice(contractDetails.base_price)}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Signers (for custom documents) */}
                  {contractDetails?.is_custom_document && contractDetails.signers && contractDetails.signers.length > 0 && (
                    <div className="pb-3 border-b border-slate-200">
                      <div className="flex items-center gap-2 mb-2">
                        <Users className="w-4 h-4 text-slate-400" />
                        <p className="text-xs text-slate-500 font-sans">Firmantes ({contractDetails.signers.length})</p>
                      </div>
                      <div className="space-y-1.5 pl-6">
                        {contractDetails.signers.map((signer) => (
                          <div key={signer.id} className="flex justify-between text-sm">
                            <span className="text-slate-600 font-sans">{signer.full_name}</span>
                            <span className="text-xs text-slate-500 font-sans">{signer.role}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Cláusulas adicionales (for template contracts) */}
                  {!contractDetails?.is_custom_document && contractDetails?.capsules && contractDetails.capsules.length > 0 && (
                    <div className="pb-3 border-b border-slate-200">
                      <div className="flex items-center gap-2 mb-2">
                        <Package className="w-4 h-4 text-slate-400" />
                        <p className="text-xs text-slate-500 font-sans">Cláusulas adicionales ({contractDetails.capsules.length})</p>
                      </div>
                      <div className="space-y-1.5 pl-6">
                        {contractDetails.capsules.map((capsule) => (
                          <div key={capsule.id} className="flex justify-between text-sm">
                            <span className="text-slate-600 font-sans">{capsule.title}</span>
                            <span className="font-medium text-slate-700 font-sans">{formatPrice(capsule.price)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Tipo de firma */}
                  {contractDetails && contractDetails.signature_type !== 'none' && (
                    <div className="pb-3 border-b border-slate-200">
                      <div className="flex items-center gap-2 mb-1">
                        <PenTool className="w-4 h-4 text-slate-400" />
                        <p className="text-xs text-slate-500 font-sans">Firma electrónica</p>
                      </div>
                      <div className="flex justify-between pl-6">
                        <span className="text-sm text-slate-600 font-sans">{getSignatureLabel(contractDetails.signature_type)}</span>
                        {!contractDetails.is_custom_document && (
                          <span className="text-sm font-medium text-slate-700 font-sans">{formatPrice(contractDetails.signature_price)}</span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Notary option (for custom documents) */}
                  {contractDetails?.is_custom_document && contractDetails.custom_notary && (
                    <div className="pb-3 border-b border-slate-200">
                      <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4 text-slate-400" />
                        <p className="text-sm text-slate-600 font-sans">Visación notarial incluida</p>
                      </div>
                    </div>
                  )}

                  {/* Código de seguimiento */}
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500 font-sans">Código de seguimiento</span>
                    <span className="font-mono font-medium text-slate-700">{trackingCode}</span>
                  </div>

                  {/* Total */}
                  <div className="border-t border-slate-300 pt-3 flex justify-between items-center mt-2">
                    <span className="font-semibold text-navy-900 font-sans">Total a pagar</span>
                    <span className="text-xl font-bold text-navy-900 font-sans">
                      {formatPrice(amount)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Selector de tipo de documento tributario */}
              <BillingTypeSelector
                buyerRut={rut}
                onChange={handleBillingChange}
              />

              {/* Advertencia de modo test */}
              {mercadoPagoConfig.isTestMode && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-amber-800 text-sm font-sans">Modo de Prueba</p>
                      <p className="text-xs text-amber-700 mt-1 font-sans">
                        Usa las tarjetas de test de Mercado Pago. No se cobrará dinero real.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-legal-emerald-50 border border-legal-emerald-100 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-legal-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-legal-emerald-800 text-sm font-sans">Pago 100% seguro</p>
                    <p className="text-xs text-legal-emerald-700 mt-1 font-sans">
                      Tu información está encriptada y procesada por Mercado Pago.
                    </p>
                  </div>
                </div>
              </div>

              {/* What happens next (for custom documents) */}
              {contractDetails?.is_custom_document && (
                <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-blue-800 text-sm font-sans">¿Qué sigue después del pago?</p>
                      <p className="text-xs text-blue-700 mt-1 font-sans">
                        Cada firmante recibirá un email con instrucciones para firmar el documento electrónicamente.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column: Payment Brick */}
            <div>
              {preferenceId && amount && isMpReady ? (
                <div className="payment-brick-container">
                  <Payment
                    key={`${preferenceId}-${brickKey}`}
                    initialization={{
                      amount: amount,
                      preferenceId: preferenceId
                    }}
                    customization={{
                      paymentMethods: {
                        creditCard: 'all',
                        debitCard: 'all',
                      },
                      visual: {
                        style: {
                          theme: 'default'
                        }
                      }
                    }}
                    onSubmit={async ({ formData }) => {
                      return new Promise(async (resolve, reject) => {
                        try {
                          const { data: result } = await api.post('/payments/process', {
                            ...formData,
                            contract_id: contractId,
                            tracking_code: trackingCode,
                            rut: rut,
                            billing_data: billingDataRef.current
                          }, { skipCsrf: true } as any);

                          if (result.success) {
                            resolve(undefined);

                            // Verificar el estado real del pago
                            const paymentStatus = result.data?.status;
                            const isCustomDoc = contractDetails?.is_custom_document;

                            // Build URL params for custom documents
                            const customParams = isCustomDoc
                              ? `&isCustom=true&signatureType=${contractDetails?.signature_type || 'simple'}&customNotary=${contractDetails?.custom_notary || false}`
                              : '';

                            if (paymentStatus === 'approved') {
                              // Pago aprobado - unified redirect to success page
                              navigate(`/payment/success?contract_id=${contractId}&tracking_code=${trackingCode}&rut=${encodeURIComponent(rut)}&hasSigners=${hasSigners}${customParams}`);
                            } else if (paymentStatus === 'pending' || paymentStatus === 'in_process') {
                              // Pago pendiente - redirigir a página de espera
                              navigate(`/payment/pending?contract_id=${contractId}&tracking_code=${trackingCode}&rut=${encodeURIComponent(rut)}&hasSigners=${hasSigners}${customParams}`);
                            } else if (paymentStatus === 'rejected') {
                              // Pago rechazado
                              navigate(`/payment/failure?contract_id=${contractId}&tracking_code=${trackingCode}&rut=${encodeURIComponent(rut)}&hasSigners=${hasSigners}${customParams}`);
                            } else {
                              // Estado desconocido - ir a página de pendiente por seguridad
                              navigate(`/payment/pending?contract_id=${contractId}&tracking_code=${trackingCode}&rut=${encodeURIComponent(rut)}&hasSigners=${hasSigners}${customParams}`);
                            }
                          } else {
                            reject();
                            setError(result.error || 'Error procesando el pago');
                          }
                        } catch (error: any) {
                          reject();
                          setError(getErrorMessage(error));
                        }
                      });
                    }}
                    onReady={() => {
                      brickReady.current = true;
                    }}
                    onError={(error) => {
                      const errorText = typeof error === 'string' ? error : JSON.stringify(error || {});
                      const isIdentificationError = /identification|indetification|installment/i.test(errorText);

                      if (!isIdentificationError) {
                        console.error('Error en Payment Brick:', error);
                      }

                      // Auto-retry on first identification/installments error (SDK timing issue)
                      if (isIdentificationError && brickRetryCount.current < 2) {
                        brickRetryCount.current += 1;
                        setError(null);
                        setIsMpReady(false);
                        setTimeout(() => {
                          const keyToUse = mpPublicKey || mercadoPagoConfig.publicKey;
                          if (keyToUse) {
                            initMPWithKey(keyToUse);
                            mpKeyInitialized.current = keyToUse;
                          }
                          setBrickKey((prev) => prev + 1);
                          setTimeout(() => {
                            setIsMpReady(true);
                          }, 300);
                        }, 200); // Wait before reinitializing
                        return;
                      }

                      // Only show error UI if brick hasn't loaded yet
                      if (!brickReady.current) {
                        setError('Error al cargar el método de pago');
                      }
                    }}
                  />
                </div>
              ) : (
                <div className="h-40 flex items-center justify-center bg-slate-50 rounded-lg border border-dashed border-slate-300">
                  <Loader2 className="w-6 h-6 text-slate-400 animate-spin mr-2" />
                  <p className="text-slate-400 text-sm font-sans">Cargando pasarela de pago...</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentPage;
