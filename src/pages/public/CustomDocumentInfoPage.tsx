import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import {
    Upload,
    PenTool,
    CreditCard,
    Shield,
    Scale,
    CheckCircle2,
    ArrowRight,
    FileText,
    Lock,
    Clock,
    Loader2
} from 'lucide-react';
import { Navbar } from '../../components/landing/Navbar';
import { PageFooter } from '../../components/shared/PageFooter';
import { formatPrice } from '../../components/public/contract-editor/utils/formatPrice';
import customDocumentService from '../../services/customDocumentService';
import type { PricingOptions } from '../../services/customDocumentService';

const steps = [
    {
        icon: Upload,
        title: 'Sube tu PDF',
        description: 'Arrastra o selecciona tu documento PDF tal como está. Nosotros respetamos tu formato.'
    },
    {
        icon: PenTool,
        title: 'Configura firmas',
        description: 'Elige entre Firma Electrónica Simple o Avanzada (FEA), y agrega los datos de cada firmante.'
    },
    {
        icon: CreditCard,
        title: 'Paga y envía',
        description: 'Paga de forma segura. Los firmantes recibirán un email para firmar desde cualquier dispositivo.'
    }
];

const features = [
    {
        icon: Shield,
        title: 'Validez Legal',
        description: 'Todos los documentos cumplen con la Ley N° 19.799 de Firma Electrónica de Chile.'
    },
    {
        icon: Lock,
        title: 'Seguro y Confidencial',
        description: 'Tus documentos están protegidos con encriptación de nivel bancario en todo momento.'
    },
    {
        icon: Clock,
        title: 'Seguimiento en Tiempo Real',
        description: 'Recibe un código de seguimiento y revisa el estado de las firmas cuando quieras.'
    }
];

