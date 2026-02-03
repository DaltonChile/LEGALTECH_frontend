import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '../../components/landing/Navbar';
import { PageFooter } from '../../components/shared/PageFooter';
import { 
  HelpCircle, 
  FileText, 
  Shield, 
  Scale, 
  ChevronDown, 
  ChevronUp, 
  CreditCard, 
  PenTool, 
  Clock, 
  CheckCircle2,
  Users,
  ArrowRight,
  BookOpen,
  Lock,
  ExternalLink
} from 'lucide-react';

interface FaqItem {
  question: string;
  answer: string;
}

const faqs: FaqItem[] = [
  {
    question: '¿Qué es Contrato Seguro?',
    answer: 'Contrato Seguro es una notaría digital que permite crear, firmar y validar documentos legales de manera segura y completamente en línea. Ofrecemos una amplia variedad de plantillas: contratos de arriendo, compraventas, poderes, finiquitos, acuerdos comerciales y más. Todos nuestros documentos cumplen con la Ley N° 19.799 de Firma Electrónica de Chile.'
  },
  {
    question: '¿Tienen validez legal los documentos?',
    answer: 'Sí. Todos nuestros documentos tienen plena validez legal en Chile. Utilizamos firma electrónica avanzada que cumple con la Ley N° 19.799 y está respaldada por certificados digitales emitidos por prestadores acreditados. Además, ofrecemos validación notarial digital opcional.'
  },
  {
    question: '¿Qué tipos de documentos puedo crear?',
    answer: 'Ofrecemos plantillas para múltiples necesidades: contratos de arriendo, compraventas (vehículos, propiedades, bienes), poderes simples y notariales, finiquitos laborales, acuerdos de confidencialidad, contratos de servicios, y muchos más. También puedes solicitar plantillas personalizadas.'
  },
  {
    question: '¿Cuánto demora el proceso completo?',
    answer: 'El proceso típico toma entre 10 a 30 minutos dependiendo del documento. Esto incluye: seleccionar plantilla y completar datos (5-10 min), firma de las partes (5-10 min cada una), y validación notarial opcional (5-10 min).'
  },
  {
    question: '¿Qué necesito para crear un documento?',
    answer: 'Solo necesitas los datos de las partes involucradas (nombre, RUT, dirección, email) y la información específica del documento. Todo el proceso es 100% digital, no requieres documentos físicos ni ir a ninguna oficina.'
  },
  {
    question: '¿Cómo funciona el pago?',
    answer: 'Aceptamos pagos con tarjeta de crédito y débito a través de MercadoPago, una plataforma segura y certificada. El precio varía según el tipo de documento y si incluye validación notarial. El pago se procesa una sola vez.'
  },
  {
    question: '¿Qué pasa si hay un error en el documento?',
    answer: 'Antes de las firmas, puedes editar cualquier dato del documento sin costo adicional. Si detectas un error después de firmar, contacta a nuestro soporte para evaluar las opciones disponibles según el tipo de documento.'
  },
  {
    question: '¿Necesito ir a una notaría física?',
    answer: 'No. Somos una notaría 100% digital. Ofrecemos validación notarial en línea donde un notario certificado revisa y firma el documento electrónicamente, con la misma validez legal que una firma notarial presencial.'
  },
  {
    question: '¿Puedo usar la plataforma desde mi celular?',
    answer: 'Sí. Nuestra plataforma está optimizada para dispositivos móviles. Puedes crear, firmar y descargar documentos desde cualquier smartphone o tablet con conexión a internet.'
  },
  {
    question: '¿Cómo reciben los firmantes el documento?',
    answer: 'Cada firmante recibe un enlace único por correo electrónico para revisar y firmar el documento. El proceso es simple y guiado, no requiere crear cuenta ni instalar aplicaciones.'
  }
];

