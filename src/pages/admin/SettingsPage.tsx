import { useState, useEffect } from 'react';
import { Save, Settings as SettingsIcon, DollarSign, AlertCircle, CheckCircle, Tag, Plus, X } from 'lucide-react';
import { getPlatformConfig, updatePlatformConfig } from '../../services/api';
import type { PlatformConfig } from '../../services/api';

export const SettingsPage = () => {
  const [configs, setConfigs] = useState<PlatformConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [editedValues, setEditedValues] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchConfigs();
  }, []);

  const fetchConfigs = async () => {
    try {
      setLoading(true);
      const data = await getPlatformConfig();
      setConfigs(data);
      
      // Initialize edited values with current values
      const initialValues: Record<string, string> = {};
      data.forEach(config => {
        initialValues[config.key] = config.value;
      });
      setEditedValues(initialValues);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al cargar configuración');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (key: string) => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const value = editedValues[key];
      await updatePlatformConfig(key, value);

      // Update local state
      setConfigs(configs.map(config => 
        config.key === key ? { ...config, value } : config
      ));

      setSuccess('Configuración actualizada correctamente');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al guardar configuración');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (key: string, value: string) => {
    setEditedValues({
      ...editedValues,
      [key]: value
    });
  };

  const hasChanges = (key: string) => {
    const config = configs.find(c => c.key === key);
    return config && editedValues[key] !== config.value;
  };

  const formatKey = (key: string) => {
    return key
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const getIcon = (key: string) => {
    if (key.includes('price')) return DollarSign;
    if (key.includes('categor')) return Tag;
    return SettingsIcon;
  };

  // Handle adding a new category
  const handleAddCategory = (key: string) => {
    const newCategory = prompt('Ingresa el nombre de la nueva categoría:');
    if (newCategory && newCategory.trim()) {
      const normalizedCategory = newCategory.trim().toLowerCase();
      const currentValue = editedValues[key];
      try {
        const categories = JSON.parse(currentValue) as string[];
        if (!categories.includes(normalizedCategory)) {
          categories.push(normalizedCategory);
          handleChange(key, JSON.stringify(categories));
        } else {
          alert('Esta categoría ya existe');
        }
      } catch {
        alert('Error al agregar categoría');
      }
    }
  };

  // Handle removing a category
  const handleRemoveCategory = (key: string, categoryToRemove: string) => {
    if (confirm(`¿Estás seguro de eliminar la categoría "${categoryToRemove}"?`)) {
      const currentValue = editedValues[key];
      try {
        const categories = JSON.parse(currentValue) as string[];
        const filtered = categories.filter(cat => cat !== categoryToRemove);
        handleChange(key, JSON.stringify(filtered));
      } catch {
        alert('Error al eliminar categoría');
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Configuración de Plataforma</h1>
        <p className="text-slate-600">Administra los precios y configuraciones del sistema</p>
      </div>

      {/* Alert Messages */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-red-900">Error</p>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-green-900">Éxito</p>
            <p className="text-sm text-green-700">{success}</p>
          </div>
        </div>
      )}

      {/* Configuration Cards */}
      <div className="space-y-4">
        {configs.map((config) => {
          const Icon = getIcon(config.key);
          const changed = hasChanges(config.key);

          return (
            <div
              key={config.key}
              className="bg-white border border-slate-200 rounded-lg p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start gap-4">
                <div className="p-3 bg-cyan-50 rounded-lg">
                  <Icon className="w-6 h-6 text-cyan-600" />
                </div>
                
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-slate-900 mb-1">
                    {formatKey(config.key)}
                  </h3>
                  <p className="text-sm text-slate-600 mb-4">{config.description}</p>

                  {/* Special rendering for JSON array (categories) */}
                  {config.value_type === 'json' ? (
                    <div className="space-y-3">
                      <div className="flex flex-wrap gap-2">
                        {(() => {
                          try {
                            const categories = JSON.parse(editedValues[config.key] || '[]') as string[];
                            return categories.map((cat) => (
                              <span
                                key={cat}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-sm font-medium border border-blue-200"
                              >
                                {cat.charAt(0).toUpperCase() + cat.slice(1)}
                                <button
                                  onClick={() => handleRemoveCategory(config.key, cat)}
                                  className="hover:text-red-600 transition-colors"
                                  title="Eliminar categoría"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </span>
                            ));
                          } catch {
                            return <span className="text-red-500 text-sm">Error al cargar categorías</span>;
                          }
                        })()}
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => handleAddCategory(config.key)}
                          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition-all flex items-center gap-2"
                        >
                          <Plus className="w-4 h-4" />
                          Agregar Categoría
                        </button>

                        <button
                          onClick={() => handleSave(config.key)}
                          disabled={saving || !changed}
                          className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                            changed
                              ? 'bg-cyan-600 hover:bg-cyan-700 text-white shadow-sm'
                              : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                          }`}
                        >
                          <Save className="w-4 h-4" />
                          Guardar
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Regular input for non-JSON types */
                    <div className="flex items-center gap-3">
                      <div className="flex-1">
                        <input
                          type={config.value_type === 'integer' || config.value_type === 'float' ? 'number' : 'text'}
                          value={editedValues[config.key] || ''}
                          onChange={(e) => handleChange(config.key, e.target.value)}
                          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-colors"
                          placeholder={`Ingrese ${config.value_type === 'integer' ? 'número entero' : 'valor'}`}
                        />
                      </div>

                      <button
                        onClick={() => handleSave(config.key)}
                        disabled={saving || !changed}
                        className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                          changed
                            ? 'bg-cyan-600 hover:bg-cyan-700 text-white shadow-sm'
                            : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                        }`}
                      >
                        <Save className="w-4 h-4" />
                        Guardar
                      </button>
                    </div>
                  )}

                  {changed && (
                    <p className="text-xs text-amber-600 mt-2">
                      • Cambios sin guardar
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {configs.length === 0 && !loading && (
        <div className="text-center py-12">
          <SettingsIcon className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-600">No hay configuraciones disponibles</p>
        </div>
      )}
    </div>
  );
};
