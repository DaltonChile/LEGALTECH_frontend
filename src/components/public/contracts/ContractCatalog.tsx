import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatPrice } from '../contract-editor/utils/formatPrice';
import { 
  Home, 
  Briefcase, 
  FileText, 
  ShieldCheck, 
  Users, 
  HandshakeIcon, 
  Loader2, 
  Search, 
  ArrowRight,
  Scale,
  Building2,
  Gavel,
  FileSignature,
  X,
  Info
} from 'lucide-react';
import { templatesApi, getTemplateCategories, type Template } from '../../../services/api';
import { RichDescription } from './RichDescription';

// Mapeo de iconos según el slug o título
const getIconForTemplate = (slug: string): any => {
  const iconMap: Record<string, any> = {
    'arrendamiento': Home,
    'compraventa': HandshakeIcon,
    'prestacion': Briefcase,
    'confidencialidad': ShieldCheck,
    'sociedad': Users,
    'trabajo': FileText,
    'poder': Gavel,
    'finiquito': FileSignature,
  };
  
  for (const [key, icon] of Object.entries(iconMap)) {
    if (slug.toLowerCase().includes(key)) {
      return icon;
    }
  }
  
  return FileText;
};

// Iconos y colores para categorías
const categoryConfig: Record<string, { icon: any; color: string; bgColor: string }> = {
  'laboral': { icon: Briefcase, color: 'text-slate-600', bgColor: 'bg-slate-100' },
  'arrendamiento': { icon: Home, color: 'text-slate-600', bgColor: 'bg-slate-100' },
  'compraventa': { icon: HandshakeIcon, color: 'text-slate-600', bgColor: 'bg-slate-100' },
  'servicios': { icon: Building2, color: 'text-slate-600', bgColor: 'bg-slate-100' },
  'otros': { icon: FileText, color: 'text-slate-600', bgColor: 'bg-slate-100' },
};

