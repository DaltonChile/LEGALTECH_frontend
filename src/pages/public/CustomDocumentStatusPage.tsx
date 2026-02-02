import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { 
  FileText, 
  Users, 
  Check, 
  Clock, 
  CreditCard,
  AlertCircle,
  Loader2,
  Download,
  RefreshCw,
  Shield,
  PenTool,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { Navbar } from '../../components/landing/Navbar';
import { PageFooter } from '../../components/shared/PageFooter';
import customDocumentService from '../../services/customDocumentService';
import type { CustomDocumentStatus } from '../../services/customDocumentService';

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode; description: string }> = {
  pending_payment: {
    label: 'Pendiente de pago',
    color: 'yellow',
    icon: <CreditCard className="w-4 h-4" />,
    description: 'El documento está esperando el pago para iniciar el proceso.'
  },
  waiting_signatures: {
    label: 'Esperando firmas',
    color: 'blue',
    icon: <PenTool className="w-4 h-4" />,
    description: 'Los firmantes han recibido una invitación por email para firmar el documento.'
  },
  waiting_notary: {
    label: 'En revisión notarial',
    color: 'purple',
    icon: <Shield className="w-4 h-4" />,
    description: 'Todas las firmas están completas. El documento está siendo revisado por un notario.'
  },
  completed: {
    label: 'Completado',
    color: 'green',
    icon: <CheckCircle2 className="w-4 h-4" />,
    description: 'El documento ha sido procesado y está listo para descargar.'
  },
  failed: {
    label: 'Error',
    color: 'red',
    icon: <XCircle className="w-4 h-4" />,
    description: 'Hubo un problema con el proceso. Contacta soporte para más información.'
  }
};

