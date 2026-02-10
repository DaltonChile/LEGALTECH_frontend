import { useState, useEffect, useRef } from 'react';
import { getErrorMessage } from '../../utils/validators';
import { Save, Settings as SettingsIcon, DollarSign, AlertCircle, CheckCircle, Tag, Plus, X, Pencil, ShieldAlert } from 'lucide-react';
import { getPlatformConfig, updatePlatformConfig } from '../../services/api';
import type { PlatformConfig } from '../../services/api';
import { Text } from '../../components/ui/primitives/Text';
import { Box } from '../../components/ui/primitives/Box';
import { Button } from '../../components/ui/primitives/Button';

export const SettingsPage = () => {
  const [configs, setConfigs] = useState<PlatformConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [editedValues, setEditedValues] = useState<Record<string, string>>({});
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    type: 'save' | 'delete' | 'add';
    key: string;
    oldValue?: string;
    newValue?: string;
    category?: string;
  } | null>(null);
  const [newCategoryInput, setNewCategoryInput] = useState('');
  const [showAddCategory, setShowAddCategory] = useState<string | null>(null);
  const addCategoryInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchConfigs();
  }, []);

  const fetchConfigs = async () => {
    try {
      setLoading(true);
      const data = await getPlatformConfig();
      setConfigs(data);
      const initialValues: Record<string, string> = {};
      data.forEach(config => { initialValues[config.key] = config.value; });
      setEditedValues(initialValues);
    } catch (err: any) {
      setError(getErrorMessage(err, 'Error al cargar configuración'));
    } finally {
      setLoading(false);
    }
  };

  const requestSave = (key: string) => {
    const config = configs.find(c => c.key === key);
    if (!config) return;
    setConfirmDialog({
      type: 'save',
      key,
      oldValue: config.value,
      newValue: editedValues[key],
    });
  };

  const executeSave = async (key: string) => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);
      const value = editedValues[key];
      await updatePlatformConfig(key, value);
      setConfigs(configs.map(config =>
        config.key === key ? { ...config, value } : config
      ));
      setEditingKey(null);
      setConfirmDialog(null);
      setSuccess('Configuración actualizada correctamente');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(getErrorMessage(err, 'Error al guardar configuración'));
    } finally {
      setSaving(false);
    }
  };

  const handleConfirm = () => {
    if (!confirmDialog) return;
    if (confirmDialog.type === 'save') {
      executeSave(confirmDialog.key);
    } else if (confirmDialog.type === 'delete' && confirmDialog.category) {
      try {
        const categories = JSON.parse(editedValues[confirmDialog.key]) as string[];
        const updated = JSON.stringify(categories.filter(c => c !== confirmDialog.category));
        handleChange(confirmDialog.key, updated);
        setConfirmDialog(null);
      } catch {
        setError('Error al eliminar categoría');
        setConfirmDialog(null);
      }
    } else if (confirmDialog.type === 'add' && confirmDialog.category) {
      try {
        const categories = JSON.parse(editedValues[confirmDialog.key]) as string[];
        if (!categories.includes(confirmDialog.category)) {
          categories.push(confirmDialog.category);
          handleChange(confirmDialog.key, JSON.stringify(categories));
        } else {
          setError('Esta categoría ya existe');
          setTimeout(() => setError(null), 3000);
        }
        setConfirmDialog(null);
        setNewCategoryInput('');
        setShowAddCategory(null);
      } catch {
        setError('Error al agregar categoría');
        setConfirmDialog(null);
      }
    }
  };

  const handleChange = (key: string, value: string) => {
    setEditedValues({ ...editedValues, [key]: value });
  };

  const handleCancel = (key: string) => {
    const original = configs.find(c => c.key === key);
    if (original) {
      setEditedValues({ ...editedValues, [key]: original.value });
    }
    setEditingKey(null);
  };

  const hasChanges = (key: string) => {
    const config = configs.find(c => c.key === key);
    return config && editedValues[key] !== config.value;
  };

  const formatKey = (key: string) =>
    key.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

  const getIcon = (key: string) => {
    if (key.includes('price') || key.includes('cost') || key.includes('amount')) return DollarSign;
    if (key.includes('categor')) return Tag;
    return SettingsIcon;
  };

  const formatDisplayValue = (config: PlatformConfig, value: string) => {
    if (config.value_type === 'json') {
      try {
        const arr = JSON.parse(value) as string[];
        return arr.map(c => c.charAt(0).toUpperCase() + c.slice(1)).join(', ');
      } catch {
        return value;
      }
    }
    if (config.value_type === 'integer' || config.value_type === 'float') {
      const num = Number(value);
      if (!isNaN(num)) {
        if (config.key.includes('price') || config.key.includes('cost') || config.key.includes('amount')) {
          return `$${num.toLocaleString('es-CL')}`;
        }
        return num.toLocaleString('es-CL');
      }
    }
    return value;
  };

  const handleAddCategory = (key: string) => {
    if (showAddCategory === key && newCategoryInput.trim()) {
      const normalized = newCategoryInput.trim().toLowerCase();
      setConfirmDialog({
        type: 'add',
        key,
        category: normalized,
      });
    } else {
      setShowAddCategory(key);
      setNewCategoryInput('');
      setTimeout(() => addCategoryInputRef.current?.focus(), 50);
    }
  };

  const handleRemoveCategory = (key: string, cat: string) => {
    setConfirmDialog({
      type: 'delete',
      key,
      category: cat,
    });
  };

  const pricingConfigs = configs.filter(c => c.value_type === 'integer' || c.value_type === 'float' || c.value_type === 'string');
  const jsonConfigs = configs.filter(c => c.value_type === 'json');

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-navy-900" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Text variant="h2" className="text-navy-900">Configuración</Text>
        <Text variant="body-sm" color="muted">Precios, costos y configuraciones del sistema</Text>
      </div>

      {/* Alerts */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <Text variant="body-sm" className="text-red-800">{error}</Text>
          <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-600"><X className="w-4 h-4" /></button>
        </div>
      )}
      {success && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <Text variant="body-sm" className="text-emerald-800">{success}</Text>
        </div>
      )}

      {/* Pricing / Values Table */}
      {pricingConfigs.length > 0 && (
        <Box variant="document" padding="none" className="overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-200">
            <Text variant="h4" className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-navy-700" />
              Precios y Valores
            </Text>
            <Text variant="caption" color="muted" className="mt-1">Configuraciones numéricas y de texto del sistema</Text>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-6 py-4"><Text variant="caption" color="muted">CONFIGURACIÓN</Text></th>
                  <th className="text-left px-6 py-4"><Text variant="caption" color="muted">DESCRIPCIÓN</Text></th>
                  <th className="text-left px-6 py-4"><Text variant="caption" color="muted">VALOR</Text></th>
                  <th className="px-6 py-4 w-28"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {pricingConfigs.map((config) => {
                  const Icon = getIcon(config.key);
                  const isEditing = editingKey === config.key;
                  const changed = hasChanges(config.key);

                  return (
                    <tr key={config.key} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-navy-50 rounded-lg">
                            <Icon className="w-4 h-4 text-navy-700" />
                          </div>
                          <Text variant="body-sm" weight="medium" color="primary">
                            {formatKey(config.key)}
                          </Text>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Text variant="body-sm" color="muted">{config.description}</Text>
                      </td>
                      <td className="px-6 py-4">
                        {isEditing ? (
                          <input
                            type={config.value_type === 'integer' || config.value_type === 'float' ? 'number' : 'text'}
                            value={editedValues[config.key] || ''}
                            onChange={(e) => handleChange(config.key, e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && changed) requestSave(config.key);
                              if (e.key === 'Escape') handleCancel(config.key);
                            }}
                            autoFocus
                            className="w-full max-w-[180px] px-3 py-1.5 text-sm border border-navy-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy-900 bg-white"
                          />
                        ) : (
                          <Text variant="body-sm" weight="bold" color="primary" className="font-mono">
                            {formatDisplayValue(config, editedValues[config.key])}
                          </Text>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          {isEditing ? (
                            <>
                              <Button
                                variant="primary"
                                size="sm"
                                onClick={() => requestSave(config.key)}
                                disabled={saving || !changed}
                              >
                                <Save className="w-3.5 h-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleCancel(config.key)}
                              >
                                <X className="w-3.5 h-3.5" />
                              </Button>
                            </>
                          ) : (
                            <button
                              onClick={() => setEditingKey(config.key)}
                              className="p-2 text-slate-400 hover:text-navy-700 hover:bg-navy-50 rounded-lg transition-all"
                              title="Editar"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Box>
      )}

      {/* Categories / JSON Section */}
      {jsonConfigs.map((config) => (
        <Box key={config.key} variant="document" padding="none" className="overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-200 flex items-center justify-between">
            <div>
              <Text variant="h4" className="flex items-center gap-2">
                <Tag className="w-5 h-5 text-navy-700" />
                {formatKey(config.key)}
              </Text>
              <Text variant="caption" color="muted" className="mt-1">{config.description}</Text>
            </div>
            <div className="flex items-center gap-2">
              {hasChanges(config.key) && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => requestSave(config.key)}
                  disabled={saving}
                  className="flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  Guardar
                </Button>
              )}
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleAddCategory(config.key)}
                className="flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                Agregar
              </Button>
            </div>
          </div>

          <div className="p-6">
            {showAddCategory === config.key && (
              <div className="flex items-center gap-2 mb-4">
                <input
                  ref={addCategoryInputRef}
                  type="text"
                  value={newCategoryInput}
                  onChange={(e) => setNewCategoryInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && newCategoryInput.trim()) handleAddCategory(config.key);
                    if (e.key === 'Escape') { setShowAddCategory(null); setNewCategoryInput(''); }
                  }}
                  placeholder="Nombre de la categoría"
                  className="px-3 py-1.5 text-sm border border-navy-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy-900 bg-white"
                />
                <Button variant="primary" size="sm" onClick={() => handleAddCategory(config.key)} disabled={!newCategoryInput.trim()}>
                  <CheckCircle className="w-3.5 h-3.5" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => { setShowAddCategory(null); setNewCategoryInput(''); }}>
                  <X className="w-3.5 h-3.5" />
                </Button>
              </div>
            )}
            <div className="flex flex-wrap gap-2">
              {(() => {
                try {
                  const items = JSON.parse(editedValues[config.key] || '[]') as string[];
                  if (items.length === 0) {
                    return <Text variant="body-sm" color="muted">No hay elementos configurados</Text>;
                  }
                  return items.map((cat) => (
                    <span
                      key={cat}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-navy-50 text-navy-700 rounded-lg text-sm font-medium border border-navy-200 group"
                    >
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                      <button
                        onClick={() => handleRemoveCategory(config.key, cat)}
                        className="text-navy-400 hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100"
                        title="Eliminar"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  ));
                } catch {
                  return <Text variant="body-sm" className="text-red-500">Error al cargar datos</Text>;
                }
              })()}
            </div>
            {hasChanges(config.key) && (
              <Text variant="caption" className="text-amber-600 mt-3 block">• Cambios sin guardar</Text>
            )}
          </div>
        </Box>
      ))}

      {configs.length === 0 && !loading && (
        <div className="text-center py-16">
          <SettingsIcon className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <Text variant="body-sm" color="muted">No hay configuraciones disponibles</Text>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-200 flex items-center gap-3">
              <div className="p-2 bg-amber-100 rounded-lg">
                <ShieldAlert className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <Text variant="h4" color="primary">Confirmar cambio</Text>
                <Text variant="caption" color="muted">
                  {confirmDialog.type === 'save' && 'Estás por modificar una configuración del sistema'}
                  {confirmDialog.type === 'delete' && 'Estás por eliminar un elemento'}
                  {confirmDialog.type === 'add' && 'Estás por agregar un nuevo elemento'}
                </Text>
              </div>
            </div>

            <div className="px-6 py-5 space-y-3">
              <div className="flex items-center gap-2">
                <Text variant="caption" color="muted" className="w-28 flex-shrink-0">Configuración:</Text>
                <Text variant="body-sm" weight="medium" color="primary">{formatKey(confirmDialog.key)}</Text>
              </div>

              {confirmDialog.type === 'save' && (
                <>
                  <div className="flex items-start gap-2">
                    <Text variant="caption" color="muted" className="w-28 flex-shrink-0 mt-0.5">Valor actual:</Text>
                    <span className="px-2.5 py-1 bg-slate-100 rounded text-sm font-mono text-slate-600">
                      {(() => {
                        const cfg = configs.find(c => c.key === confirmDialog.key);
                        return cfg ? formatDisplayValue(cfg, confirmDialog.oldValue || '') : confirmDialog.oldValue;
                      })()}
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Text variant="caption" color="muted" className="w-28 flex-shrink-0 mt-0.5">Nuevo valor:</Text>
                    <span className="px-2.5 py-1 bg-navy-50 border border-navy-200 rounded text-sm font-mono text-navy-800 font-semibold">
                      {(() => {
                        const cfg = configs.find(c => c.key === confirmDialog.key);
                        return cfg ? formatDisplayValue(cfg, confirmDialog.newValue || '') : confirmDialog.newValue;
                      })()}
                    </span>
                  </div>
                </>
              )}

              {confirmDialog.type === 'delete' && confirmDialog.category && (
                <div className="flex items-center gap-2">
                  <Text variant="caption" color="muted" className="w-28 flex-shrink-0">Eliminar:</Text>
                  <span className="px-2.5 py-1 bg-red-50 border border-red-200 rounded text-sm text-red-700 font-medium">
                    {confirmDialog.category.charAt(0).toUpperCase() + confirmDialog.category.slice(1)}
                  </span>
                </div>
              )}

              {confirmDialog.type === 'add' && confirmDialog.category && (
                <div className="flex items-center gap-2">
                  <Text variant="caption" color="muted" className="w-28 flex-shrink-0">Agregar:</Text>
                  <span className="px-2.5 py-1 bg-emerald-50 border border-emerald-200 rounded text-sm text-emerald-700 font-medium">
                    {confirmDialog.category.charAt(0).toUpperCase() + confirmDialog.category.slice(1)}
                  </span>
                </div>
              )}
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setConfirmDialog(null)}
                disabled={saving}
              >
                Cancelar
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleConfirm}
                disabled={saving}
                className="flex items-center gap-1.5"
              >
                {saving ? (
                  <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-white" />
                ) : (
                  <CheckCircle className="w-3.5 h-3.5" />
                )}
                Confirmar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