export function ContractCatalog() {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [infoModalTemplate, setInfoModalTemplate] = useState<Template | null>(null);

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
        setError('No se pudieron cargar los documentos. Por favor, intenta de nuevo.');
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

  // Filtrar templates
  const filteredTemplates = (templates || []).filter(template => {
    const query = searchQuery.toLowerCase();
    const matchesSearch = 
      template.title.toLowerCase().includes(query) ||
      template.description?.toLowerCase().includes(query) ||
      template.slug.toLowerCase().includes(query) ||
      (template.category || '').toLowerCase().includes(query);
    
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const formatCategoryTitle = (category: string) => {
    return category.charAt(0).toUpperCase() + category.slice(1);
  };



  if (loading) {
    return (
      <section className="py-20 px-6 lg:px-8 bg-white" id="documentos">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-10 h-10 text-navy-900 animate-spin mb-4" />
            <p className="text-slate-600 font-sans">Cargando documentos disponibles...</p>
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="py-20 px-6 lg:px-8 bg-white" id="documentos">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4">
              <X className="w-8 h-8 text-red-500" />
            </div>
            <p className="text-navy-900 text-xl font-serif font-bold mb-2">Error al cargar documentos</p>
            <p className="text-slate-600 text-center max-w-md font-sans">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="mt-6 px-6 py-3 bg-navy-900 text-white rounded-md hover:bg-navy-800 transition-colors font-sans font-medium"
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
      <section className="py-20 px-6 lg:px-8 bg-white" id="documentos">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
              <FileText className="w-8 h-8 text-slate-400" />
            </div>
            <p className="text-navy-900 text-xl font-serif font-bold mb-2">No hay documentos disponibles</p>
            <p className="text-slate-600 font-sans">Pronto agregaremos más opciones.</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-20 px-6 lg:px-8 bg-white" id="documentos">
      <div className="max-w-6xl mx-auto">
        
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-serif font-bold text-navy-900 mb-3">
            Documentos Disponibles
          </h2>
          <p className="text-slate-600 font-sans text-lg max-w-2xl mx-auto">
            Selecciona el documento que necesitas, complétalo con tus datos y obtén un documento con validez legal
          </p>
        </div>

        {/* Filters Bar */}
        <div className="bg-slate-50 rounded-lg p-4 mb-8 border border-slate-200">
          <div className="flex flex-col lg:flex-row gap-4 items-end">
            
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar documentos..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-md text-sm text-navy-900 placeholder-slate-400 focus:outline-none focus:border-navy-900 focus:ring-1 focus:ring-navy-900 font-sans transition-colors"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Category Selector */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-medium text-navy-900 font-sans focus:outline-none focus:border-navy-900 transition-colors cursor-pointer hover:border-navy-200"
            >
              <option value="all">Todas las categorías</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {formatCategoryTitle(category)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Results count */}
        {(searchQuery || selectedCategory !== 'all') && (
          <p className="text-sm text-slate-500 mb-4 font-sans">
            {filteredTemplates.length} documento{filteredTemplates.length !== 1 ? 's' : ''} encontrado{filteredTemplates.length !== 1 ? 's' : ''}
          </p>
        )}

        {/* Documents Table */}
        {filteredTemplates.length === 0 ? (
          <div className="bg-white rounded-lg border border-slate-200 p-12 text-center">
            <Search className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-navy-900 font-serif font-bold mb-2">No se encontraron documentos</p>
            <p className="text-slate-500 font-sans text-sm mb-4">Intenta con otros términos de búsqueda</p>
            <button
              onClick={() => { setSearchQuery(''); setSelectedCategory('all'); }}
              className="text-navy-900 font-medium text-sm hover:underline font-sans"
            >
              Limpiar filtros
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-document">
            {/* Table Header */}
            <div className="hidden md:grid md:grid-cols-12 gap-4 px-6 py-3 bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider font-sans">
              <div className="col-span-5">Documento</div>
              <div className="col-span-2">Categoría</div>
              <div className="col-span-2 text-center">Características</div>
              <div className="col-span-1 text-right">Precio</div>
              <div className="col-span-2"></div>
            </div>

            {/* Table Body */}
            <div className="divide-y divide-slate-100">
              {filteredTemplates.map((template) => {
                const Icon = getIconForTemplate(template.slug);
                const config = categoryConfig[template.category || 'otros'] || categoryConfig['otros'];
                
                return (
                  <div 
                    key={template.id}
                    className="grid grid-cols-1 md:grid-cols-12 gap-4 px-6 py-5 hover:bg-slate-50 transition-colors group"
                  >
                    {/* Document Info */}
                    <div className="md:col-span-5 flex items-start gap-4">
                      <div className={`w-10 h-10 rounded-lg ${config.bgColor} flex items-center justify-center shrink-0`}>
                        <Icon className={`w-5 h-5 ${config.color}`} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-serif font-bold text-navy-900 group-hover:text-legal-emerald-700 transition-colors">
                            {template.title}
                          </h3>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setInfoModalTemplate(template);
                            }}
                            className="text-slate-400 hover:text-navy-900 transition-colors p-1 hover:bg-slate-100 rounded shrink-0"
                            title="Ver información completa"
                          >
                            <Info className="w-4 h-4" />
                          </button>
                        </div>
                        {template.short_description && (
                          <p className="text-sm text-slate-500 font-sans line-clamp-2 mt-0.5">
                            {template.short_description}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Category - Desktop */}
                    <div className="hidden md:flex md:col-span-2 items-center">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.bgColor} ${config.color}`}>
                        {formatCategoryTitle(template.category || 'otros')}
                      </span>
                    </div>

                    {/* Features */}
                    <div className="hidden md:flex md:col-span-2 items-center justify-center">
                      <div className="flex flex-col gap-1">
                        {template.has_signers && (
                          <div className="flex items-center gap-1 text-xs text-slate-500" title="Requiere firmas">
                            <Users className="w-3.5 h-3.5 shrink-0" />
                            <span>Firmas</span>
                          </div>
                        )}
                        {template.requires_notary && (
                          <div className="flex items-center gap-1 text-xs text-slate-500" title="Incluye visación notarial">
                            <Scale className="w-3.5 h-3.5 shrink-0" />
                            <span>Visación notarial</span>
                          </div>
                        )}
                        {template.capsules && template.capsules.length > 0 && (
                          <div className="flex items-center gap-1 text-xs text-slate-500" title="Cláusulas opcionales disponibles">
                            <FileText className="w-3.5 h-3.5 shrink-0" />
                            <span>Cláusulas opcionales</span>
                          </div>
                        )}
                        {!template.has_signers && !template.requires_notary && (!template.capsules || template.capsules.length === 0) && (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </div>
                    </div>

                    {/* Price */}
                    <div className="hidden md:flex md:col-span-1 items-center justify-end">
                      <span className="font-semibold text-navy-900 font-sans">
                        {formatPrice(template.base_price)}
                      </span>
                    </div>

                    {/* Mobile: Category + Price row */}
                    <div className="flex md:hidden items-center justify-between">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.bgColor} ${config.color}`}>
                        {formatCategoryTitle(template.category || 'otros')}
                      </span>
                      <span className="font-semibold text-navy-900 font-sans">
                        {formatPrice(template.base_price)}
                      </span>
                    </div>

                    {/* CTA */}
                    <div className="md:col-span-2 flex items-center justify-end">
                      <button
                        onClick={() => handlePersonalize(template.slug)}
                        className="w-full md:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 bg-navy-900 text-white text-sm font-medium rounded-md hover:bg-navy-800 transition-colors font-sans group-hover:bg-legal-emerald-600"
                      >
                        Crear
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}



      </div>

      {/* Info Modal */}
      {infoModalTemplate && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in"
          onClick={() => setInfoModalTemplate(null)}
        >
          <div 
            className="bg-white rounded-lg shadow-document max-w-lg w-full p-6 animate-fade-in-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-navy-900 rounded-lg flex items-center justify-center">
                  <FileText className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-lg font-serif font-bold text-navy-900">
                  {infoModalTemplate.title}
                </h3>
              </div>
              <button
                onClick={() => setInfoModalTemplate(null)}
                className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-semibold text-navy-900 mb-2 font-sans">Descripción</h4>
                <div className="max-h-64 overflow-y-auto">
                  <RichDescription content={infoModalTemplate.description || 'Sin descripción disponible'} />
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                <div className="text-sm text-slate-500 font-sans">
                  Precio desde
                </div>
                <div className="text-xl font-bold text-navy-900 font-sans">
                  {formatPrice(infoModalTemplate.base_price)}
                </div>
              </div>

              <button
                onClick={() => {
                  setInfoModalTemplate(null);
                  handlePersonalize(infoModalTemplate.slug);
                }}
                className="w-full bg-navy-900 hover:bg-navy-800 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 font-sans"
              >
                Crear este documento
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Document CTA */}
      <div className="max-w-6xl mx-auto">
        <div className="mt-16 bg-white rounded-lg shadow-document border border-slate-200 p-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="font-serif font-bold text-navy-900 mb-1">¿No encontraste lo que buscas?</h3>
            <p className="text-slate-500 text-sm font-sans">Sube tu propio documento PDF y firma electrónicamente con validez legal</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => navigate('/documento-personalizado')}
              className="px-4 py-2 text-sm font-medium font-sans text-navy-900 bg-slate-100 rounded-md hover:bg-slate-200 transition-colors"
            >
              Subir mi documento
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
