import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Package, XCircle, FileText, Users, AlertCircle, Scale, Copy, ArrowRight, CheckCircle2, Circle, ChevronDown, ChevronUp } from 'lucide-react';
import api from '../../services/api';
import { Navbar } from '../../components/landing/Navbar';
import { PageFooter } from '../../components/shared/PageFooter';
import { formatRut, isValidRut } from '../../utils/validators';

interface Signer {
  id: number;
  full_name: string;
  role: string;
  has_signed: boolean;
  signed_at: string | null;
}

interface ContractStatus {
  tracking_code: string;
  status: string;
  total_amount: number;
  requires_notary: boolean;
  signers: Signer[];
  created_at: string;
  is_custom_document?: boolean;
}

const STEPS = [
  { id: 'payment', label: 'Pago' },
  { id: 'draft', label: 'Borrador' },
  { id: 'signatures', label: 'Firmando' },
  { id: 'completed', label: 'Completado' }
];

const getStepStatus = (stepId: string, currentStatus: string) => {
  const statusProgression: Record<string, number> = {
    'pending_payment': 0,
    'draft': 1,
    'waiting_signatures': 2,
    'waiting_notary': 2,
    'completed': 3
  };

  const stepIndices: Record<string, number> = {
    'payment': 0,
    'draft': 1,
    'signatures': 2,
    'completed': 3
  };

  const currentProgression = statusProgression[currentStatus] ?? -1;
  const stepIndex = stepIndices[stepId];

  if (currentStatus === 'failed' || currentStatus === 'cancelled') return 'error';

  if (currentProgression > stepIndex) return 'completed';
  if (currentProgression === stepIndex) return 'current';
  return 'waiting';
};

const getStatusDescription = (status: string) => {
  const map: Record<string, string> = {
    pending_payment: 'Esperando confirmación del pago para proceder.',
    draft: 'El documento está en borrador. Completa los datos para proceder a las firmas.',
    waiting_signatures: 'Esperando que todas las partes firmen el documento.',
    waiting_notary: 'El notario está revisando y firmando el documento.',
    completed: 'El proceso ha finalizado con éxito. Documento legalmente válido.',
    failed: 'El proceso ha fallado o ha sido cancelado.',
    cancelled: 'El proceso ha sido anulado.'
  };
  return map[status] || 'Estado actual del documento.';
};

