import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Package, XCircle, FileText, Users, AlertCircle, Scale, Copy, ArrowRight, CheckCircle2, Circle, ChevronDown, ChevronUp } from 'lucide-react';
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

const STEPS = [
  { id: 'payment', label: 'Pago' },
  { id: 'draft', label: 'Borrador' },
  { id: 'signatures', label: 'Firmas' },
  { id: 'completed', label: 'Completado' }
];

const getStepStatus = (stepId: string, currentStatus: string) => {
  // Define the logical progression of statuses
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

  const formatRut = (value: string) => {
    let rut = value.replace(/[^0-9kK]/g, '').toUpperCase();
    if (rut.length > 1) {
      const dv = rut.slice(-1);
      let body = rut.slice(0, -1);
      body = body.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
      rut = body + '-' + dv;
    }
    return rut;
  };

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
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/contracts/track/${trackingCode.trim().toUpperCase()}`
      );

      if (response.data.success) {
        setContractData(response.data.data);
      } else {
        setError('No se encontró el contrato');
      }
    } catch (err: any) {
      if (err.response?.status === 404) {
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
    }
  };

  return (
    <div className="min-h-screen relative bg-slate-50">
       {/* Grid Background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none"></div>
      
      {/* Gradient Overlay */}
      <div className="absolute top-0 left-0 right-0 h-[600px] bg-gradient-to-b from-white via-white/80 to-transparent pointer-events-none"></div>

      <div className="relative z-10 font-sans">
        <Navbar />

        <main className="max-w-3xl min-h-full mx-auto px-6 py-12">
          
          <div className="text-center mb-10">
            <h1 className="text-4xl font-bold text-slate-900 mb-2">Rastrear Contrato</h1>
            <p className="text-slate-500 text-lg">Consulta el estado de tu documento legal en tiempo real</p>
          </div>

          {/* Search Box */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-2 mb-8 mx-auto">
             <form onSubmit={handleSearch} className="flex items-center">
                <div className="pl-4 text-slate-400">
                  <Search className="w-5 h-5" />
                </div>
                <input
                  type="text"
                  value={trackingCode}
                  onChange={(e) => setTrackingCode(e.target.value.toUpperCase())}
                  placeholder="Ingresa tu código de seguimiento (ej: CNT-123)"
                  className="flex-1 px-4 py-3 bg-transparent outline-none text-slate-900 placeholder-slate-400 w-full uppercase"
                />
                <button 
                  type="submit"
                  disabled={loading}
                  className="bg-slate-900 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-slate-800 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Buscando...' : 'Rastrear'}
                </button>
             </form>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-100 flex items-center gap-3 mb-8 animate-fade-in-up">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p>{error}</p>
            </div>
          )}

          {/* Results Card */}
          {contractData && (
            <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden animate-fade-in-up">
              
              {/* Card Header */}
              <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
                    <Scale className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900">Contrato Seguro Signature</h3>
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                      <span>Ref: {contractData.tracking_code}</span>
                      <button onClick={copyToClipboard} className="hover:text-blue-600 transition-colors p-1 rounded-md hover:bg-slate-50">
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
                {(contractData.status === 'draft') && (
                  <button 
                    onClick={() => setShowRutForm(true)}
                    className="bg-blue-50 text-blue-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors flex items-center gap-2"
                  >
                    Continuar editando
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Status Section */}
              <div className="p-8">
                <div className="mb-8">
                   <p className="text-slate-500 text-sm mb-6">
                    {getStatusDescription(contractData.status)}
                  </p>

                  {/* Progress Bar */}
                  <div className="relative mb-12 px-4">
                     <div className="absolute top-1/2 left-0 right-0 h-1 bg-slate-100 -translate-y-1/2 rounded-full"></div>
                     <div className="absolute top-1/2 left-0 h-1 bg-green-500 -translate-y-1/2 rounded-full transition-all duration-1000"
                          style={{ width: `${(Math.max(0, STEPS.findIndex(s => getStepStatus(s.id, contractData.status) === 'current') ) / (STEPS.length - 1)) * 100}%` }}>
                     </div>
                     
                     <div className="relative flex justify-between">
                        {STEPS.map((step) => {
                          const status = getStepStatus(step.id, contractData.status);
                          const isCompleted = status === 'completed';
                          const isCurrent = status === 'current';
                          const isError = status === 'error';
                          
                          return (
                            <div key={step.id} className="flex flex-col items-center gap-2 relative">
                               <div className={`w-8 h-8 rounded-full flex items-center justify-center border-4 transition-colors z-10 bg-white
                                  ${isCompleted ? 'bg-green-500 border-green-500 text-white' : 
                                    isCurrent ? 'bg-white border-green-500 text-green-500' : 
                                    isError ? 'bg-red-500 border-red-500 text-white' :
                                    'bg-slate-50 border-slate-200 text-slate-300'}
                               `}>
                                  {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : 
                                   isError ? <XCircle className="w-4 h-4" /> :
                                   <Circle className="w-4 h-4 fill-current" />}
                               </div>
                               <span className={`text-xs font-medium absolute -bottom-6 w-max ${isCurrent ? 'text-slate-900' : 'text-slate-400'} hidden sm:block`}>
                                 {step.label}
                               </span>
                            </div>
                          );
                        })}
                     </div>
                  </div>
                </div>

                {/* Detail Sections */}
                <div className="border rounded-xl border-slate-100 divide-y divide-slate-100 mt-6">
                  
                  {/* Timeline Toggle */}
                  <button 
                    onClick={() => setShowDetails(!showDetails)}
                    className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors"
                  >
                     <span className="font-semibold text-slate-900 text-sm">Detalles del Proceso</span>
                     {showDetails ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                  </button>
                  
                  {showDetails && (
                    <div className="p-4 space-y-6 bg-slate-50/50">
                       
                       {/* Signers Info */}
                       <div>
                         <h4 className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                           <Users className="w-3 h-3" /> Firmantes
                         </h4>
                         <div className="space-y-3 pl-2 border-l-2 border-slate-200 ml-1">
                           {contractData.signers?.map((signer) => (
                             <div key={signer.id} className="flex items-start gap-3 ml-3 relative">
                               <div className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${signer.has_signed ? 'bg-green-500' : 'bg-slate-300'}`}></div>
                               <div className="flex-1">
                                 <p className="text-sm font-medium text-slate-900">{signer.full_name}</p>
                                 <p className="text-xs text-slate-500 capitalize">{signer.role === 'buyer' ? 'Comprador' : signer.role === 'seller' ? 'Vendedor' : signer.role}</p>
                                 {signer.has_signed && (
                                    <div className="flex items-center gap-1 mt-1 text-xs text-green-600 bg-green-50 inline-flex px-1.5 py-0.5 rounded">
                                      <CheckCircle2 className="w-3 h-3" /> Firmado {signer.signed_at && `el ${new Date(signer.signed_at).toLocaleDateString()}`}
                                    </div>
                                 )}
                               </div>
                             </div>
                           )) || <p className="text-sm text-slate-500 ml-3">No hay firmantes registrados</p>}
                         </div>
                       </div>

                       {/* Contract Info */}
                       <div>
                          <h4 className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                            <FileText className="w-3 h-3" /> Documento
                          </h4>
                          <div className="bg-white p-3 rounded-lg border border-slate-200 ml-1">
                            <div className="flex justify-between items-center text-sm mb-2 border-b border-slate-100 pb-2">
                              <span className="text-slate-500">Creación</span>
                              <span className="text-slate-900 font-medium">{contractData.created_at ? new Date(contractData.created_at).toLocaleDateString() : 'Fecha no disponible'}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                              <span className="text-slate-500">Notario</span>
                              <span className="text-slate-900 font-medium">{contractData.requires_notary ? 'Requerido' : 'No requerido'}</span>
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
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 text-center animate-fade-in-up">
              <Package className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-600 font-medium">No se encontraron resultados</p>
              <p className="text-slate-500 text-sm mt-1">Verifica el código de seguimiento e inténtalo nuevamente</p>
            </div>
          )}

          {/* Help Section */}
          <div className="mt-8 bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col md:flex-row items-center justify-between gap-6">
             <div>
               <h3 className="font-bold text-slate-900 mb-1">¿Necesitas ayuda con tu contrato?</h3>
               <p className="text-slate-500 text-sm">Nuestro equipo de soporte está disponible 24/7</p>
             </div>
             <div className="flex gap-3">
                <button className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
                  Contactar soporte
                </button>
             </div>
          </div>

        </main>
      </div>

      {/* RUT Modal */}
      {showRutForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 animate-fade-in-up">
            <h3 className="text-xl font-bold text-slate-900 mb-4">Verificación de seguridad</h3>
            <p className="text-slate-600 mb-6 text-sm">
              Para retomar la edición del contrato, por favor verifica tu identidad ingresando tu RUT.
            </p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
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
                  className={`w-full p-3 bg-slate-50 border rounded-lg outline-none focus:ring-2 transition-all ${
                    rutError 
                      ? 'border-red-300 focus:ring-red-100' 
                      : 'border-slate-200 focus:ring-blue-100 focus:border-blue-400'
                  }`}
                />
                {rutError && (
                  <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {rutError}
                  </p>
                )}
              </div>
              
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowRutForm(false)}
                  className="flex-1 px-4 py-3 text-slate-600 font-medium hover:bg-slate-50 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleContinueEditing}
                  className="flex-1 px-4 py-3 bg-slate-900 text-white font-medium rounded-lg hover:bg-slate-800 transition-colors"
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
