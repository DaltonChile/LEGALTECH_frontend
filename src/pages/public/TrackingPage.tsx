import { useState } from 'react';
import { Search, Package, Clock, CheckCircle, XCircle, FileText, Users, AlertCircle } from 'lucide-react';
import axios from 'axios';
import { Navbar } from '../../components/landing/Navbar';

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
}

const STATUS_CONFIG = {
  draft: {
    label: 'Borrador',
    color: 'slate',
    bgGradient: 'bg-gradient-to-r from-slate-600 to-slate-500',
    icon: FileText,
    description: 'El contrato está en proceso de creación'
  },
  pending_payment: {
    label: 'Pendiente de Pago',
    color: 'amber',
    bgGradient: 'bg-gradient-to-r from-amber-600 to-amber-500',
    icon: Clock,
    description: 'Esperando confirmación de pago'
  },
  paid: {
    label: 'Pagado',
    color: 'emerald',
    bgGradient: 'bg-gradient-to-r from-emerald-600 to-emerald-500',
    icon: CheckCircle,
    description: 'El pago ha sido confirmado, esperando firmas'
  },
  pending_signatures: {
    label: 'Pendiente de Firmas',
    color: 'blue',
    bgGradient: 'bg-gradient-to-r from-blue-600 to-blue-500',
    icon: Users,
    description: 'El contrato está esperando las firmas de las partes'
  },
  pending_notary: {
    label: 'Pendiente de Notario',
    color: 'purple',
    bgGradient: 'bg-gradient-to-r from-purple-600 to-purple-500',
    icon: AlertCircle,
    description: 'Esperando revisión y firma del notario'
  },
  completed: {
    label: 'Completado',
    color: 'green',
    bgGradient: 'bg-gradient-to-r from-green-600 to-green-500',
    icon: CheckCircle,
    description: 'El contrato ha sido firmado por todas las partes'
  },
  cancelled: {
    label: 'Cancelado',
    color: 'red',
    bgGradient: 'bg-gradient-to-r from-red-600 to-red-500',
    icon: XCircle,
    description: 'El contrato ha sido cancelado'
  }
};