const howItWorks = [
  {
    icon: FileText,
    title: 'Elige tu documento',
    description: 'Selecciona entre nuestras plantillas: arriendos, compraventas, poderes, finiquitos, acuerdos y más. Cada plantilla está diseñada por abogados.',
    time: '2 min'
  },
  {
    icon: PenTool,
    title: 'Completa los datos',
    description: 'Ingresa la información de las partes y los detalles del documento. Nuestro sistema te guía paso a paso y valida automáticamente.',
    time: '5-10 min'
  },
  {
    icon: CreditCard,
    title: 'Realiza el pago',
    description: 'Paga de forma segura con tarjeta de crédito o débito. El precio incluye el documento y las firmas electrónicas.',
    time: '2 min'
  },
  {
    icon: Users,
    title: 'Firmas electrónicas',
    description: 'Cada parte recibe un enlace por email para revisar y firmar. Las firmas quedan registradas con certificado y marca de tiempo.',
    time: '5-10 min'
  },
  {
    icon: Scale,
    title: 'Validación notarial',
    description: 'Opcionalmente, un notario certificado revisa y valida el documento digitalmente, otorgándole fe pública.',
    time: '5-10 min'
  },
  {
    icon: CheckCircle2,
    title: 'Documento listo',
    description: 'Recibe tu documento firmado y validado por email. Descárgalo en PDF cuando lo necesites, con toda su validez legal.',
    time: 'Inmediato'
  }
];

const policies = [
  {
    id: 'terminos',
    title: 'Términos y Condiciones',
    icon: BookOpen,
    description: 'Condiciones de uso de la plataforma',
    content: `
## Términos y Condiciones de Uso

**Última actualización:** Diciembre 2024

### 1. Aceptación de los Términos
Al acceder y utilizar Contrato Seguro, usted acepta estar vinculado por estos términos y condiciones, así como por todas las leyes y regulaciones aplicables.

### 2. Descripción del Servicio
Contrato Seguro es una notaría digital que proporciona servicios de creación, firma electrónica y validación notarial de documentos legales en Chile, incluyendo contratos, poderes, finiquitos, acuerdos y otros instrumentos.

### 3. Requisitos de Uso
- Debe ser mayor de 18 años
- Debe proporcionar información veraz y actualizada
- Debe tener capacidad legal para contratar
- Debe cumplir con todas las leyes aplicables

### 4. Firma Electrónica y Validez Legal
Los documentos firmados a través de nuestra plataforma tienen validez legal según la Ley N° 19.799 de Chile sobre Firma Electrónica. La validación notarial digital otorga fe pública conforme a la normativa vigente.

### 5. Pagos y Facturación
- Los precios varían según el tipo de documento
- Los precios incluyen IVA
- Los pagos son procesados por MercadoPago
- Se emite boleta o factura electrónica según corresponda

### 6. Limitación de Responsabilidad
Contrato Seguro facilita la creación y firma de documentos legales. No somos responsables del contenido específico ingresado por los usuarios ni del cumplimiento de las obligaciones pactadas entre las partes.

### 7. Propiedad Intelectual
Todo el contenido de la plataforma, incluyendo plantillas y diseño, está protegido por derechos de autor y otras leyes de propiedad intelectual.
    `
  },
  {
    id: 'privacidad',
    title: 'Política de Privacidad',
    icon: Lock,
    description: 'Cómo protegemos tus datos',
    content: `
## Política de Privacidad

**Última actualización:** Diciembre 2024

### 1. Información que Recopilamos
- **Datos personales:** Nombre, RUT, dirección, correo electrónico, teléfono
- **Datos de documentos:** Información contenida en los documentos que usted crea
- **Datos de transacción:** Información de pago (procesada por MercadoPago)

### 2. Uso de la Información
Utilizamos su información para:
- Generar y procesar documentos legales
- Verificar la identidad de las partes firmantes
- Procesar pagos y emitir documentos tributarios
- Enviar notificaciones sobre el estado de sus documentos
- Facilitar la validación notarial
- Cumplir con obligaciones legales

### 3. Protección de Datos
- Encriptación SSL/TLS en todas las comunicaciones
- Almacenamiento seguro en servidores certificados
- Acceso restringido solo a personal autorizado
- Cumplimiento con la Ley N° 19.628 de Protección de Datos Personales

### 4. Compartir Información
No vendemos ni compartimos su información personal, excepto:
- Con notarios para validación de documentos
- Con autoridades cuando sea legalmente requerido
- Con procesadores de pago para completar transacciones

### 5. Retención de Datos
Conservamos sus datos y documentos por el tiempo necesario para cumplir con obligaciones legales, mínimo 5 años según normativa tributaria y notarial.

### 6. Sus Derechos
Puede solicitar acceso, rectificación o eliminación de sus datos contactando a soporte@contratoseguro.cl
    `
  },
  {
    id: 'reembolsos',
    title: 'Política de Reembolsos',
    icon: CreditCard,
    description: 'Condiciones de devolución',
    content: `
## Política de Reembolsos

**Última actualización:** Diciembre 2024

### 1. Reembolsos Automáticos
Se realizará reembolso completo automático cuando:
- El pago fue procesado pero no se generó el documento por error técnico
- Se realizó un cobro duplicado

### 2. Reembolsos Solicitables
Puede solicitar reembolso dentro de las primeras **24 horas** si:
- No ha iniciado el proceso de firma
- No ha compartido el enlace del documento
- No ha descargado ningún documento

### 3. No Aplica Reembolso
No se realizarán reembolsos cuando:
- Alguna de las partes ya firmó el documento
- Han pasado más de 24 horas desde el pago
- El documento fue descargado o compartido
- El error en los datos fue ingresado por el usuario
- Ya se realizó la validación notarial

### 4. Proceso de Reembolso
1. Envíe su solicitud a soporte@contratoseguro.cl
2. Incluya: código de seguimiento, motivo, comprobante de pago
3. Recibirá respuesta en máximo 48 horas hábiles
4. Si procede, el reembolso se realiza en 5-10 días hábiles

### 5. Método de Reembolso
Los reembolsos se procesan al mismo método de pago original. Los tiempos pueden variar según su banco o emisor de tarjeta.
    `
  }
];