export function CustomDocumentStatusPage() {
  const { trackingCode } = useParams<{ trackingCode: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [document, setDocument] = useState<CustomDocumentStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [rutInput, setRutInput] = useState('');
  const [showRutForm, setShowRutForm] = useState(false);

  // Check if redirected from payment
  const fromPayment = searchParams.get('payment') === 'success';
  
  // Get RUT from query params or localStorage
  const rutFromQuery = searchParams.get('rut');
  const [buyerRut, setBuyerRut] = useState<string | null>(
    rutFromQuery || localStorage.getItem(`custom_doc_rut_${trackingCode}`)
  );

  useEffect(() => {
    if (trackingCode && buyerRut) {
      localStorage.setItem(`custom_doc_rut_${trackingCode}`, buyerRut);
      loadDocumentStatus();
    } else if (trackingCode && !buyerRut) {
      setShowRutForm(true);
      setLoading(false);
    }
  }, [trackingCode, buyerRut]);

  const loadDocumentStatus = async () => {
    if (!buyerRut) {
      setShowRutForm(true);
      setLoading(false);
      return;
    }
    
    try {
      setError(null);
      const data = await customDocumentService.getCustomDocumentStatus(trackingCode!, buyerRut);
      setDocument(data);
    } catch (err: any) {
      console.error('Error loading document status:', err);
      const errorData = err.response?.data?.error;
      if (typeof errorData === 'object' && errorData !== null) {
        setError(errorData.message || 'No se pudo cargar el estado del documento');
      } else {
        setError(errorData || 'No se pudo cargar el estado del documento');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadDocumentStatus();
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadgeClasses = (color: string) => {
    const colors: Record<string, string> = {
      yellow: 'bg-yellow-50 text-yellow-700 border-yellow-200',
      blue: 'bg-blue-50 text-blue-700 border-blue-200',
      purple: 'bg-purple-50 text-purple-700 border-purple-200',
      green: 'bg-green-50 text-green-700 border-green-200',
      red: 'bg-red-50 text-red-700 border-red-200',
      slate: 'bg-slate-50 text-slate-700 border-slate-200'
    };
    return colors[color] || colors.slate;
  };

  // Handle RUT form submission
  const handleRutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (rutInput.trim()) {
      setBuyerRut(rutInput.trim());
      setShowRutForm(false);
      setLoading(true);
    }
  };

  const formatRutInput = (value: string) => {
    let rut = value.replace(/[^0-9kK]/g, '').toUpperCase();
    if (rut.length > 1) {
      const dv = rut.slice(-1);
      const body = rut.slice(0, -1);
      rut = body.replace(/\B(?=(\d{3})+(?!\d))/g, '.') + '-' + dv;
    }
    return rut;
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-navy-900 animate-spin mx-auto mb-4" />
            <p className="text-slate-600">Cargando estado del documento...</p>
          </div>
        </div>
      </div>
    );
  }

  // RUT form
  if (showRutForm || (!document && !error)) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 max-w-md w-full">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-blue-600" />
              </div>
              <h1 className="text-xl font-semibold text-slate-900 mb-2">
                Verificar documento
              </h1>
              <p className="text-slate-500 text-sm">
                Ingresa tu RUT para ver el estado del documento <span className="font-medium text-slate-700">{trackingCode}</span>
              </p>
            </div>
            <form onSubmit={handleRutSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  RUT del comprador
                </label>
                <input
                  type="text"
                  value={rutInput}
                  onChange={(e) => setRutInput(formatRutInput(e.target.value))}
                  placeholder="12.345.678-9"
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  autoFocus
                />
              </div>
              <button
                type="submit"
                disabled={!rutInput.trim()}
                className="w-full bg-slate-900 hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-400 text-white font-medium py-3 px-4 rounded-xl transition-all"
              >
                Ver estado
              </button>
            </form>
          </div>
        </div>
        <PageFooter />
      </div>
    );
  }

  // Error state
  if (error || !document) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 max-w-md w-full text-center">
            <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
            <h1 className="text-xl font-semibold text-slate-900 mb-2">
              Documento no encontrado
            </h1>
            <p className="text-slate-500 text-sm mb-6">
              {error || 'No pudimos encontrar el documento con el código proporcionado.'}
            </p>
            <div className="space-y-3">
              <button
                onClick={() => {
                  setBuyerRut(null);
                  setShowRutForm(true);
                  setError(null);
                }}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-medium py-3 px-4 rounded-xl transition-all"
              >
                Intentar con otro RUT
              </button>
              <button
                onClick={() => navigate('/seguimiento')}
                className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium py-3 px-4 rounded-xl transition-all"
              >
                Buscar otro documento
              </button>
            </div>
          </div>
        </div>
        <PageFooter />
      </div>
    );
  }

  const statusConfig = STATUS_CONFIG[document.status] || STATUS_CONFIG.pending_payment;
  const signedCount = document.signers.filter(s => s.has_signed).length;
  const totalSigners = document.signers.length;

  // Calculate step statuses
  const paymentComplete = document.payment_status === 'approved';
  const signaturesComplete = signedCount === totalSigners && totalSigners > 0;
  const notaryComplete = document.status === 'completed' && document.custom_notary;
  const documentComplete = document.status === 'completed';

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      <div className="flex-1 py-6 md:py-10">
        <div className="max-w-xl mx-auto px-4 md:px-6 space-y-4">
          
          {/* Success message from payment */}
          {fromPayment && (
            <div className="p-4 bg-green-50 border border-green-100 rounded-2xl flex items-start gap-3">
              <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                <Check className="w-3.5 h-3.5 text-green-600" />
              </div>
              <div>
                <p className="font-medium text-green-800">¡Pago realizado con éxito!</p>
                <p className="text-sm text-green-600">
                  {document.signature_type !== 'none' 
                    ? 'Los firmantes recibirán un email con las instrucciones para firmar.'
                    : 'Tu documento será revisado por un notario.'}
                </p>
              </div>
            </div>
          )}

          {/* Main Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 md:p-6">
            {/* Header */}
            <div className="flex items-start justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 bg-slate-100 rounded-xl flex items-center justify-center">
                  <FileText className="w-5 h-5 text-slate-600" />
                </div>
                <div>
                  <h1 className="text-lg font-semibold text-slate-900">
                    Documento personalizado
                  </h1>
                  <p className="text-sm text-slate-500">
                    Código: {document.tracking_code}
                  </p>
                </div>
              </div>
              
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="w-9 h-9 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all"
                title="Actualizar estado"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {/* Status badge */}
            <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm font-medium ${getStatusBadgeClasses(statusConfig.color)}`}>
              {statusConfig.icon}
              <span>{statusConfig.label}</span>
            </div>
            <p className="mt-3 text-sm text-slate-500">{statusConfig.description}</p>
          </div>

          {/* Progress Timeline */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 md:p-6">
            <h2 className="text-sm font-semibold text-slate-900 mb-5">Progreso del documento</h2>
            
            <div className="space-y-0">
              {/* Step 1: Document Created */}
              <TimelineStep
                title="Documento creado"
                subtitle={formatDate(document.created_at)}
                status="completed"
                isLast={false}
              />

              {/* Step 2: Payment */}
              <TimelineStep
                title={paymentComplete ? 'Pago completado' : 'Pago pendiente'}
                subtitle={formatPrice(document.total_amount)}
                status={paymentComplete ? 'completed' : 'pending'}
                isLast={document.signature_type === 'none' && !document.custom_notary}
              />

              {/* Step 3: Signatures (if applicable) */}
              {document.signature_type !== 'none' && (
                <TimelineStep
                  title={signaturesComplete ? 'Firmas completadas' : `Firmas: ${signedCount} de ${totalSigners}`}
                  subtitle={signaturesComplete ? 'Todos los firmantes han firmado' : 'Esperando firmas de los participantes'}
                  status={
                    signaturesComplete ? 'completed' : 
                    signedCount > 0 ? 'in-progress' : 
                    paymentComplete ? 'pending' : 'waiting'
                  }
                  isLast={!document.custom_notary}
                />
              )}

              {/* Step 4: Notary (if applicable) */}
              {document.custom_notary && (
                <TimelineStep
                  title="Revisión notarial"
                  subtitle={
                    notaryComplete ? 'Visación completada' :
                    document.status === 'waiting_notary' ? 'En proceso de revisión' :
                    'Pendiente'
                  }
                  status={
                    notaryComplete ? 'completed' :
                    document.status === 'waiting_notary' ? 'in-progress' :
                    'waiting'
                  }
                  isLast={true}
                />
              )}

              {/* Final step: Completed (only show if not notary as final) */}
              {!document.custom_notary && (
                <TimelineStep
                  title="Documento completado"
                  subtitle={documentComplete ? 'Listo para descargar' : ''}
                  status={documentComplete ? 'completed' : 'waiting'}
                  isLast={true}
                />
              )}
            </div>
          </div>

          {/* Signers (if applicable) */}
          {document.signature_type !== 'none' && document.signers.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 md:p-6">
              <h2 className="text-sm font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <Users className="w-4 h-4 text-slate-500" />
                Firmantes
              </h2>
              
              <div className="space-y-2">
                {document.signers.map((signer, index) => (
                  <div 
                    key={index}
                    className="flex items-center justify-between p-3 bg-slate-50 rounded-xl"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                        signer.has_signed 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-slate-200 text-slate-500'
                      }`}>
                        {signer.has_signed ? (
                          <Check className="w-4 h-4" />
                        ) : (
                          <span>{index + 1}</span>
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-900">{signer.full_name}</p>
                        <p className="text-xs text-slate-500">{signer.email}</p>
                      </div>
                    </div>
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                      signer.has_signed
                        ? 'bg-green-100 text-green-700'
                        : 'bg-slate-200 text-slate-500'
                    }`}>
                      {signer.has_signed ? 'Firmado' : 'Pendiente'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 md:p-6">
            <h2 className="text-sm font-semibold text-slate-900 mb-4">Acciones</h2>
            
            <div className="space-y-2">
              {document.status === 'pending_payment' && (
                <button
                  onClick={() => navigate(`/payment/${document.id}?tracking_code=${document.tracking_code}&rut=${encodeURIComponent(buyerRut || '')}`)}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2"
                >
                  <CreditCard className="w-4 h-4" />
                  Continuar al pago
                </button>
              )}
              
              {document.status === 'completed' && buyerRut && (
                <a
                  href={customDocumentService.getPreviewUrl(document.tracking_code, buyerRut)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white font-medium py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Descargar documento
                </a>
              )}
              
              <button
                onClick={() => navigate('/catalogo')}
                className="w-full bg-slate-100 hover:bg-slate-200 text-slate-600 font-medium py-3 px-4 rounded-xl transition-all"
              >
                Volver al catálogo
              </button>
            </div>
          </div>
        </div>
      </div>

      <PageFooter />
    </div>
  );
}

// Timeline Step Component
interface TimelineStepProps {
  title: string;
  subtitle: string;
  status: 'completed' | 'in-progress' | 'pending' | 'waiting';
  isLast: boolean;
}

function TimelineStep({ title, subtitle, status, isLast }: TimelineStepProps) {
  const getIconAndStyles = () => {
    switch (status) {
      case 'completed':
        return {
          icon: <Check className="w-3.5 h-3.5 text-white" />,
          circle: 'bg-green-500 border-green-500',
          line: 'bg-green-500',
          title: 'text-slate-900',
          subtitle: 'text-slate-500'
        };
      case 'in-progress':
        return {
          icon: <Clock className="w-3.5 h-3.5 text-purple-600" />,
          circle: 'bg-purple-100 border-purple-300',
          line: 'bg-slate-200',
          title: 'text-slate-900',
          subtitle: 'text-slate-500'
        };
      case 'pending':
        return {
          icon: <Clock className="w-3.5 h-3.5 text-slate-400" />,
          circle: 'bg-slate-100 border-slate-300',
          line: 'bg-slate-200',
          title: 'text-slate-500',
          subtitle: 'text-slate-400'
        };
      default: // waiting
        return {
          icon: null,
          circle: 'bg-white border-slate-300',
          line: 'bg-slate-200',
          title: 'text-slate-400',
          subtitle: 'text-slate-300'
        };
    }
  };

  const styles = getIconAndStyles();

  return (
    <div className="relative flex gap-4">
      {/* Timeline line and circle */}
      <div className="flex flex-col items-center">
        <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center shrink-0 ${styles.circle}`}>
          {styles.icon}
        </div>
        {!isLast && (
          <div className={`w-0.5 flex-1 min-h-[24px] ${styles.line}`} />
        )}
      </div>

      {/* Content */}
      <div className={`pb-6 ${isLast ? 'pb-0' : ''}`}>
        <p className={`text-sm font-medium ${styles.title}`}>{title}</p>
        {subtitle && (
          <p className={`text-xs mt-0.5 ${styles.subtitle}`}>{subtitle}</p>
        )}
      </div>
    </div>
  );
}

export default CustomDocumentStatusPage;