export function TrackingPage() {
  const [trackingCode, setTrackingCode] = useState('');
  const [contractData, setContractData] = useState<ContractStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);

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
      console.log('🔍 Buscando contrato con código:', trackingCode.trim().toUpperCase());
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/contracts/track/${trackingCode.trim().toUpperCase()}`
      );

      console.log('📦 Respuesta recibida:', response.data);

      if (response.data.success) {
        console.log('✅ Contrato encontrado:', response.data.data);
        console.log('📊 Status del contrato:', response.data.data.status);
        console.log('👥 Firmantes:', response.data.data.signers);
        setContractData(response.data.data);
      } else {
        console.log('❌ No se encontró el contrato');
        setError('No se encontró el contrato');
      }
    } catch (err: any) {
      console.error('💥 Error fetching contract:', err);
      console.error('💥 Error response:', err.response?.data);
      if (err.response?.status === 404) {
        setError('No se encontró ningún contrato con ese código de seguimiento');
      } else {
        setError('Error al buscar el contrato. Por favor intenta nuevamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  const statusConfig = contractData ? STATUS_CONFIG[contractData.status as keyof typeof STATUS_CONFIG] : null;
  const StatusIcon = statusConfig?.icon || Package;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-cyan-50/30 to-lime-50/30">
      <Navbar />

      {/* Background Decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-0 w-[500px] h-[500px] bg-gradient-to-br from-blue-400/10 to-lime-400/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-gradient-to-tr from-cyan-400/10 to-emerald-400/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative max-w-4xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-2xl mb-4 shadow-lg">
            <Package className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-slate-900 mb-3 py-4">
            Seguimiento de Contrato
          </h1>
          <p className="text-slate-600 text-lg py-4">
            Ingresa tu código de seguimiento para ver el estado de tu contrato
          </p>
        </div>

        {/* Search Form */}
        <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 p-8 mb-8">
          <form onSubmit={handleSearch} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2 py-4">
                Código de Seguimiento
              </label>
              <div className="relative py-4">
                <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 py-4" />
                <input
                  type="text"
                  value={trackingCode}
                  onChange={(e) => setTrackingCode(e.target.value.toUpperCase())}
                  placeholder="Ej: ABC123"
                  className="w-full pl-12 pr-4 py-4 text-lg border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
                  maxLength={6}
                />
              </div>
              <p className="text-sm text-slate-500 mt-2 py-4">
                El código de seguimiento tiene 6 caracteres (letras y números)
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold py-4 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Buscando...
                </>
              ) : (
                <>
                  <Search className="w-5 h-5" />
                  Buscar Contrato
                </>
              )}
            </button>
          </form>

          {error && (
            <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {loading && (
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-3">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
              <p className="text-blue-700">Buscando contrato con código: <span className="font-mono font-bold">{trackingCode}</span></p>
            </div>
          )}
        </div>

        {/* Contract Status */}
        {contractData && (
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            {/* Status Header */}
            <div className={`${statusConfig?.bgGradient || 'bg-gradient-to-r from-blue-600 to-blue-500'} p-6`}>
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                  <StatusIcon className="w-7 h-7 text-white" />
                </div>
                <div className="flex-1">
                  <div className="text-white/80 text-sm mb-1">Estado del Contrato</div>
                  <div className="text-white font-bold text-2xl">{statusConfig?.label || contractData.status}</div>
                </div>
                <div className="text-right">
                  <div className="text-white/80 text-sm">Código de seguimiento</div>
                  <div className="text-white font-mono font-bold text-xl">{contractData.tracking_code}</div>
                </div>
              </div>
              <p className="text-white/90 mt-3">{statusConfig?.description || 'Información del contrato'}</p>
            </div>

            {/* Contract Details */}
            <div className="p-6 space-y-6">
              {/* General Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 rounded-lg p-4">
                  <div className="text-sm text-slate-600 mb-1">Monto Total</div>
                  <div className="text-2xl font-bold text-slate-900">
                    ${contractData.total_amount.toLocaleString('es-CL')}
                  </div>
                </div>
                <div className="bg-slate-50 rounded-lg p-4">
                  <div className="text-sm text-slate-600 mb-1">Fecha de Creación</div>
                  <div className="text-lg font-semibold text-slate-900">
                    {new Date(contractData.created_at).toLocaleDateString('es-CL', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </div>
                </div>
              </div>

              {/* Notary Info */}
              {contractData.requires_notary && (
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold text-purple-900 mb-1">Requiere Notario</div>
                    <div className="text-sm text-purple-700">
                      Este contrato requiere revisión y firma de un notario público
                    </div>
                  </div>
                </div>
              )}

              {/* Signers Status */}
              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Firmantes ({contractData.signers?.filter(s => s.has_signed).length || 0}/{contractData.signers?.length || 0})
                </h3>
                {contractData.signers && contractData.signers.length > 0 ? (
                  <div className="space-y-3">
                    {contractData.signers.map((signer) => (
                      <div
                        key={signer.id}
                        className={`flex items-center gap-4 p-4 rounded-lg border-2 transition-all ${
                          signer.has_signed
                            ? 'bg-green-50 border-green-200'
                            : 'bg-slate-50 border-slate-200'
                        }`}
                      >
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                          signer.has_signed ? 'bg-green-500' : 'bg-slate-300'
                        }`}>
                          {signer.has_signed ? (
                            <CheckCircle className="w-6 h-6 text-white" />
                          ) : (
                            <Clock className="w-6 h-6 text-white" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="font-semibold text-slate-900">{signer.full_name}</div>
                          <div className="text-sm text-slate-600">{signer.role}</div>
                        </div>
                        <div className="text-right">
                          {signer.has_signed ? (
                            <>
                              <div className="text-sm font-medium text-green-700">Firmado</div>
                              {signer.signed_at && (
                                <div className="text-xs text-green-600">
                                  {new Date(signer.signed_at).toLocaleDateString('es-CL')}
                                </div>
                              )}
                            </>
                          ) : (
                            <div className="text-sm font-medium text-slate-500">Pendiente</div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-center text-slate-600">
                    No hay firmantes registrados
                  </div>
                )}
              </div>

              {/* Timeline or Next Steps */}
              {contractData.status !== 'completed' && contractData.status !== 'cancelled' && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="font-semibold text-blue-900 mb-2">Próximos Pasos</div>
                  <div className="text-sm text-blue-700">
                    {contractData.status === 'draft' && 'Completa y paga el contrato para continuar con el proceso.'}
                    {contractData.status === 'pending_payment' && 'Completa el pago para avanzar al proceso de firmas.'}
                    {contractData.status === 'paid' && 'El pago ha sido confirmado. Espera a que todas las partes firmen el contrato.'}
                    {contractData.status === 'pending_signatures' && 'Espera a que todas las partes firmen el contrato.'}
                    {contractData.status === 'pending_notary' && 'El notario revisará y firmará el contrato.'}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Empty State */}
        {searched && !contractData && !loading && !error && (
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 p-12 text-center">
            <Package className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-600">No se encontraron resultados</p>
          </div>
        )}
      </div>
    </div>
  );
}