export function TrackingPage() {
  const navigate = useNavigate();
  const [trackingCode, setTrackingCode] = useState('');
  const [contractData, setContractData] = useState<ContractStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);
  const [showRutForm, setShowRutForm] = useState(false);
  const [buyerRut, setBuyerRut] = useState('');
  const [rutError, setRutError] = useState('');
  const [showDetails, setShowDetails] = useState(true);
  const [copied, setCopied] = useState(false);

  const handleContinueEditing = () => {
    if (!contractData) return;
    setRutError('');

    if (!buyerRut || !isValidRut(buyerRut)) {
      setRutError('Por favor ingresa un RUT válido');
      return;
    }

    const cleanRut = buyerRut.replace(/[.-]/g, '');
    const url = `/resume?code=${contractData.tracking_code}&rut=${encodeURIComponent(cleanRut)}`;
    navigate(url);
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!trackingCode.trim()) {
      setError('Por favor ingresa un código de seguimiento');
      return;
    }

    setLoading(true);
    setError('');
    setContractData(null);
    setSearched(true);

    try {
      const response = await api.get(
        `/contracts/track/${trackingCode.trim().toUpperCase()}`
      );

      if (response.data.success) {
        setContractData(response.data.data);
      } else {
        // Try searching in custom documents
        try {
          const customResponse = await api.get(
            `/custom-documents/${trackingCode.trim().toUpperCase()}/status`
          );
          if (customResponse.data.success) {
            // Redirect to custom document status page
            navigate(`/documento-personalizado/estado/${trackingCode.trim().toUpperCase()}`);
            return;
          }
        } catch {
          // If custom document not found either, show error
        }
        setError('No se encontró el contrato');
      }
    } catch (err: any) {
      if (err.response?.status === 404) {
        // Try searching in custom documents
        try {
          const customResponse = await api.get(
            `/custom-documents/${trackingCode.trim().toUpperCase()}/status`
          );
          if (customResponse.data.success) {
            // Redirect to custom document status page
            navigate(`/documento-personalizado/estado/${trackingCode.trim().toUpperCase()}`);
            return;
          }
        } catch {
          // If custom document not found either, show error
        }
        setError('No se encontró ningún contrato con ese código de seguimiento');
      } else {
        setError('Error al buscar el contrato. Por favor intenta nuevamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (contractData?.tracking_code) {
      navigator.clipboard.writeText(contractData.tracking_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="flex flex-col bg-slate-50">
      <Navbar />

      <main className="min-h-screen w-full max-w-6xl mx-auto px-6 py-12">

        {/* Page Header */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-serif font-bold text-navy-900 mb-3">
            Rastrear Contrato
          </h1>
          <p className="text-slate-600 text-lg font-sans max-w-2xl mx-auto">
            Consulta el estado de tu documento legal en tiempo real
          </p>
        </div>

        {/* Search Box */}
        <div className="bg-white rounded-lg shadow-document border border-slate-200 p-2 mb-8">
          <form onSubmit={handleSearch} className="flex items-center">
            <div className="pl-4 text-slate-400">
              <Search className="w-5 h-5" />
            </div>
            <input
              type="text"
              value={trackingCode}
              onChange={(e) => setTrackingCode(e.target.value.toUpperCase())}
              placeholder="Ingresa tu código de seguimiento (ej: CNT-123)"
              className="flex-1 px-4 py-3 bg-transparent outline-none text-navy-900 placeholder-slate-400 w-full uppercase font-mono"
            />
            <button
              type="submit"
              disabled={loading}
              className="bg-navy-900 text-white px-6 py-2.5 rounded-md font-medium font-sans hover:bg-navy-800 transition-colors disabled:opacity-50"
            >
              {loading ? 'Buscando...' : 'Rastrear'}
            </button>
          </form>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 text-red-700 p-4 rounded-lg border border-red-200 flex items-center gap-3 mb-8">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p className="font-sans text-sm">{error}</p>
          </div>
        )}

        {/* Results Card */}
        {contractData && (
          <div className="bg-white rounded-lg shadow-document border border-slate-200 overflow-hidden">

            {/* Card Header with Navy Accent */}
            <div className="border-t-4 border-t-navy-900 p-6 border-b border-slate-100">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-navy-900 rounded-lg flex items-center justify-center">
                    <Scale className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-serif font-bold text-navy-900 text-lg">Contrato Seguro</h3>
                    <div className="flex items-center gap-2 text-sm text-slate-500 font-sans">
                      <span className="font-mono">{contractData.tracking_code}</span>
                      <button
                        onClick={copyToClipboard}
                        className="hover:text-navy-700 transition-colors p-1 rounded-md hover:bg-slate-100"
                        title="Copiar código"
                      >
                        {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-legal-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>
                {(contractData.status === 'draft') && (
                  <button
                    onClick={() => setShowRutForm(true)}
                    className="bg-navy-900 text-white px-4 py-2 rounded-md text-sm font-medium font-sans hover:bg-navy-800 transition-colors flex items-center gap-2"
                  >
                    Continuar editando
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Status Section */}
            <div className="p-8">
              <div className="mb-8">
                <p className="text-slate-600 text-sm mb-6 font-sans">
                  {getStatusDescription(contractData.status)}
                </p>

                {/* Progress Bar */}
                <div className="relative mb-12 px-4">
                  <div className="absolute top-1/2 left-0 right-0 h-1 bg-slate-100 -translate-y-1/2 rounded-full"></div>
                  <div
                    className="absolute top-1/2 left-0 h-1 bg-legal-emerald-500 -translate-y-1/2 rounded-full transition-all duration-1000"
                    style={{ width: `${(Math.max(0, STEPS.findIndex(s => getStepStatus(s.id, contractData.status) === 'current')) / (STEPS.length - 1)) * 100}%` }}
                  />

                  <div className="relative flex justify-between">
                    {STEPS.map((step) => {
                      const status = getStepStatus(step.id, contractData.status);
                      const isCompleted = status === 'completed';
                      const isCurrent = status === 'current';
                      const isError = status === 'error';

                      return (
                        <div key={step.id} className="flex flex-col items-center gap-2 relative">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center border-4 transition-colors z-10 bg-white
                            ${isCompleted ? 'bg-legal-emerald-500 border-legal-emerald-500 text-white' :
                              isCurrent ? 'bg-white border-legal-emerald-500 text-legal-emerald-500' :
                                isError ? 'bg-red-500 border-red-500 text-white' :
                                  'bg-slate-50 border-slate-200 text-slate-300'}
                          `}>
                            {isCompleted ? <CheckCircle2 className="w-4 h-4" /> :
                              isError ? <XCircle className="w-4 h-4" /> :
                                <Circle className="w-4 h-4 fill-current" />}
                          </div>
                          <span className={`text-xs font-medium font-sans absolute -bottom-6 w-max ${isCurrent ? 'text-navy-900' : 'text-slate-400'} hidden sm:block`}>
                            {step.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Detail Sections */}
              <div className="border rounded-lg border-slate-200 divide-y divide-slate-100 mt-6">

                {/* Timeline Toggle */}
                <button
                  onClick={() => setShowDetails(!showDetails)}
                  className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors"
                >
                  <span className="font-semibold text-navy-900 text-sm font-sans">Detalles del Proceso</span>
                  {showDetails ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                </button>

                {showDetails && (
                  <div className="p-4 space-y-6 bg-slate-50">

                    {/* Signers Info */}
                    <div>
                      <h4 className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 font-sans">
                        <Users className="w-3 h-3" /> Firmantes
                      </h4>
                      <div className="space-y-3 pl-2 border-l-2 border-slate-200 ml-1">
                        {contractData.signers?.map((signer) => (
                          <div key={signer.id} className="flex items-start gap-3 ml-3 relative">
                            <div className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${signer.has_signed ? 'bg-legal-emerald-500' : 'bg-slate-300'}`}></div>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-navy-900 font-sans">{signer.full_name}</p>
                              <p className="text-xs text-slate-500 capitalize font-sans">{signer.role === 'buyer' ? 'Comprador' : signer.role === 'seller' ? 'Vendedor' : signer.role}</p>
                              {signer.has_signed && (
                                <span className="inline-flex items-center gap-1 mt-1 text-xs text-legal-emerald-700 bg-legal-emerald-50 px-2 py-0.5 rounded font-sans">
                                  <CheckCircle2 className="w-3 h-3" /> Firmado {signer.signed_at && `el ${new Date(signer.signed_at).toLocaleDateString('es-CL')}`}
                                </span>
                              )}
                            </div>
                          </div>
                        )) || <p className="text-sm text-slate-500 ml-3 font-sans">No hay firmantes registrados</p>}
                      </div>
                    </div>

                    {/* Contract Info */}
                    <div>
                      <h4 className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 font-sans">
                        <FileText className="w-3 h-3" /> Documento
                      </h4>
                      <div className="bg-white p-3 rounded-lg border border-slate-200 ml-1">
                        <div className="flex justify-between items-center text-sm mb-2 border-b border-slate-100 pb-2 font-sans">
                          <span className="text-slate-500">Creación</span>
                          <span className="text-navy-900 font-medium">{contractData.created_at ? new Date(contractData.created_at).toLocaleDateString('es-CL') : 'Fecha no disponible'}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm font-sans">
                          <span className="text-slate-500">Notario</span>
                          <span className="text-navy-900 font-medium">{contractData.requires_notary ? 'Requerido' : 'No requerido'}</span>
                        </div>
                      </div>
                    </div>

                  </div>
                )}
              </div>

            </div>
          </div>
        )}

        {/* Empty State */}
        {searched && !contractData && !loading && !error && (
          <div className="bg-white rounded-lg shadow-document border border-slate-200 p-12 text-center">
            <Package className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <p className="text-navy-900 font-medium font-sans">No se encontraron resultados</p>
            <p className="text-slate-500 text-sm mt-1 font-sans">Verifica el código de seguimiento e inténtalo nuevamente</p>
          </div>
        )}

        {/* Help Section */}
        <div className="mt-8 bg-white rounded-lg shadow-document border border-slate-200 p-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="font-serif font-bold text-navy-900 mb-1">¿Necesitas ayuda con tu contrato?</h3>
            <p className="text-slate-500 text-sm font-sans">Nuestro equipo de soporte está disponible para asistirte</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => navigate('/ayuda')}
              className="px-4 py-2 text-sm font-medium font-sans text-navy-900 bg-slate-100 rounded-md hover:bg-slate-200 transition-colors"
            >
              Ver centro de ayuda
            </button>
          </div>
        </div>

      </main>

      <PageFooter />

      {/* RUT Modal */}
      {showRutForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-lg shadow-document-hover max-w-md w-full p-6">
            <h3 className="text-xl font-serif font-bold text-navy-900 mb-4">Verificación de seguridad</h3>
            <p className="text-slate-600 mb-6 text-sm font-sans">
              Para retomar la edición del contrato, por favor verifica tu identidad ingresando tu RUT.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-navy-900 mb-1 font-sans">
                  RUT del Usuario
                </label>
                <input
                  type="text"
                  value={buyerRut}
                  onChange={(e) => {
                    setBuyerRut(formatRut(e.target.value));
                    setRutError('');
                  }}
                  placeholder="12.345.678-9"
                  className={`w-full p-3 bg-slate-50 border rounded-md outline-none focus:ring-2 transition-all font-sans ${rutError
                    ? 'border-red-300 focus:ring-red-100'
                    : 'border-slate-200 focus:ring-navy-100 focus:border-navy-900'
                    }`}
                />
                {rutError && (
                  <p className="mt-1 text-sm text-red-600 flex items-center gap-1 font-sans">
                    <AlertCircle className="w-4 h-4" />
                    {rutError}
                  </p>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowRutForm(false)}
                  className="flex-1 px-4 py-3 text-slate-600 font-medium font-sans hover:bg-slate-50 rounded-md transition-colors border border-slate-200"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleContinueEditing}
                  className="flex-1 px-4 py-3 bg-navy-900 text-white font-medium font-sans rounded-md hover:bg-navy-800 transition-colors"
                >
                  Continuar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