export function CustomDocumentInfoPage() {
    const navigate = useNavigate();
    const [pricing, setPricing] = useState<PricingOptions | null>(null);
    const [loadingPricing, setLoadingPricing] = useState(true);

    useEffect(() => {
        const loadPricing = async () => {
            try {
                const options = await customDocumentService.getPricingOptions();
                setPricing(options);
            } catch (err) {
                console.error('Error loading pricing:', err);
            } finally {
                setLoadingPricing(false);
            }
        };
        loadPricing();
    }, []);

    return (
        <div className="min-h-screen relative bg-slate-50">
            {/* Grid Background */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none"></div>

            {/* Gradient Overlay */}
            <div className="absolute top-0 left-0 right-0 h-[600px] bg-gradient-to-b from-white via-white/80 to-transparent pointer-events-none"></div>

            <div className="relative z-10">
                <Navbar />

                {/* Hero Section */}
                <section className="relative overflow-hidden bg-slate-50">
                    <div className="relative max-w-7xl mx-auto px-6 lg:px-8 pt-16 pb-20 lg:pt-24 lg:pb-28">
                        <div className="max-w-3xl mx-auto text-center space-y-8">
                            <div className="space-y-6">
                                <div className="inline-flex items-center gap-2 px-4 py-2 bg-legal-emerald-50 rounded-full text-sm font-medium text-legal-emerald-700 font-sans">
                                    <Upload className="w-4 h-4" />
                                    Documento personalizado
                                </div>
                                <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold text-navy-900 leading-tight text-balance">
                                    Firma tu propio documento{' '}
                                    <span className="text-legal-emerald-700">con validez legal</span>
                                </h1>
                                <p className="text-lg text-slate-600 font-sans max-w-2xl mx-auto leading-relaxed">
                                    ¿Ya tienes un contrato o documento listo? Súbelo en PDF y nosotros nos encargamos
                                    de recolectar las firmas electrónicas de todas las partes. Simple, seguro y 100% legal.
                                </p>
                            </div>

                            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                                <button
                                    onClick={() => navigate('/documento-personalizado/subir')}
                                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 bg-navy-900 text-white text-base font-semibold rounded-lg hover:bg-navy-800 transition-colors font-sans shadow-lg"
                                >
                                    Subir mi documento
                                    <ArrowRight className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    </div>
                </section>

                {/* How It Works */}
                <section className="py-20 px-6 lg:px-8 bg-slate-50">
                    <div className="max-w-6xl mx-auto">
                        <div className="text-center mb-16">
                            <h2 className="text-4xl font-serif font-bold text-navy-900 mb-3">
                                ¿Cómo funciona?
                            </h2>
                            <p className="text-slate-600 font-sans text-lg max-w-2xl mx-auto">
                                En 3 simples pasos, tu documento estará firmado digitalmente con validez legal.
                            </p>
                        </div>

                        <div className="grid md:grid-cols-3 gap-8 mb-20">
                            {steps.map((step, idx) => (
                                <div key={idx} className="relative">
                                    {idx < steps.length - 1 && (
                                        <div className="hidden md:block absolute top-8 left-[calc(50%+2rem)] w-[calc(100%-4rem)] h-0.5 bg-slate-200" />
                                    )}

                                    <div className="text-center relative">
                                        <div className="w-16 h-16 bg-white border-2 border-slate-200 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-sm">
                                            <step.icon className="w-7 h-7 text-navy-900" />
                                        </div>

                                        <h3 className="font-serif font-bold text-navy-900 mb-2">{step.title}</h3>
                                        <p className="text-sm text-slate-600 font-sans leading-relaxed">{step.description}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Features Grid */}
                        <div className="grid md:grid-cols-3 gap-6">
                            {features.map((feature, idx) => (
                                <div
                                    key={idx}
                                    className="bg-white rounded-lg p-6 border border-slate-200 shadow-document hover:shadow-document-hover transition-shadow"
                                >
                                    <div className="w-12 h-12 bg-legal-emerald-50 rounded-lg flex items-center justify-center mb-4">
                                        <feature.icon className="w-6 h-6 text-legal-emerald-600" />
                                    </div>
                                    <h3 className="font-serif font-bold text-navy-900 mb-2">{feature.title}</h3>
                                    <p className="text-sm text-slate-600 font-sans">{feature.description}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Pricing Section */}
                <section className="py-20 px-6 lg:px-8 bg-slate-50">
                    <div className="max-w-4xl mx-auto">
                        <div className="text-center mb-16">
                            <h2 className="text-4xl font-serif font-bold text-navy-900 mb-3">
                                Precios transparentes
                            </h2>
                            <p className="text-slate-600 font-sans text-lg max-w-2xl mx-auto">
                                Paga solo por lo que necesitas. Sin costos ocultos ni sorpresas.
                            </p>
                        </div>

                        {loadingPricing ? (
                            <div className="flex justify-center py-12">
                                <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {/* Base price card */}
                                <div className="bg-white rounded-xl border border-slate-200 shadow-document overflow-hidden">
                                    <div className="bg-navy-900 px-8 py-6 text-white">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h3 className="text-xl text-slate-300 font-serif font-bold mb-1">Gestión documental</h3>
                                                <p className="text-slate-300 text-sm font-sans">Procesamiento, almacenamiento seguro y seguimiento de tu documento</p>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-3xl font-bold font-sans">{formatPrice(pricing?.base_price || 10000)}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="px-8 py-5">
                                        <div className="flex flex-wrap gap-x-8 gap-y-2 text-sm text-slate-600 font-sans">
                                            <span className="flex items-center gap-2">
                                                <CheckCircle2 className="w-4 h-4 text-legal-emerald-600 shrink-0" />
                                                Almacenamiento seguro
                                            </span>
                                            <span className="flex items-center gap-2">
                                                <CheckCircle2 className="w-4 h-4 text-legal-emerald-600 shrink-0" />
                                                Código de seguimiento
                                            </span>
                                            <span className="flex items-center gap-2">
                                                <CheckCircle2 className="w-4 h-4 text-legal-emerald-600 shrink-0" />
                                                Notificaciones por email
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Add-on cards */}
                                <div className="grid md:grid-cols-2 gap-6">
                                    {/* Simple signature */}
                                    <div className="bg-white rounded-xl border border-slate-200 shadow-document p-6">
                                        <div className="flex items-start gap-4 mb-4">
                                            <div className="w-12 h-12 bg-legal-emerald-50 rounded-lg flex items-center justify-center shrink-0">
                                                <PenTool className="w-6 h-6 text-legal-emerald-600" />
                                            </div>
                                            <div>
                                                <h3 className="font-serif font-bold text-navy-900">Firma Electrónica Simple</h3>
                                                <p className="text-sm text-slate-500 font-sans mt-1">Validez legal para contratos civiles y comerciales</p>
                                            </div>
                                        </div>
                                        <div className="border-t border-slate-100 pt-4">
                                            <div className="flex items-baseline gap-1">
                                                <span className="text-2xl font-bold text-navy-900 font-sans">
                                                    {formatPrice(pricing?.simple?.price_per_signer || 0)}
                                                </span>
                                                <span className="text-sm text-slate-500 font-sans">por firma</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* FEA */}
                                    <div className="bg-white rounded-xl border-2 border-legal-emerald-500 shadow-document p-6 relative">
                                        <div className="absolute -top-3 right-4">
                                            <span className="bg-legal-emerald-600 text-white text-xs font-semibold px-3 py-1 rounded-full font-sans">
                                                Recomendada
                                            </span>
                                        </div>
                                        <div className="flex items-start gap-4 mb-4">
                                            <div className="w-12 h-12 bg-legal-emerald-50 rounded-lg flex items-center justify-center shrink-0">
                                                <Shield className="w-6 h-6 text-legal-emerald-600" />
                                            </div>
                                            <div>
                                                <h3 className="font-serif font-bold text-navy-900">Firma Electrónica Avanzada (FEA)</h3>
                                                <p className="text-sm text-slate-500 font-sans mt-1">Verificación de identidad con clave única</p>
                                            </div>
                                        </div>
                                        <div className="border-t border-slate-100 pt-4">
                                            <div className="flex items-baseline gap-1">
                                                <span className="text-2xl font-bold text-navy-900 font-sans">
                                                    {formatPrice(pricing?.fea?.price_per_signer || 0)}
                                                </span>
                                                <span className="text-sm text-slate-500 font-sans">por firma</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Notary option */}
                                <div className="bg-white rounded-xl border border-slate-200 shadow-document p-6">
                                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                                        <div className="flex items-start gap-4">
                                            <div className="w-12 h-12 bg-navy-900 rounded-lg flex items-center justify-center shrink-0">
                                                <Scale className="w-6 h-6 text-white" />
                                            </div>
                                            <div>
                                                <h3 className="font-serif font-bold text-navy-900">Visación notarial</h3>
                                                <p className="text-sm text-slate-500 font-sans mt-1">Un notario revisará y certificará tu documento. Disponible como opción adicional.</p>
                                            </div>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <span className="text-2xl font-bold text-navy-900 font-sans">
                                                +{formatPrice(pricing?.notary_price || 0)}
                                            </span>
                                            <p className="text-xs text-slate-500 font-sans">opcional</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </section>

                {/* CTA Section */}
                <section className="py-20 px-6 lg:px-8 bg-slate-50">
                    <div className="max-w-4xl mx-auto">
                        <div className="bg-navy-900 rounded-2xl p-8 md:p-12 text-center text-white">
                            <div className="w-16 h-16 bg-white/10 rounded-xl flex items-center justify-center mx-auto mb-6">
                                <FileText className="w-8 h-8 text-white" />
                            </div>
                            <h2 className="text-3xl font-serif font-bold mb-4">¿Listo para firmar tu documento?</h2>
                            <p className="text-slate-300 font-sans max-w-xl mx-auto mb-8">
                                Sube tu PDF, configura las firmas y recibe tu documento firmado con validez legal. Todo en minutos.
                            </p>
                            <button
                                onClick={() => navigate('/documento-personalizado/subir')}
                                className="inline-flex items-center gap-2 px-8 py-4 bg-legal-emerald-600 hover:bg-legal-emerald-700 text-white text-base font-semibold rounded-lg transition-colors font-sans shadow-lg"
                            >
                                Subir mi documento
                                <ArrowRight className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </section>

                <PageFooter />
            </div>
        </div>
    );
}

export default CustomDocumentInfoPage;
