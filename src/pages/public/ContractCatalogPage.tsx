import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-cyan-50/30 to-lime-50/30 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando contratos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-cyan-50/30 to-lime-50/30">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-gray-900">Catálogo de Contratos</h1>
          <p className="mt-2 text-gray-600">Selecciona el contrato que necesitas y personalízalo</p>
        </div>
      </header>

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Search */}
            <div>
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
                Buscar
              </label>
              <input
                type="text"
                id="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por nombre o descripción..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Category filter */}
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                Categoría
              </label>
              <select
                id="category"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
            <p className="text-gray-500">No se encontraron contratos</p>
          </div>
        ) : (
          <div className="space-y-10">
            {sortedCategories.map((category) => (
              <div key={category}>
                {/* Category Title */}
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  {formatCategoryTitle(category)}
                </h2>
                
                {/* Templates Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {groupedTemplates[category].map((template) => (
              <div
                key={template.id}
                className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-6 cursor-pointer border border-gray-200"
                onClick={() => handleSelectTemplate(template.slug)}
              >
                {/* Category badge */}
                <div className="flex items-center justify-between mb-3">
                  {template.category ? (
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full">
                      {template.category.charAt(0).toUpperCase() + template.category.slice(1)}
                    </span>
                  ) : (
                    <span className="px-3 py-1 bg-gray-100 text-gray-500 text-xs font-semibold rounded-full">
                      General
                    </span>
                  )}
                  <span className="text-lg font-bold text-gray-900">
                    {formatPrice(template.base_price)}
                  </span>
                </div>

                {/* Title */}
                <h3 className="text-xl font-bold text-gray-900 mb-2">{template.title}</h3>

                {/* Description */}
                <p className="text-gray-600 text-sm mb-4 line-clamp-3">{template.description}</p>

                {/* Stats */}
                <div className="border-t border-gray-200 pt-4">
                  <div className="flex items-center justify-between text-sm">
                    <div className="text-gray-500">
                      <span className="font-medium">
                        {template.published_version?.base_variables?.length || 0}
                      </span>{' '}
                      campos
                    </div>
                    <div className="text-gray-500">
                      <span className="font-medium">
                        {template.published_version?.capsules?.length || 0}
                      </span>{' '}
                      cláusulas opcionales
                    </div>
                  </div>

                  {/* Capsules preview */}
                  {template.published_version?.capsules && template.published_version.capsules.length > 0 && (
                    <div className="mt-3">
                      <p className="text-xs text-gray-500 mb-2">Cláusulas disponibles:</p>
                      <div className="flex flex-wrap gap-1">
                        {template.published_version.capsules.slice(0, 3).map((capsule) => (
                          <span
                            key={capsule.id}
                            className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
                          >
                            {capsule.title}
                          </span>
                        ))}
                        {template.published_version.capsules.length > 3 && (
                          <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                            +{template.published_version.capsules.length - 3} más
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* CTA Button */}
                <button className="mt-4 w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium">
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
    </div>
  );
}
