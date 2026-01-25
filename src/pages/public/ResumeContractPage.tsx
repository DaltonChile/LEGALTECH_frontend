import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

export function ResumeContractPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const id = searchParams.get('id');
    const code = searchParams.get('code');
    const rut = searchParams.get('rut');

    if ((!id && !code) || !rut) {
      setError('Parámetros inválidos. Se requiere (id o code) y rut.');
      setLoading(false);
      return;
    }

    loadContract(id, code, rut);
  }, [searchParams]);

  const loadContract = async (id: string | null, code: string | null, rut: string) => {
    try {
      // Construir la URL con los parámetros disponibles
      const params = new URLSearchParams();
      if (id) params.append('id', id);
      if (code) params.append('code', code);
      params.append('rut', rut);

      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/contracts/resume?${params.toString()}`
      );

      if (response.data.success) {
        const contract = response.data.data;
        const template = contract.template;
        
        console.log('📦 Contrato cargado:', contract.id);
        console.log('📝 Template recibido:', template);
        console.log('🔗 Template slug:', template?.slug);
        
        if (!template?.slug) {
          console.error('❌ Template o slug no encontrado en el contrato');
          console.error('Datos del contrato:', contract);
          setError('No se encontró el template asociado al contrato.');
          setLoading(false);
          return;
        }
        
        // Redirigir según el estado del contrato
        switch (contract.status) {
          case 'pending_payment':
            // Aún no ha pagado - volver al formulario inicial
            navigate(`/${template.slug}?resume=true&id=${contract.id}&rut=${encodeURIComponent(rut)}`);
            break;
            
          case 'draft':
            // Ya pagó - puede completar formulario
            navigate(`/${template.slug}?step=completar&id=${contract.id}&rut=${encodeURIComponent(rut)}`);
            break;
            
          case 'waiting_signatures':
          case 'waiting_notary':
          case 'completed':
            // Contratos en proceso de firma o completados - ir a seguimiento
            navigate(`/seguimiento?code=${contract.tracking_code}&rut=${encodeURIComponent(rut)}`);
            break;
            
          case 'failed':
            setError('Este contrato ha sido cancelado o ha expirado.');
            setLoading(false);
            break;
            
          default:
            // Estado desconocido - ir a seguimiento
            navigate(`/seguimiento?code=${contract.tracking_code}&rut=${encodeURIComponent(rut)}`);
        }
      } else {
        setError(response.data.error || 'Error al cargar el contrato');
        setLoading(false);
      }
    } catch (err: any) {
      console.error('Error loading contract:', err);
      setError(err.response?.data?.error || 'Error cargando contrato. Verifica los datos ingresados.');
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-cyan-50/30 to-lime-50/30">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando tu contrato...</p>
          <p className="text-sm text-gray-400 mt-2">Por favor espera mientras verificamos tu información</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-cyan-50/30 to-lime-50/30">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-slate-900 mb-2">No se pudo cargar el contrato</h2>
          <p className="text-slate-600 mb-6">{error}</p>
          
          <div className="space-y-3">
            <button
              onClick={() => navigate('/seguimiento')}
              className="w-full bg-cyan-600 text-white px-6 py-3 rounded-lg hover:bg-cyan-700 transition-colors font-medium"
            >
              Ir a Seguimiento
            </button>
            <button
              onClick={() => navigate('/')}
              className="w-full bg-white text-slate-700 px-6 py-3 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors font-medium"
            >
              Volver al inicio
            </button>
          </div>
          
          <p className="text-xs text-slate-400 mt-6">
            Si crees que esto es un error, contacta a soporte con tu código de seguimiento y RUT.
          </p>
        </div>
      </div>
    );
  }

  return null;
}
