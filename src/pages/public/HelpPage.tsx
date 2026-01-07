import { HelpCircle, FileText, Shield, Mail, Phone, BookOpen } from 'lucide-react';
import { Navbar } from '../../components/landing/Navbar';

export function HelpPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-cyan-50/30 to-lime-50/30">
      <Navbar />

      {/* Background Decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-0 w-[500px] h-[500px] bg-gradient-to-br from-blue-400/10 to-lime-400/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-gradient-to-tr from-cyan-400/10 to-emerald-400/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative max-w-6xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-2xl mb-4 shadow-lg">
            <HelpCircle className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-slate-900 mb-3">
            Ayuda y Políticas
          </h1>
          <p className="text-slate-600 text-lg py-4">
            Información importante sobre el uso de nuestra plataforma
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Cómo funciona */}
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900">¿Cómo funciona?</h2>
            </div>
            <div className="space-y-4 text-slate-700">
              <div>
                <h3 className="font-semibold text-lg mb-2">1. Selecciona tu contrato</h3>
                <p className="text-sm">Navega por nuestro catálogo y elige el tipo de contrato que necesitas.</p>
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">2. Completa los datos</h3>
                <p className="text-sm">Llena el formulario con la información requerida. Los campos se destacarán en el documento.</p>
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">3. Personaliza con cláusulas</h3>
                <p className="text-sm">Agrega cláusulas opcionales para adaptar el contrato a tus necesidades.</p>
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">4. Revisa y paga</h3>
                <p className="text-sm">Verifica que todo esté correcto y procede con el pago seguro.</p>
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">5. Firma electrónica</h3>
                <p className="text-sm">Todas las partes firmarán el contrato electrónicamente con validez legal.</p>
              </div>
            </div>
          </div>

          {/* Políticas */}
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <Shield className="w-6 h-6 text-purple-600" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900">Políticas</h2>
            </div>
            <div className="space-y-4 text-slate-700">
              <div>
                <h3 className="font-semibold text-lg mb-2">Privacidad de Datos</h3>
                <p className="text-sm">Toda tu información personal está protegida y encriptada. No compartimos tus datos con terceros sin tu consentimiento.</p>
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">Seguridad</h3>
                <p className="text-sm">Utilizamos protocolos de seguridad de nivel bancario para proteger tus documentos y transacciones.</p>
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">Validez Legal</h3>
                <p className="text-sm">Todos nuestros contratos están diseñados por profesionales del derecho y cumplen con la legislación vigente.</p>
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">Firma Electrónica</h3>
                <p className="text-sm">Las firmas electrónicas tienen plena validez legal según la Ley N° 19.799 sobre documentos electrónicos.</p>
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">Términos de Servicio</h3>
                <p className="text-sm">Al usar nuestra plataforma, aceptas nuestros términos y condiciones de uso.</p>
              </div>
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 mb-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-cyan-100 rounded-xl flex items-center justify-center">
              <FileText className="w-6 h-6 text-cyan-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900">Preguntas Frecuentes</h2>
          </div>
          
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold text-lg text-slate-900 mb-2">¿Cuánto tiempo tarda el proceso?</h3>
              <p className="text-slate-700">El tiempo depende de cuándo todas las partes firmen el contrato. El proceso de creación y pago toma solo minutos.</p>
            </div>
            
            <div>
              <h3 className="font-semibold text-lg text-slate-900 mb-2">¿Puedo modificar el contrato después de crearlo?</h3>
              <p className="text-slate-700">Una vez pagado, no se pueden hacer modificaciones. Asegúrate de revisar todo antes de proceder al pago.</p>
            </div>
            
            <div>
              <h3 className="font-semibold text-lg text-slate-900 mb-2">¿Qué pasa si necesito ayuda de un notario?</h3>
              <p className="text-slate-700">Algunos contratos requieren validación notarial. En ese caso, un notario revisará y firmará el documento.</p>
            </div>
            
            <div>
              <h3 className="font-semibold text-lg text-slate-900 mb-2">¿Cómo puedo hacer seguimiento de mi contrato?</h3>
              <p className="text-slate-700">Usa la sección de "Seguimiento" en el menú principal e ingresa tu código de seguimiento de 6 caracteres.</p>
            </div>

            <div>
              <h3 className="font-semibold text-lg text-slate-900 mb-2">¿Los contratos tienen validez legal?</h3>
              <p className="text-slate-700">Sí, todos nuestros contratos están diseñados por abogados y cumplen con la legislación chilena vigente. Las firmas electrónicas tienen plena validez legal.</p>
            </div>
          </div>
        </div>

        {/* Contact */}
        <div className="bg-gradient-to-r from-blue-600 to-cyan-600 rounded-2xl shadow-lg p-8 text-white">
          <div className="text-center mb-6">
            <h2 className="text-3xl font-bold mb-2">¿Necesitas más ayuda?</h2>
            <p className="text-blue-100">Estamos aquí para ayudarte</p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
            <a 
              href="mailto:soporte@legaltech.cl"
              className="flex items-center gap-3 bg-white/10 backdrop-blur-sm hover:bg-white/20 rounded-xl p-4 transition-all"
            >
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                <Mail className="w-6 h-6" />
              </div>
              <div>
                <div className="font-semibold">Email</div>
                <div className="text-sm text-blue-100">soporte@legaltech.cl</div>
              </div>
            </a>
            
            <a 
              href="tel:+56912345678"
              className="flex items-center gap-3 bg-white/10 backdrop-blur-sm hover:bg-white/20 rounded-xl p-4 transition-all"
            >
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                <Phone className="w-6 h-6" />
              </div>
              <div>
                <div className="font-semibold">Teléfono</div>
                <div className="text-sm text-blue-100">+56 9 1234 5678</div>
              </div>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
