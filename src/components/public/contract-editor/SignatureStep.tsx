import { useEffect, useState } from 'react';
import { 
  FileSignature, 
  Mail, 
  Clock, 
  Scale, 
  Copy, 
  ArrowRight,
  CheckCircle2,
  Circle,
  AlertCircle,
  Gavel
} from 'lucide-react';
import axios from 'axios';
import { EditorHeader } from './EditorHeader';
import { getWaitingState, type SignatureType } from '../../../utils/flowConfig';

interface SignatureStepProps {
  contractId: string;
  trackingCode: string;
  steps: { id: string; label: string }[];
  requiresNotary?: boolean;
  signatureType?: SignatureType;
}

interface Signer {
  id: string;
  full_name: string;
  email: string;
  rut: string;
  role: string;
  has_signed: boolean;
  signature_url: string | null;
  validafirma_signer_id: string | null;
}

interface ContractStatus {
  id: string;
  tracking_code: string;
  status: string;
  validafirma_document_id: string | null;
  validafirma_status: string | null;
  signature_type: string;
  signers: Signer[];
}

export function SignatureStep({ 
  contractId, 
  trackingCode, 
  steps,
  requiresNotary = false,
  signatureType = 'simple'
}: SignatureStepProps) {
  const [contractStatus, setContractStatus] = useState<ContractStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Obtener el estado de espera basado en la configuración
  const waitingState = getWaitingState(signatureType, requiresNotary);

  useEffect(() => {
    loadContractStatus();
    // Poll every 30 seconds for status updates
    const interval = setInterval(loadContractStatus, 30000);
    return () => clearInterval(interval);
  }, [contractId]);

  const loadContractStatus = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/contracts/${contractId}/status`
      );
      setContractStatus(response.data.data);
      setLoading(false);
    } catch (err: any) {
      console.error('Error loading contract status:', err);
      setError(err.response?.data?.error || 'Error al cargar estado del contrato');
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(trackingCode);
  };

  // Detectar si solo hay notario
  const hasOnlyNotary = contractStatus?.signers?.length === 1 && 
                        contractStatus?.signers[0]?.role === 'notary';

  // Status helpers - usar waitingState para mostrar mensaje apropiado
  const getStatusDescription = (status: string) => {
    if (status === 'waiting_signatures') {
      // Usar el estado de espera calculado
      return waitingState.description;
    }
    
    if (status === 'waiting_notary') {
      return 'Todas las firmas han sido completadas. Esperando validación del notario.';
    }
    
    const map: Record<string, string> = {
      signed: 'Documento firmado. Finalizando proceso...',
      completed: '¡Documento completado exitosamente!',
      rejected: 'Firma rechazada por una de las partes.',
      expired: 'El plazo para firmar el documento ha expirado.',
    };
    return map[status] || 'Estado actual del documento.';
  };

  const getStatusBadge = () => {
    const status = contractStatus?.status;
    
    if (status === 'waiting_signatures') {
      return {
        text: waitingState.title,
        bgColor: 'bg-blue-50',
        textColor: 'text-blue-700',
        icon: Clock
      };
    }
    
    if (status === 'waiting_notary') {
      return {
        text: 'Esperando Notario',
        bgColor: 'bg-amber-50',
        textColor: 'text-amber-700',
        icon: Gavel
      };
    }
    
    if (status === 'signed' || status === 'completed') {
      return {
        text: 'Completado',
        bgColor: 'bg-green-50',
        textColor: 'text-green-700',
        icon: CheckCircle2
      };
    }
    
    return {
      text: 'En proceso',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-700',
      icon: Clock
    };
  };

  if (loading) {
    return (
      <div className="h-full flex flex-col bg-slate-50 relative">
        <EditorHeader steps={steps} currentStep="signatures" />
        <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900 mx-auto"></div>
            <p className="mt-4 text-slate-600">Cargando información del contrato...</p>
            </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex flex-col bg-slate-50 relative">
         <EditorHeader steps={steps} currentStep="signatures" />
         <div className="flex-1 flex items-center justify-center p-6">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 max-w-md w-full text-center">
                <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <AlertCircle className="w-8 h-8 text-red-500" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Error al cargar</h3>
                <p className="text-slate-600 mb-6">{error}</p>
                <button onClick={loadContractStatus} className="text-blue-600 font-medium hover:underline">Reintentar</button>
            </div>
         </div>
      </div>
    );
  }

  if (!contractStatus) {
    return null;
  }

  return (
    <div className="h-full flex flex-col bg-slate-50 relative">
       {/* Background Grid */}
      <div className="fixed inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none"></div>

      <EditorHeader 
        steps={steps} 
        currentStep="signatures"
        // Note: onBack is deliberately omitted here to remove the "Volver" button
        rightAction={
             <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 text-green-700 rounded-lg border border-green-200 animate-pulse">
                <Circle className="w-2.5 h-2.5 fill-current" />
                <span className="text-xs font-bold">EN VIVO</span>
             </div>
        }
      />
      
      <div className="flex-1 overflow-y-auto min-h-0 container-snap">
        <div className="max-w-4xl mx-auto p-8 relative z-10 space-y-8">
            
            {/* Main Result Card - Tracking Style */}
            <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden animate-fade-in-up">
              
              {/* Card Header */}
              <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
                    <Scale className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-lg">LegalTech Signature</h3>
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                      <span>Ref: {trackingCode}</span>
                      <button onClick={copyToClipboard} className="hover:text-blue-600 transition-colors p-1 rounded-md hover:bg-slate-50" title="Copiar código">
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
                
                {/* Status Badge */}
                {(() => {
                  const badge = getStatusBadge();
                  const BadgeIcon = badge.icon;
                  return (
                    <div className={`px-4 py-2 ${badge.bgColor} ${badge.textColor} rounded-full text-sm font-medium flex items-center gap-2`}>
                      <BadgeIcon className="w-4 h-4" />
                      {badge.text}
                    </div>
                  );
                })()}
              </div>

              {/* Content Section */}
              <div className="p-8">
                  {/* Notary indicator if applicable */}
                  {requiresNotary && (
                    <div className="mb-6 p-4 bg-amber-50 rounded-xl border border-amber-100 flex items-start gap-3">
                      <Gavel className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-semibold text-amber-900 text-sm">Este contrato requiere notario</h4>
                        <p className="text-amber-700 text-xs mt-1">
                          Una vez completadas las firmas, el documento será enviado al notario para su validación oficial.
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="mb-8">
                     <h4 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-2">Estado del proceso</h4>
                     <p className="text-slate-500">
                        {getStatusDescription(contractStatus.status)}
                     </p>
                  </div>

                  {/* Tracking Info Alert */}
                  <div className="bg-slate-50 rounded-xl p-6 mb-8 border border-slate-100">
                    <h3 className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
                        <Mail className="w-5 h-5 text-slate-500" />
                        Guarda tu código de seguimiento
                    </h3>
                    <p className="text-slate-600 text-sm mb-4">
                        Podrás consultar el estado de las firmas en cualquier momento utilizando este código en nuestra página de seguimiento.
                    </p>
                    <div className="bg-white p-4 rounded-lg border border-slate-200 flex items-center justify-between">
                        <code className="text-xl font-mono text-slate-800 font-bold">{trackingCode}</code>
                        <button onClick={copyToClipboard} className="text-blue-600 font-medium text-sm hover:underline">
                            Copiar
                        </button>
                    </div>
                  </div>

                  {/* Signers List */}
                  <div>
                    <h4 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                        <FileSignature className="w-4 h-4" />
                        {hasOnlyNotary ? 'Notario' : `Firmantes (${contractStatus.signers.filter(s => s.role !== 'notary').length})`}
                    </h4>

                    <div className="space-y-3">
                        {contractStatus.signers.map((signer, index) => (
                        <div
                            key={signer.id}
                            className="flex items-center justify-between p-4 rounded-xl border border-slate-100 hover:border-slate-200 transition-colors bg-slate-50/50"
                        >
                            <div className="flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold
                                    ${signer.has_signed 
                                        ? 'bg-green-100 text-green-700' 
                                        : 'bg-slate-200 text-slate-500'
                                    }`}
                                >
                                    {signer.has_signed ? <CheckCircle2 className="w-5 h-5" /> : (index + 1)}
                                </div>
                                <div>
                                    <div className="font-semibold text-slate-900">{signer.full_name}</div>
                                    <div className="text-sm text-slate-500 flex items-center gap-2">
                                        <span>
                                          {signer.role === 'notary' ? 'Notario' : 
                                           signer.role === 'buyer' ? 'Comprador' : 'Vendedor'}
                                        </span>
                                        <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                                        <span>{signer.email}</span>
                                    </div>
                                </div>
                            </div>

                            <div>
                                {signer.has_signed ? (
                                    <span className="px-3 py-1 bg-green-50 text-green-700 text-xs font-bold rounded-full border border-green-100">
                                        FIRMADO
                                    </span>
                                ) : (
                                    <span className="px-3 py-1 bg-yellow-50 text-yellow-700 text-xs font-bold rounded-full border border-yellow-100">
                                        PENDIENTE
                                    </span>
                                )}
                            </div>
                        </div>
                        ))}
                    </div>
                  </div>
              </div>
            </div>

            {/* Actions for New Contract */}
            <div className="flex justify-center pt-4">
                <button
                    onClick={() => (window.location.href = '/')}
                    className="group flex items-center gap-3 bg-white text-slate-700 px-8 py-4 rounded-xl font-bold border-2 border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all shadow-sm hover:shadow-md"
                >
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-white border border-slate-200 transition-colors">
                        <ArrowRight className="w-4 h-4" />
                    </div>
                    <span>Comprar otro contrato</span>
                </button>
            </div>

        </div>
      </div>
    </div>
  );
}