export function HelpPage() {
  const navigate = useNavigate();
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [selectedPolicy, setSelectedPolicy] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'faq' | 'how' | 'policies'>('faq');

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <main className="max-w-6xl mx-auto px-6 py-12">
        
        {/* Page Header */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-serif font-bold text-navy-900 mb-3">
            Centro de Ayuda
          </h1>
          <p className="text-slate-600 text-lg font-sans max-w-2xl mx-auto">
            Encuentra respuestas a tus preguntas y conoce nuestras políticas
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex bg-white rounded-lg p-1 shadow-document border border-slate-200">
            <button
              onClick={() => setActiveTab('faq')}
              className={`px-5 py-2.5 rounded-md text-sm font-medium font-sans transition-colors ${
                activeTab === 'faq' 
                  ? 'bg-navy-900 text-white' 
                  : 'text-slate-600 hover:text-navy-900 hover:bg-slate-50'
              }`}
            >
              <HelpCircle className="w-4 h-4 inline-block mr-2 -mt-0.5" />
              Preguntas Frecuentes
            </button>
            <button
              onClick={() => setActiveTab('how')}
              className={`px-5 py-2.5 rounded-md text-sm font-medium font-sans transition-colors ${
                activeTab === 'how' 
                  ? 'bg-navy-900 text-white' 
                  : 'text-slate-600 hover:text-navy-900 hover:bg-slate-50'
              }`}
            >
              <Clock className="w-4 h-4 inline-block mr-2 -mt-0.5" />
              Cómo Funciona
            </button>
            <button
              onClick={() => setActiveTab('policies')}
              className={`px-5 py-2.5 rounded-md text-sm font-medium font-sans transition-colors ${
                activeTab === 'policies' 
                  ? 'bg-navy-900 text-white' 
                  : 'text-slate-600 hover:text-navy-900 hover:bg-slate-50'
              }`}
            >
              <Shield className="w-4 h-4 inline-block mr-2 -mt-0.5" />
              Políticas
            </button>
          </div>
        </div>

        {/* FAQ Tab */}
        {activeTab === 'faq' && (
          <div className="space-y-3">
            {faqs.map((faq, idx) => (
              <div 
                key={idx}
                className="bg-white rounded-lg shadow-document border border-slate-200 overflow-hidden"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full flex items-center justify-between p-5 text-left hover:bg-slate-50 transition-colors"
                >
                  <span className="font-medium text-navy-900 pr-4 font-sans">{faq.question}</span>
                  {openFaq === idx ? (
                    <ChevronUp className="w-5 h-5 text-slate-400 shrink-0" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-slate-400 shrink-0" />
                  )}
                </button>
                {openFaq === idx && (
                  <div className="px-5 pb-5 border-t border-slate-100">
                    <p className="text-slate-600 leading-relaxed pt-4 font-sans text-sm">
                      {faq.answer}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* How It Works Tab */}
        {activeTab === 'how' && (
          <div className="bg-white rounded-lg shadow-document border border-slate-200 overflow-hidden">
            <div className="border-t-4 border-t-navy-900 p-8">
              <h2 className="text-2xl font-serif font-bold text-navy-900 mb-2 text-center">
                Proceso Paso a Paso
              </h2>
              <p className="text-slate-500 text-center mb-10 font-sans">
                Crea tu documento legal en minutos
              </p>

              <div className="relative">
                {/* Vertical Line */}
                <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-slate-200 hidden md:block" />

                <div className="space-y-8">
                  {howItWorks.map((step, idx) => (
                    <div key={idx} className="flex items-start gap-6 relative">
                      {/* Step Number Circle */}
                      <div className="shrink-0 relative z-10">
                        <div className="w-16 h-16 rounded-full bg-navy-900 flex items-center justify-center shadow-md">
                          <step.icon className="w-7 h-7 text-white" />
                        </div>
                      </div>

                      {/* Step Content */}
                      <div className="flex-1 pb-8 pt-2">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-serif font-bold text-navy-900 text-lg">{step.title}</h3>
                          <span className="text-xs font-medium text-legal-emerald-700 bg-legal-emerald-50 px-2.5 py-1 rounded-full font-sans">
                            {step.time}
                          </span>
                        </div>
                        <p className="text-slate-600 font-sans text-sm leading-relaxed">
                          {step.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-10 pt-8 border-t border-slate-100 text-center">
                <p className="text-slate-500 mb-4 font-sans">¿Listo para comenzar?</p>
                <button
                  onClick={() => navigate('/')}
                  className="bg-navy-900 text-white px-6 py-3 rounded-md font-medium font-sans hover:bg-navy-800 transition-colors inline-flex items-center gap-2"
                >
                  Crear mi documento
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Policies Tab */}
        {activeTab === 'policies' && (
          <div className="grid md:grid-cols-3 gap-4">
            {policies.map((policy) => (
              <button
                key={policy.id}
                onClick={() => setSelectedPolicy(policy.id)}
                className="bg-white rounded-lg shadow-document border border-slate-200 p-6 text-left hover:shadow-document-hover hover:border-navy-200 transition-all group"
              >
                <div className="w-12 h-12 rounded-lg bg-navy-50 flex items-center justify-center mb-4 group-hover:bg-navy-100 transition-colors">
                  <policy.icon className="w-6 h-6 text-navy-900" />
                </div>
                <h3 className="font-serif font-bold text-navy-900 mb-1">{policy.title}</h3>
                <p className="text-slate-500 text-sm font-sans">{policy.description}</p>
                <span className="inline-flex items-center gap-1 text-sm text-navy-600 mt-3 font-medium font-sans group-hover:text-navy-800">
                  Leer más <ExternalLink className="w-3 h-3" />
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Contact Section */}
        <div className="mt-12 bg-white rounded-lg shadow-document border border-slate-200 p-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="font-serif font-bold text-navy-900 mb-1">¿No encontraste lo que buscabas?</h3>
            <p className="text-slate-500 text-sm font-sans">Nuestro equipo de soporte está listo para ayudarte</p>
          </div>
          <div className="flex gap-3">
            <a 
              href="mailto:soporte@contratoseguro.cl"
              className="px-4 py-2 text-sm font-medium font-sans text-navy-900 bg-slate-100 rounded-md hover:bg-slate-200 transition-colors inline-flex items-center gap-2"
            >
              Contactar soporte
            </a>
          </div>
        </div>

        {/* Quick Links */}
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <button
            onClick={() => navigate('/seguimiento')}
            className="text-sm text-slate-600 hover:text-navy-900 font-sans flex items-center gap-2"
          >
            <FileText className="w-4 h-4" />
            Rastrear mi documento
          </button>
          <span className="text-slate-300">|</span>
          <button
            onClick={() => navigate('/')}
            className="text-sm text-slate-600 hover:text-navy-900 font-sans flex items-center gap-2"
          >
            <PenTool className="w-4 h-4" />
            Crear nuevo documento
          </button>
        </div>

      </main>

      <PageFooter />

      {/* Policy Modal */}
      {selectedPolicy && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-lg shadow-document-hover max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-xl font-serif font-bold text-navy-900">
                {policies.find(p => p.id === selectedPolicy)?.title}
              </h2>
              <button
                onClick={() => setSelectedPolicy(null)}
                className="text-slate-400 hover:text-slate-600 text-2xl leading-none"
              >
                ×
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1 prose prose-slate prose-sm max-w-none">
              <div className="whitespace-pre-wrap text-slate-700 font-sans text-sm leading-relaxed">
                {policies.find(p => p.id === selectedPolicy)?.content}
              </div>
            </div>
            <div className="p-4 border-t border-slate-100 bg-slate-50">
              <button
                onClick={() => setSelectedPolicy(null)}
                className="w-full py-3 bg-navy-900 text-white rounded-md font-medium font-sans hover:bg-navy-800 transition-colors"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
