import { useEffect, useState } from 'react';
import { CheckCircle, FileSignature, Mail, Clock, ExternalLink } from 'lucide-react';
import axios from 'axios';

interface SignatureStepProps {
  contractId: string;
  trackingCode: string;
  onBack: () => void;
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

export function SignatureStep({ contractId, trackingCode, onBack }: SignatureStepProps) {
  const [contractStatus, setContractStatus] = useState<ContractStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const getStatusMessage = (status: string) => {
    switch (status) {
      case 'waiting_signatures':
        return 'Esperando firmas electrónicas';
      case 'signed':
        return 'Todas las firmas completadas';
      case 'rejected':
        return 'Firma rechazada';
      case 'expired':
        return 'Documento expirado';
      default:
        return 'Procesando';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'waiting_signatures':
        return 'text-blue-600 bg-blue-50';
      case 'signed':
        return 'text-green-600 bg-green-50';
      case 'rejected':
        return 'text-red-600 bg-red-50';
      case 'expired':
        return 'text-gray-600 bg-gray-50';
      default:
        return 'text-yellow-600 bg-yellow-50';
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Cargando información del contrato...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-red-600 text-5xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Error</h2>
          <p className="text-slate-600 mb-6">{error}</p>
          <button
            onClick={onBack}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Volver
          </button>
        </div>
      </div>
    );
  }

  if (!contractStatus) {
    return null;
  }

  const signatureTypeLabel =
    contractStatus.signature_type === 'simple'
      ? 'Firma Electrónica Simple (FES)'
      : 'Firma Electrónica Avanzada (FEA)';

  return (
    <div className="h-full overflow-y-auto bg-slate-50">
      <div className="max-w-4xl mx-auto p-8">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm p-8 mb-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-slate-800 mb-2">
                Firma Electrónica
              </h1>
              <p className="text-slate-600">
                Tu contrato está listo para ser firmado electrónicamente
              </p>
            </div>
            <div className="text-right">
              <div className="text-sm text-slate-500 mb-1">Código de seguimiento</div>
              <div className="text-2xl font-bold text-blue-600">{trackingCode}</div>
            </div>
          </div>

          {/* Status Badge */}
          <div className="flex items-center gap-3">
            <span
              className={`px-4 py-2 rounded-full font-medium ${getStatusColor(
                contractStatus.status
              )}`}
            >
              {getStatusMessage(contractStatus.status)}
            </span>
            <span className="px-4 py-2 rounded-full bg-slate-100 text-slate-700 font-medium">
              {signatureTypeLabel}
            </span>
          </div>
        </div>

        {/* What's Next Section */}
        <div className="bg-blue-50 border-l-4 border-blue-600 rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold text-blue-900 mb-3 flex items-center gap-2">
            <Mail className="w-5 h-5" />
            ¿Qué sucederá ahora?
          </h2>
          <ul className="space-y-2 text-blue-800">
            <li className="flex items-start gap-2">
              <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
              <span>
                Cada firmante recibirá un correo electrónico con un enlace único para firmar
                el documento
              </span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
              <span>
                Las firmas se procesarán mediante ValidaFirma, garantizando la validez legal
                del documento
              </span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
              <span>
                Una vez que todos los firmantes completen el proceso, recibirás el documento
                firmado
              </span>
            </li>
            <li className="flex items-start gap-2">
              <Clock className="w-5 h-5 mt-0.5 flex-shrink-0" />
              <span>
                El documento estará disponible para firmar durante 30 días
              </span>
            </li>
          </ul>
        </div>

        {/* Signers List */}
        <div className="bg-white rounded-xl shadow-sm p-8 mb-6">
          <h2 className="text-xl font-semibold text-slate-800 mb-6 flex items-center gap-2">
            <FileSignature className="w-6 h-6" />
            Firmantes ({contractStatus.signers.length})
          </h2>

          <div className="space-y-4">
            {contractStatus.signers.map((signer, index) => (
              <div
                key={signer.id}
                className="border border-slate-200 rounded-lg p-5 hover:border-blue-300 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-sm font-medium text-slate-500">
                        Firmante {index + 1}
                      </span>
                      {signer.has_signed ? (
                        <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                          ✓ Firmado
                        </span>
                      ) : (
                        <span className="px-3 py-1 bg-yellow-100 text-yellow-700 text-xs font-medium rounded-full">
                          ⏳ Pendiente
                        </span>
                      )}
                    </div>
                    <h3 className="text-lg font-semibold text-slate-800 mb-1">
                      {signer.full_name}
                    </h3>
                    <div className="text-sm text-slate-600 space-y-1">
                      <div>📧 {signer.email}</div>
                      <div>🆔 RUT: {signer.rut}</div>
                      <div className="capitalize">👤 Rol: {signer.role}</div>
                    </div>
                  </div>

                  {/* Signature URL (if available) */}
                  {signer.signature_url && !signer.has_signed && (
                    <a
                      href={signer.signature_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Firmar ahora
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tracking Info */}
        <div className="bg-slate-800 text-white rounded-xl p-6 mb-6">
          <h3 className="font-semibold mb-3">💡 Seguimiento de tu contrato</h3>
          <p className="text-slate-300 mb-4">
            Guarda este código para consultar el estado de tu contrato en cualquier momento:
          </p>
          <div className="bg-slate-700 rounded-lg p-4 font-mono text-2xl text-center tracking-wider">
            {trackingCode}
          </div>
          <p className="text-slate-400 text-sm mt-3">
            Ingresa este código en la sección de seguimiento para ver el progreso de las firmas
          </p>
        </div>

        {/* Actions */}
        <div className="flex justify-between">
          <button
            onClick={onBack}
            className="px-6 py-3 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
          >
            ← Volver
          </button>
          <button
            onClick={() => (window.location.href = '/')}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Crear nuevo contrato
          </button>
        </div>
      </div>
    </div>
  );
}
