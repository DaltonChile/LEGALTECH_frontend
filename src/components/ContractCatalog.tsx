import { useState, useEffect } from 'react';
import { ContractCard } from './ContractCard';
import { Home, Briefcase, FileText, ShieldCheck, Users, HandshakeIcon, Loader2 } from 'lucide-react';
import { templatesApi, type Template } from '../services/api';

// Mapeo de iconos según el slug o título
const getIconForTemplate = (slug: string): any => {
  const iconMap: Record<string, any> = {
    'arrendamiento': Home,
    'compraventa': HandshakeIcon,
    'prestacion': Briefcase,
    'confidencialidad': ShieldCheck,
    'sociedad': Users,
    'trabajo': FileText,
  };
  
  // Buscar coincidencia parcial en el slug
  for (const [key, icon] of Object.entries(iconMap)) {
    if (slug.toLowerCase().includes(key)) {
      return icon;
    }
  }
  
  return FileText; // Ícono por defecto
};

export function ContractCatalog() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        setLoading(true);
        const data = await templatesApi.getAll();
        setTemplates(data);
        setError(null);
      } catch (err) {
        console.error('Error al cargar templates:', err);
        setError('No se pudieron cargar los contratos. Por favor, intenta de nuevo.');
      } finally {
        setLoading(false);
      }
    };

    fetchTemplates();
  }, []);

  const handlePersonalize = (templateSlug: string) => {
    alert(`Funcionalidad de personalización para ${templateSlug} próximamente`);
  };

  if (loading) {
    return (
      <section className="py-24 px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
            <p className="text-slate-600">Cargando contratos disponibles...</p>
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="py-24 px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col items-center justify-center py-20">
            <div className="text-red-600 mb-4 text-5xl">⚠️</div>
            <p className="text-slate-900 text-xl font-semibold mb-2">Error al cargar contratos</p>
            <p className="text-slate-600 text-center max-w-md">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="mt-6 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Reintentar
            </button>
          </div>
        </div>
      </section>
    );
  }

  if (templates.length === 0) {
    return (
      <section className="py-24 px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col items-center justify-center py-20">
            <FileText className="w-16 h-16 text-slate-300 mb-4" />
            <p className="text-slate-900 text-xl font-semibold mb-2">No hay contratos disponibles</p>
            <p className="text-slate-600">Pronto agregaremos más opciones.</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-24 px-6 lg:px-8 bg-white" id="productos">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-5xl text-slate-900 font-bold">
            Elige tu contrato
          </h2>
          <p className="text-slate-600 max-w-2xl mx-auto text-lg">
            Selecciona el tipo de contrato que necesitas, personalízalo con tu información y recibe tu documento listo para firmar
          </p>
        </div>

        {/* Grid de contratos */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {templates.map((template) => (
            <ContractCard
              key={template.id}
              title={template.title}
              description={template.description || 'Personaliza este contrato con tu información'}
              price={template.base_price}
              icon={getIconForTemplate(template.slug)}
              onPersonalize={() => handlePersonalize(template.slug)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
