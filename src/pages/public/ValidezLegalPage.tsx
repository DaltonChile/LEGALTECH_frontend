import { Navbar } from '../../components/landing/Navbar';
import { PageFooter } from '../../components/shared/PageFooter';
import { Scale, FileText, CheckCircle, UserCheck, Clock, Lock, Award, Gavel, ArrowRight } from 'lucide-react';
import { Button } from '../../components/ui/primitives/Button';
import { Text } from '../../components/ui/primitives/Text';
import { Box } from '../../components/ui/primitives/Box';
import { Card } from '../../components/ui/primitives/Card';

export function ValidezLegalPage() {
  return (
    <div className="min-h-screen relative bg-slate-50">
      {/* Gradient Overlay */}
      <div className="absolute top-0 left-0 right-0 h-[600px] bg-gradient-to-b from-white via-white/80 to-transparent pointer-events-none"></div>

      <div className="relative z-10">
        <Navbar />

        {/* Modern Hero Section */}
        <section className="relative overflow-hidden">
          <div className="max-w-7xl mx-auto px-6 lg:px-8 pt-16 pb-20 lg:pt-24 lg:pb-28">
            <div className="max-w-3xl space-y-8">

              <div className="space-y-6">
                <Text as="h1" variant="display" className="text-balance">
                  Validez Legal y <br />
                  <span className="text-legal-emerald-700">Seguridad Jurídica</span>
                </Text>
                <Text variant="body-lg" color="muted" className="max-w-2xl leading-relaxed">
                  Nuestra plataforma está construida bajo los más altos estándares de seguridad y en estricto cumplimiento con la normativa legal vigente en Chile.
                </Text>
              </div>
              <div className="flex items-center gap-3 pt-4">
                <ArrowRight className="w-5 h-5 text-legal-emerald-700" />
                <Text variant="body">Explora nuestra base legal detallada abajo</Text>
              </div>
            </div>
          </div>
        </section>

        {/* Ley Section */}
        <section className="py-20 px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <Text variant="h2" className="mb-3">Respaldo Legal</Text>
              <Text variant="body" color="muted" className="max-w-2xl mx-auto">
                Cumplimos con la normativa chilena para documentos electrónicos y firma digital
              </Text>
            </div>

            <Box variant="document" padding="lg" className="md:p-12">
              <div className="flex flex-col md:flex-row items-start gap-6 mb-8">
                <div className="flex-shrink-0 w-14 h-14 bg-navy-900 rounded-xl flex items-center justify-center shadow-lg">
                  <Gavel className="w-7 h-7 text-white" />
                </div>
                <div>
                  <Text variant="h3" className="mb-2">
                    Ley Nº 19.799 de Firma Electrónica
                  </Text>
                  <Text variant="body-sm" color="muted">
                    Vigente en Chile desde abril de 2002
                  </Text>
                </div>
              </div>

              <div className="bg-navy-900 text-white rounded-xl p-8 shadow-sm">
                <Text variant="body" className="leading-relaxed mb-8 text-slate-200" color="inherit">
                  Los documentos electrónicos tienen la misma validez legal que los documentos en papel,
                  siempre que cumplan con requisitos de seguridad y autenticidad.
                </Text>
                <div className="border-l-4 border-legal-emerald-600 pl-6">
                  <Text variant="body" weight="bold" className="mb-2 text-slate-100" color="inherit">
                    Artículo 3º
                  </Text>
                  <Text variant="body" className="italic leading-relaxed text-slate-200" color="inherit">
                    "Los actos y contratos otorgados o celebrados por personas naturales o jurídicas,
                    suscritos por medio de firma electrónica, serán válidos de la misma manera y producirán
                    los mismos efectos que los celebrados por escrito y en soporte de papel."
                  </Text>
                </div>
              </div>


            </Box>
          </div>
        </section>

        {/* Security Features */}
        <section className="py-20 px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <Text variant="h2" className="mb-3">Características de Seguridad</Text>
              <Text variant="body" color="muted" className="max-w-2xl mx-auto">
                Múltiples capas de protección para garantizar la validez de cada documento
              </Text>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                {
                  icon: UserCheck,
                  title: 'Identidad Validada',
                  description: 'Verificación multifactorial con el Registro Civil y validación de datos personales.'
                },
                {
                  icon: Clock,
                  title: 'Timestamping',
                  description: 'Sello de tiempo que certifica la fecha y hora exacta de cada firma e inalterabilidad.'
                },
                {
                  icon: Lock,
                  title: 'Hash Criptográfico',
                  description: 'Identificador único que garantiza la integridad absoluta del documento firmado.'
                },
                {
                  icon: Award,
                  title: 'Trazabilidad Judicial',
                  description: 'Registro auditable de cada acción para respaldo probatorio ante tribunales.'
                }
              ].map((feature, idx) => (
                <Card
                  key={idx}
                  variant="document"
                  hover
                  padding="md"
                  className="group"
                >
                  <div className="w-12 h-12 bg-legal-emerald-50 rounded-lg flex items-center justify-center mb-4 group-hover:bg-legal-emerald-600 transition-colors duration-300">
                    <feature.icon className="w-6 h-6 text-legal-emerald-600 group-hover:text-white transition-colors duration-300" />
                  </div>
                  <Text variant="h4" className="mb-2">{feature.title}</Text>
                  <Text variant="body-sm" color="muted">{feature.description}</Text>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Document Types */}
        <section className="py-20 px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <Text variant="h2" className="mb-3">Tipos de Documentos</Text>
              <Text variant="body" color="muted" className="max-w-2xl mx-auto">
                Ofrecemos diferentes niveles de validación según tus necesidades
              </Text>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <Card variant="document" hover padding="lg" className="flex flex-col items-center text-center">
                <div className="w-14 h-14 bg-navy-50 rounded-xl flex items-center justify-center mb-6">
                  <FileText className="w-7 h-7 text-navy-900" />
                </div>
                <Text variant="h3" className="mb-4">Firma Electrónica</Text>
                <Text variant="body-sm" color="muted" className="mb-6 leading-relaxed">
                  Válidos para contratos privados: arriendos, servicios, acuerdos comerciales y NDAs estándar.
                </Text>
                <div className="mt-auto pt-6 border-t border-slate-100 w-full flex items-center justify-center gap-2">
                  <CheckCircle className="w-4 h-4 text-legal-emerald-600" />
                  <Text variant="body-sm" weight="medium">Plena validez civil</Text>
                </div>
              </Card>

              <Card variant="document" accent accentColor="emerald" hover padding="lg" className="flex flex-col items-center text-center relative shadow-xl">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-legal-emerald-600 text-white px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest">
                  Recomendado
                </div>
                <div className="w-14 h-14 bg-legal-emerald-50 rounded-xl flex items-center justify-center mb-6">
                  <Scale className="w-7 h-7 text-legal-emerald-600" />
                </div>
                <Text variant="h3" className="mb-4">Validación Notarial</Text>
                <Text variant="body-sm" color="muted" className="mb-6 leading-relaxed">
                  Certificación ante Notario Público Digital. Máxima fuerza probatoria para trámites legales complejos.
                </Text>
                <div className="mt-auto pt-6 border-t border-slate-100 w-full flex items-center justify-center gap-2">
                  <CheckCircle className="w-4 h-4 text-legal-emerald-600" />
                  <Text variant="body-sm" weight="medium">Fuerza Probatoria Superior</Text>
                </div>
              </Card>

              <Card variant="document" hover padding="lg" className="flex flex-col items-center text-center">
                <div className="w-14 h-14 bg-slate-100 rounded-xl flex items-center justify-center mb-6">
                  <FileText className="w-7 h-7 text-slate-500" />
                </div>
                <Text variant="h3" className="mb-4">Documento Propio</Text>
                <Text variant="body-sm" color="muted" className="mb-6 leading-relaxed">
                  Sube tu PDF original y recolecta firmas electrónicas certificadas manteniendo tu formato intacto.
                </Text>
                <div className="mt-auto pt-6 border-t border-slate-100 w-full flex items-center justify-center gap-2">
                  <CheckCircle className="w-4 h-4 text-legal-emerald-600" />
                  <Text variant="body-sm" weight="medium">Flexibilidad Total</Text>
                </div>
              </Card>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <Box variant="document" padding="lg" className="bg-navy-900 border-none shadow-2xl relative overflow-hidden">
              {/* Decorative background element */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-legal-emerald-500/10 rounded-full blur-3xl -mr-32 -mt-32"></div>

              <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8 text-center md:text-left">
                <div className="space-y-2">
                  <Text variant="h2" className="text-white" color="inherit">¿Tienes dudas legales?</Text>
                  <Text variant="body" className="text-slate-300" color="inherit">Nuestro equipo está disponible para resolver consultas sobre validez legal.</Text>
                </div>
                <div className="flex flex-wrap gap-4 justify-center">
                  <Button
                    variant="success"
                    size="lg"
                    onClick={() => window.location.href = '/'}
                  >
                    Comenzar ahora
                  </Button>
                  <Button
                    variant="secondary"
                    size="lg"
                    onClick={() => window.location.href = '/ayuda'}
                    className="bg-navy-800 border-navy-700 text-white hover:bg-navy-700"
                  >
                    Centro de ayuda
                  </Button>
                </div>
              </div>
            </Box>
          </div>
        </section>

        <PageFooter />
      </div>
    </div>
  );
}
