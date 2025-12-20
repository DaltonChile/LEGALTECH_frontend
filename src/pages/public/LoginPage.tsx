import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Scale, Loader2, AlertCircle } from 'lucide-react';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Usar el usuario retornado por login (evita depender del timing del state)
      const loggedInUser = await login(email, password);

      if (loggedInUser.role === 'admin') {
        navigate('/admin');
      } else if (loggedInUser.role === 'notario') {
        navigate('/notary');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 relative overflow-hidden flex flex-col">
      {/* Angled Gradient Background */}
      <div className="absolute top-0 left-0 right-0 h-full bg-slate-900 overflow-hidden -skew-y-6 origin-top-left transform -translate-y-24">
         <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-cyan-500 to-lime-500 opacity-90"></div>
         {/* Mesh/Blur effects */}
         <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-400 rounded-full mix-blend-overlay filter blur-3xl opacity-40 animate-pulse"></div>
         <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-lime-400 rounded-full mix-blend-overlay filter blur-3xl opacity-40 animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      {/* Content Container */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
        
        {/* Logo */}
        <div className="mb-8 flex items-center gap-2 text-white">
           <div className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center border border-white/20">
             <Scale className="w-5 h-5 text-white" />
           </div>
           <span className="text-2xl font-bold tracking-tight drop-shadow-sm">legaltech</span>
        </div>

        {/* Card */}
        <div className="w-md max-w-sm bg-white rounded-2xl shadow-xl shadow-slate-200/50 p-6 sm:p-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">
            Inicia sesión en tu cuenta
          </h2>

          {error && (
            <div className="mb-6 bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-lg text-sm flex items-start gap-2">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1.5">
                Correo electrónico
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full px-4 py-2.5 rounded-lg border border-slate-300 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all outline-none shadow-sm"
                placeholder="nombre@empresa.com"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="password" className="block text-sm font-medium text-slate-700">
                  Contraseña
                </label>

              </div>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full px-4 py-2.5 rounded-lg border border-slate-300 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all outline-none shadow-sm"
                placeholder="••••••••"
              />
            </div>


            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-gradient-to-r from-blue-600 via-cyan-500 to-lime-500 hover:shadow-lg focus:outline-none disabled:opacity-70 disabled:cursor-not-allowed transition-all"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Iniciar sesión'}
            </button>
          </form>


          
          {/* Test Credentials */}
          <div className="mt-8 pt-6 border-t border-slate-100">
             <p className="text-xs text-center text-slate-400 mb-2">Credenciales de prueba</p>
             <div className="flex justify-center gap-4 text-xs text-slate-500 font-mono">
                <span>admin@legaltech.cl</span>
                <span>password123</span>
                <span>notary@legaltech.cl</span>
                <span>password123</span>
             </div>
          </div>

        </div>
        
        {/* Footer links */}
        <div className="mt-10 flex gap-6 text-sm text-slate-500">
          <a href="#" className="hover:text-slate-900">© LegalTech</a>
          <a href="#" className="hover:text-slate-900">Privacidad</a>
          <a href="#" className="hover:text-slate-900">Términos</a>
        </div>

      </div>
    </div>
  );
}