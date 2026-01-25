import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ContractCard } from './ContractCard';
import { Home, Briefcase, FileText, ShieldCheck, Users, HandshakeIcon, Loader2, Search, ChevronDown, ChevronRight } from 'lucide-react';
import { templatesApi, getTemplateCategories, type Template } from '../../../services/api';

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
  const navigate = useNavigate();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());

  const toggleCategory = (category: string) => {
    setCollapsedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(category)) {
        newSet.delete(category);
      } else {
        newSet.add(category);
      }
      return newSet;
    });
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [templatesData, categoriesData] = await Promise.all([
          templatesApi.getAll(),
          getTemplateCategories()
        ]);
        setTemplates(templatesData || []);
        setCategories(categoriesData || []);
        setError(null);
      } catch (err) {
        console.error('Error al cargar templates:', err);
        setError('No se pudieron cargar los contratos. Por favor, intenta de nuevo.');
        setTemplates([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handlePersonalize = (templateSlug: string) => {
    navigate(`/${templateSlug}`);
  };

  // Filtrar templates según la búsqueda
  const filteredTemplates = (templates || []).filter(template => {
    const query = searchQuery.toLowerCase();
    return (
      template.title.toLowerCase().includes(query) ||
      template.description?.toLowerCase().includes(query) ||
      template.slug.toLowerCase().includes(query) ||
      (template.category || '').toLowerCase().includes(query)
    );
  });

  // Agrupar templates por categoría
  const groupedTemplates = filteredTemplates.reduce((acc, template) => {
    const category = template.category || 'otros';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(template);
    return acc;
  }, {} as Record<string, Template[]>);

  // Ordenar categorías (las definidas primero, luego las demás)
  const sortedCategories = Object.keys(groupedTemplates).sort((a, b) => {
    const indexA = categories.indexOf(a);
    const indexB = categories.indexOf(b);
    if (indexA === -1 && indexB === -1) return a.localeCompare(b);
    if (indexA === -1) return 1;
    if (indexB === -1) return -1;
    return indexA - indexB;
  });

  const formatCategoryTitle = (category: string) => {
    return category.charAt(0).toUpperCase() + category.slice(1);
  };

  if (loading) {
    return (
      <section className="py-24 px-6 lg:px-8 bg-transparent">
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
      <section className="py-24 px-6 lg:px-8 bg-transparent">
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
      <section className="py-24 px-6 lg:px-8 bg-transparent">
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
    <section className="py-24 px-6 lg:px-8 bg-transparent" id="productos">
      <div className="max-w-7xl mx-auto">
        <div className="text-center space-y-6 mb-16">
          <h2 className="text-5xl text-slate-900 font-bold">
            Elige tu contrato
          </h2>
          <p className="text-slate-600 max-w-2xl mx-auto text-lg">
            Selecciona el tipo de contrato que necesitas, personalízalo con tu información y recibe tu documento con validez legal
          </p>
          
          {/* Barra de búsqueda integrada */}
          <div className="max-w-lg mx-auto pt-4">
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-hover:text-cyan-500 transition-colors" />
              <input
                type="text"
                placeholder="Buscar contratos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-lg transition-colors"
                >
                  ✕
                </button>
              )}
            </div>
            {searchQuery && (
              <p className="mt-2 text-xs text-slate-500 text-center">
                {filteredTemplates.length} resultado{filteredTemplates.length !== 1 ? 's' : ''}
              </p>
            )}
          </div>
        </div>

        {/* Grid de contratos agrupados por categoría */}
        {filteredTemplates.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Search className="w-16 h-16 text-slate-300 mb-4" />
            <p className="text-slate-900 text-xl font-semibold mb-2">No se encontraron contratos</p>
            <p className="text-slate-600">Intenta con otros términos de búsqueda</p>
            <button
              onClick={() => setSearchQuery('')}
              className="mt-6 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Limpiar búsqueda
            </button>
          </div>
        ) : (
          <div className="space-y-8">
            {sortedCategories.map((category) => (
              <div key={category}>
                {/* Título de categoría con toggle */}
                <button
                  onClick={() => toggleCategory(category)}
                  className="flex items-center gap-2 mb-6 group cursor-pointer"
                >
                  {collapsedCategories.has(category) ? (
                    <ChevronRight className="w-6 h-6 text-slate-400 group-hover:text-slate-600 transition-colors" />
                  ) : (
                    <ChevronDown className="w-6 h-6 text-slate-400 group-hover:text-slate-600 transition-colors" />
                  )}
                  <h3 className="text-2xl font-bold text-slate-900 group-hover:text-slate-700 transition-colors">
                    {formatCategoryTitle(category)}
                  </h3>
                  <span className="text-sm text-slate-400 font-normal">
                    ({groupedTemplates[category].length})
                  </span>
                </button>
                
                {/* Grid de contratos de esta categoría */}
                {!collapsedCategories.has(category) && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {groupedTemplates[category].map((template) => (
                      <ContractCard
                        key={template.id}
                        title={template.title}
                        description={template.description || 'Personaliza este contrato con tu información'}
                        price={template.base_price}
                        icon={getIconForTemplate(template.slug)}
                        onPersonalize={() => handlePersonalize(template.slug)}
                        capsules={template.capsules}
                        requiresNotary={template.requires_notary}
                        hasSigners={template.has_signers}
                      />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
