// LEGALTECH_frontend/src/pages/admin/TemplatesPage.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ContractUploader } from '../../components/admin/ContractUpload';
import { 
  getAdminTemplates, 
  createTemplate, 
  publishVersion,
  assignCapsulesToVersion,
  getTemplateVersionDownloadUrl,
  deleteTemplateVersion
} from '../../services/api';

interface Template {
  id: number;
  title: string;
  slug: string;
  description: string;
  is_active: boolean;
  versions: Version[];
}

interface Capsule {
  id: number;
  slug: string;
  title: string;
  price: number;
  display_order: number;
  form_schema: any[];
}

interface Version {
  id: number;
  version_number: number;
  base_price: number;
  is_published: boolean;
  created_at: string;
  base_form_schema: any[];
  capsules?: Capsule[];
}

export const TemplatesPage: React.FC = () => {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewTemplateForm, setShowNewTemplateForm] = useState(false);
  const [expandedVersions, setExpandedVersions] = useState<Set<number>>(new Set());
  const [newTemplate, setNewTemplate] = useState({
    title: '',
    slug: '',
    description: ''
  });

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const response = await getAdminTemplates();
      setTemplates(response.data.data);
    } catch (error) {
      console.error('Error loading templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createTemplate(newTemplate);
      setShowNewTemplateForm(false);
      setNewTemplate({ title: '', slug: '', description: '' });
      loadTemplates();
    } catch (error) {
      console.error('Error creating template:', error);
    }
  };

  const handlePublishVersion = async (versionId: number) => {
    try {
      await publishVersion(versionId);
      loadTemplates();
      alert('Versión publicada exitosamente');
    } catch (error) {
      console.error('Error publishing version:', error);
    }
  };

  const handleDownloadVersion = async (versionId: number) => {
    try {
      const result = await getTemplateVersionDownloadUrl(versionId);
      
      if (result.success) {
        // Abrir el archivo en una nueva ventana
        const downloadUrl = result.download_url.startsWith('http') 
          ? result.download_url 
          : `${window.location.origin}${result.download_url}`;
        
        // Crear un elemento temporal para descargar
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = result.filename || 'template.docx';
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (error) {
      console.error('Error downloading version:', error);
      alert('Error al descargar el template');
    }
  };

  const handleDeleteVersion = async (versionId: number, versionNumber: number) => {
    if (!confirm(`¿Estás seguro de eliminar la versión ${versionNumber}? Esto también eliminará todas sus cápsulas asociadas.`)) {
      return;
    }

    try {
      await deleteTemplateVersion(versionId);
      loadTemplates();
      alert('Versión eliminada exitosamente');
    } catch (error) {
      console.error('Error deleting version:', error);
      alert('Error al eliminar la versión');
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-gradient-to-br from-slate-50 via-cyan-50/30 to-lime-50/30 flex items-center justify-center">
      <div className="text-gray-600">Cargando...</div>
    </div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-cyan-50/30 to-lime-50/30" style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '30px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <button
            onClick={() => navigate('/admin')}
            style={{
              padding: '10px 15px',
              backgroundColor: '#757575',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '5px'
            }}
            title="Volver al dashboard"
          >
            ← Volver
          </button>
          <h1 style={{ margin: 0 }}>Gestión de Templates</h1>
        </div>
        <button
          onClick={() => setShowNewTemplateForm(!showNewTemplateForm)}
          style={{
            padding: '10px 20px',
            backgroundColor: '#1976d2',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          {showNewTemplateForm ? 'Cancelar' : '+ Nuevo Template'}
        </button>
      </div>

      {showNewTemplateForm && (
        <form 
          onSubmit={handleCreateTemplate}
          style={{
            marginBottom: '30px',
            padding: '25px',
            border: '1px solid #e0e0e0',
            borderRadius: '8px',
            backgroundColor: 'white',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}
        >
          <h3 style={{ 
            margin: '0 0 20px 0', 
            fontSize: '20px', 
            fontWeight: '600',
            color: '#1976d2'
          }}>
            Crear Nuevo Template
          </h3>
          
          <div style={{ marginBottom: '20px' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '8px', 
              fontWeight: '500',
              color: '#424242',
              fontSize: '14px'
            }}>
              Título:
            </label>
            <input
              type="text"
              value={newTemplate.title}
              onChange={(e) => setNewTemplate({ ...newTemplate, title: e.target.value })}
              required
              placeholder="Ej: Contrato de Arrendamiento"
              style={{ 
                width: '100%', 
                padding: '12px', 
                fontSize: '14px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                transition: 'border-color 0.3s',
                outline: 'none'
              }}
              onFocus={(e) => e.target.style.borderColor = '#1976d2'}
              onBlur={(e) => e.target.style.borderColor = '#ddd'}
            />
          </div>
          
          <div style={{ marginBottom: '20px' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '8px', 
              fontWeight: '500',
              color: '#424242',
              fontSize: '14px'
            }}>
              Slug:
            </label>
            <input
              type="text"
              value={newTemplate.slug}
              onChange={(e) => setNewTemplate({ ...newTemplate, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
              required
              placeholder="ej: contrato-arrendamiento"
              style={{ 
                width: '100%', 
                padding: '12px', 
                fontSize: '14px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontFamily: 'monospace',
                backgroundColor: '#f9f9f9',
                outline: 'none'
              }}
              onFocus={(e) => e.target.style.borderColor = '#1976d2'}
              onBlur={(e) => e.target.style.borderColor = '#ddd'}
            />
            <small style={{ fontSize: '12px', color: '#666', marginTop: '4px', display: 'block' }}>
              Identificador único (solo letras minúsculas, números y guiones)
            </small>
          </div>
          
          <div style={{ marginBottom: '20px' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '8px', 
              fontWeight: '500',
              color: '#424242',
              fontSize: '14px'
            }}>
              Descripción:
            </label>
            <textarea
              value={newTemplate.description}
              onChange={(e) => setNewTemplate({ ...newTemplate, description: e.target.value })}
              placeholder="Describe brevemente este template..."
              style={{ 
                width: '100%', 
                padding: '12px', 
                fontSize: '14px',
                minHeight: '100px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontFamily: 'inherit',
                resize: 'vertical',
                outline: 'none'
              }}
              onFocus={(e) => e.target.style.borderColor = '#1976d2'}
              onBlur={(e) => e.target.style.borderColor = '#ddd'}
            />
          </div>
          
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={() => setShowNewTemplateForm(false)}
              style={{
                padding: '12px 24px',
                backgroundColor: '#f5f5f5',
                color: '#424242',
                border: '1px solid #ddd',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                transition: 'background-color 0.3s'
              }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#e0e0e0'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#f5f5f5'}
            >
              Cancelar
            </button>
            <button
              type="submit"
              style={{
                padding: '12px 24px',
                backgroundColor: '#4caf50',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                transition: 'background-color 0.3s'
              }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#45a049'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#4caf50'}
            >
              Crear Template
            </button>
          </div>
        </form>
      )}

      <div>
        {templates.length === 0 ? (
          <p>No hay templates creados aún.</p>
        ) : (
          templates.map((template) => (
            <div
              key={template.id}
              style={{
                marginBottom: '30px',
                padding: '20px',
                border: '1px solid #ddd',
                borderRadius: '8px',
                backgroundColor: 'white'
              }}
            >
              <div style={{ marginBottom: '20px' }}>
                <h2>{template.title}</h2>
                <p style={{ color: '#666' }}>Slug: {template.slug}</p>
                <p>{template.description}</p>
                <span style={{
                  display: 'inline-block',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  fontSize: '12px',
                  backgroundColor: template.is_active ? '#e8f5e9' : '#ffebee',
                  color: template.is_active ? '#2e7d32' : '#c62828'
                }}>
                  {template.is_active ? 'Activo' : 'Inactivo'}
                </span>
              </div>

              <h3>Versiones</h3>
              {template.versions && template.versions.length > 0 ? (
                <div style={{ marginBottom: '20px' }}>
                  {template.versions.map((version) => (
                    <React.Fragment key={version.id}>
                      <div
                        style={{
                          padding: '15px',
                          marginBottom: '10px',
                          backgroundColor: '#f5f5f5',
                          borderRadius: '4px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}
                      >
                        <div>
                          <strong>Versión {version.version_number}</strong>
                          <span style={{ margin: '0 10px', color: '#666' }}>|</span>
                          <span>Precio base: ${version.base_price}</span>
                          <span style={{ margin: '0 10px', color: '#666' }}>|</span>
                          <span>{new Date(version.created_at).toLocaleDateString()}</span>
                          <span style={{ margin: '0 10px', color: '#666' }}>|</span>
                          <span style={{
                            color: version.is_published ? '#2e7d32' : '#f57c00'
                          }}>
                            {version.is_published ? '✓ Publicada' : 'Draft'}
                          </span>
                          {version.base_form_schema && version.base_form_schema.length > 0 && (
                            <>
                              <span style={{ margin: '0 10px', color: '#666' }}>|</span>
                              <span>{version.base_form_schema.length} campos</span>
                            </>
                          )}
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            onClick={() => handleDownloadVersion(version.id)}
                            style={{
                              padding: '6px 12px',
                              backgroundColor: '#1976d2',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '12px'
                            }}
                            title="Descargar template .docx"
                          >
                            📥 Descargar
                          </button>
                          {!version.is_published && (
                            <>
                              <button
                                onClick={() => handlePublishVersion(version.id)}
                                style={{
                                  padding: '6px 12px',
                                  backgroundColor: '#4caf50',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '4px',
                                  cursor: 'pointer',
                                  fontSize: '12px'
                                }}
                              >
                                Publicar
                              </button>
                              <button
                                onClick={() => handleDeleteVersion(version.id, version.version_number)}
                                style={{
                                  padding: '6px 12px',
                                  backgroundColor: '#d32f2f',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '4px',
                                  cursor: 'pointer',
                                  fontSize: '12px'
                                }}
                                title="Eliminar versión y sus cápsulas"
                              >
                                🗑️ Eliminar
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                      {version.base_form_schema && version.base_form_schema.length > 0 && (
                        <div style={{
                          marginTop: '-5px',
                          marginBottom: '10px',
                          padding: '10px',
                          backgroundColor: '#fff',
                          borderRadius: '4px',
                          border: '1px solid #e0e0e0'
                        }}>
                          <strong>Campos base detectados:</strong>
                          <div style={{ 
                            display: 'grid', 
                            gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
                            gap: '10px',
                            marginTop: '10px'
                          }}>
                            {version.base_form_schema.map((field: any, idx: number) => (
                              <div key={idx} style={{
                                padding: '8px',
                                backgroundColor: '#f9f9f9',
                                borderRadius: '4px',
                                fontSize: '12px'
                              }}>
                                <div style={{ fontWeight: 'bold', color: '#1976d2' }}>
                                  {field.label}
                                </div>
                                <div style={{ color: '#666', marginTop: '4px' }}>
                                  {`{{${field.field_name}}}`}
                                </div>
                                <div style={{ color: '#999', marginTop: '2px' }}>
                                  Tipo: {field.field_type}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* Cápsulas opcionales */}
                      {version.capsules && version.capsules.length > 0 && (
                        <div style={{
                          marginTop: '5px',
                          marginBottom: '15px',
                          padding: '12px',
                          backgroundColor: '#fff3e0',
                          borderRadius: '4px',
                          border: '1px solid #ffb74d'
                        }}>
                          <div
                            onClick={() => {
                              const newExpanded = new Set(expandedVersions);
                              if (newExpanded.has(version.id)) {
                                newExpanded.delete(version.id);
                              } else {
                                newExpanded.add(version.id);
                              }
                              setExpandedVersions(newExpanded);
                            }}
                            style={{
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px'
                            }}
                          >
                            <strong>📦 Cápsulas opcionales ({version.capsules.length})</strong>
                            <span style={{ fontSize: '12px' }}>
                              {expandedVersions.has(version.id) ? '▼' : '▶'}
                            </span>
                          </div>
                          
                          {expandedVersions.has(version.id) && (
                            <div style={{ marginTop: '10px' }}>
                              {version.capsules.map((capsule, idx) => (
                                <div key={idx} style={{
                                  padding: '10px',
                                  marginBottom: '8px',
                                  backgroundColor: '#fff',
                                  borderRadius: '4px',
                                  border: '1px solid #e0e0e0'
                                }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                    <div>
                                      <strong style={{ color: '#f57c00' }}>{capsule.title}</strong>
                                      <span style={{ marginLeft: '8px', fontSize: '12px', color: '#666' }}>
                                        ({capsule.slug})
                                      </span>
                                    </div>
                                    <div style={{
                                      padding: '4px 12px',
                                      backgroundColor: '#4caf50',
                                      color: 'white',
                                      borderRadius: '12px',
                                      fontSize: '14px',
                                      fontWeight: 'bold'
                                    }}>
                                      ${capsule.price.toLocaleString()}
                                    </div>
                                  </div>
                                  
                                  {capsule.form_schema && capsule.form_schema.length > 0 && (
                                    <div style={{
                                      marginTop: '8px',
                                      padding: '8px',
                                      backgroundColor: '#f9f9f9',
                                      borderRadius: '4px'
                                    }}>
                                      <div style={{ fontSize: '12px', color: '#666', marginBottom: '6px' }}>
                                        Variables ({capsule.form_schema.length}):
                                      </div>
                                      <div style={{
                                        display: 'flex',
                                        flexWrap: 'wrap',
                                        gap: '6px'
                                      }}>
                                        {capsule.form_schema.map((field: any, fieldIdx: number) => (
                                          <span key={fieldIdx} style={{
                                            padding: '4px 8px',
                                            backgroundColor: '#fff',
                                            border: '1px solid #ddd',
                                            borderRadius: '4px',
                                            fontSize: '11px',
                                            color: '#666'
                                          }}>
                                            {`{{${field.field_name}}}`}
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </React.Fragment>
                  ))}
                </div>
              ) : (
                <p style={{ color: '#666', marginBottom: '20px' }}>
                  No hay versiones creadas aún.
                </p>
              )}

              <h4>Subir Nueva Versión</h4>
              <ContractUploader 
                templateId={template.id} 
                onUploadSuccess={() => loadTemplates()}
              />
            </div>
          ))
        )}
      </div>
    </div>
  );
};