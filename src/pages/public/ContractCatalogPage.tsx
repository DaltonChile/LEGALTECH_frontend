import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Upload, FileText, ArrowRight } from 'lucide-react';
import { PageFooter } from '../../components/shared/PageFooter';

interface Capsule {
  id: number;
  slug: string;
  title: string;
  legal_text: string;
  price: number;
}

interface Template {
  id: number;
  slug: string;
  title: string;
  description: string;
  category: string | null;
  base_price: number;
  published_version: {
    id: number;
    version_number: number;
    base_variables: string[];
    capsules: Capsule[];
  };
}

export function ContractCatalogPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [categories, setCategories] = useState<string[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    loadTemplates();
    loadCategories();
  }, []);

  const loadTemplates = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/templates`);
      setTemplates(response.data.data || response.data);
    } catch (error) {
      console.error('Error al cargar templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/config/template-categories`);
      setCategories(response.data.data || []);
    } catch (error) {
      console.error('Error al cargar categorías:', error);
      // Fallback to default categories
      setCategories(['laboral', 'arrendamiento', 'compraventa', 'servicios', 'otros']);
    }
  };

  const filteredTemplates = templates.filter((template) => {
    const matchesSearch =
      template.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (template.description || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    return matchesSearch && matchesCategory;
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

  const handleSelectTemplate = (templateSlug: string) => {
    navigate(`/${templateSlug}`);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
    }).format(price);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-navy-900 mx-auto"></div>
          <p className="mt-4 text-slate-600 font-sans">Cargando contratos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white shadow-document border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-serif font-bold text-navy-900">Catálogo de Contratos</h1>
          <p className="mt-2 text-slate-600 font-sans">Selecciona el contrato que necesitas y personalízalo</p>
        </div>
      </header>

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-lg shadow-document border border-slate-200 p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Search */}
            <div>
              <label htmlFor="search" className="block text-sm font-medium text-navy-900 mb-2 font-sans">
                Buscar
              </label>
              <input
                type="text"
                id="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por nombre o descripción..."
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-legal-emerald-500 focus:border-transparent font-sans"
              />
            </div>

            {/* Category filter */}
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-navy-900 mb-2 font-sans">
                Categoría
              </label>
              <select
                id="category"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-legal-emerald-500 focus:border-transparent font-sans"
              >
                <option value="all">Todas las categorías</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Template Grid - Grouped by Category */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {filteredTemplates.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-slate-500 font-sans">No se encontraron contratos</p>
          </div>
        ) : (
          <div className="space-y-10">
            {sortedCategories.map((category) => (
              <div key={category}>
                {/* Category Title */}
                <h2 className="text-2xl font-serif font-bold text-navy-900 mb-6">
                  {formatCategoryTitle(category)}
                </h2>
                
                {/* Templates Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {groupedTemplates[category].map((template) => (
              <div
                key={template.id}
                className="bg-white rounded-lg shadow-document hover:shadow-document-hover transition-shadow p-6 cursor-pointer border border-slate-200"
                onClick={() => handleSelectTemplate(template.slug)}
              >
                {/* Category badge */}
                <div className="flex items-center justify-between mb-3">
                  {template.category ? (
                    <span className="px-3 py-1 bg-legal-emerald-50 text-legal-emerald-700 text-xs font-semibold rounded-full font-sans">
                      {template.category.charAt(0).toUpperCase() + template.category.slice(1)}
                    </span>
                  ) : (
                    <span className="px-3 py-1 bg-slate-100 text-slate-500 text-xs font-semibold rounded-full font-sans">
                      General
                    </span>
                  )}
                  <span className="text-lg font-bold text-navy-900 font-sans">
                    {formatPrice(template.base_price)}
                  </span>
                </div>

                {/* Title */}
                <h3 className="text-xl font-serif font-bold text-navy-900 mb-2">{template.title}</h3>

                {/* Description */}
                <p className="text-slate-600 text-sm mb-4 line-clamp-3 font-sans">{template.description}</p>

                {/* Stats */}
                <div className="border-t border-slate-200 pt-4">
                  <div className="flex items-center justify-between text-sm font-sans">
                    <div className="text-slate-500">
                      <span className="font-medium">
                        {template.published_version?.base_variables?.length || 0}
                      </span>{' '}
                      campos
                    </div>
                    <div className="text-slate-500">
                      <span className="font-medium">
                        {template.published_version?.capsules?.length || 0}
                      </span>{' '}
                      cláusulas opcionales
                    </div>
                  </div>

                  {/* Capsules preview */}
                  {template.published_version?.capsules && template.published_version.capsules.length > 0 && (
                    <div className="mt-3">
                      <p className="text-xs text-slate-500 mb-2 font-sans">Cláusulas disponibles:</p>
                      <div className="flex flex-wrap gap-1">
                        {template.published_version.capsules.slice(0, 3).map((capsule) => (
                          <span
                            key={capsule.id}
                            className="px-2 py-1 bg-slate-100 text-slate-700 text-xs rounded font-sans"
                          >
                            {capsule.title}
                          </span>
                        ))}
                        {template.published_version.capsules.length > 3 && (
                          <span className="px-2 py-1 bg-slate-100 text-slate-700 text-xs rounded font-sans">
                            +{template.published_version.capsules.length - 3} más
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* CTA Button */}
                <button className="mt-4 w-full bg-navy-900 text-white py-2 px-4 rounded-lg hover:bg-navy-800 transition-colors font-medium font-sans">
                  Crear contrato
                </button>
              </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Custom Document CTA */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-gradient-to-br from-navy-900 to-navy-800 rounded-2xl p-8 md:p-12 text-white relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-legal-emerald-600/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-legal-emerald-600/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
          
          <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
            <div className="flex-shrink-0">
              <div className="w-20 h-20 bg-legal-emerald-600/20 rounded-2xl flex items-center justify-center">
                <Upload className="w-10 h-10 text-legal-emerald-400" />
              </div>
            </div>
            
            <div className="flex-1 text-center md:text-left">
              <h2 className="text-2xl md:text-3xl font-serif font-bold mb-3">
                ¿No encontraste lo que buscas?
              </h2>
              <p className="text-slate-300 text-lg mb-2">
                Sube tu propio documento PDF y firma electrónicamente con validez legal.
              </p>
              <p className="text-slate-400 text-sm">
                Perfecto para contratos personalizados, acuerdos específicos o documentos que ya tienes preparados.
              </p>
            </div>
            
            <div className="flex-shrink-0">
              <button
                onClick={() => navigate('/documento-personalizado')}
                className="group bg-legal-emerald-600 hover:bg-legal-emerald-500 text-white px-8 py-4 rounded-xl font-medium transition-all flex items-center gap-3 shadow-lg hover:shadow-xl"
              >
                <FileText className="w-5 h-5" />
                Subir mi documento
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <PageFooter />
    </div>
  );
}
