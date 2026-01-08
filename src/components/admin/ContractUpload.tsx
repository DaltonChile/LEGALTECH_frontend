// LEGALTECH_frontend/src/components/admin/ContractUploader.tsx
import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { uploadTemplateVersion, setCapsulePrices } from '../../services/api';

interface ContractUploaderProps {
  templateId: string;
  onUploadSuccess?: (data: any) => void;
}

interface CapsulePending {
  slug: string;
  title: string;
  legal_text: string;
  form_schema: any[];
  display_order: number;
  variables_count: number;
  price?: number;
}

export const ContractUploader: React.FC<ContractUploaderProps> = ({ 
  templateId, 
  onUploadSuccess 
}) => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<any>(null);
  const [basePrice, setBasePrice] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  // Estados para el flujo de asignación de precios
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [capsulesWithPrices, setCapsulesWithPrices] = useState<CapsulePending[]>([]);
  const [versionId, setVersionId] = useState<string | null>(null);
  const [assigningPrices, setAssigningPrices] = useState(false);

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Por favor selecciona un archivo');
      return;
    }

    if (!basePrice || parseInt(basePrice) <= 0) {
      setError('Por favor ingresa un precio base válido');
      return;
    }

    setUploading(true);
    setError(null);
    setSuccess(null);
    setProgress(0);

    try {
      // Simular progreso
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const response = await uploadTemplateVersion(templateId, selectedFile, parseInt(basePrice));
      
      clearInterval(progressInterval);
      setProgress(100);
      
      // Verificar si hay cápsulas pendientes de asignar precio
      if (response.data.requires_capsule_pricing && response.data.data.capsules_pending_price) {
        // Guardar la versión ID y las cápsulas
        setVersionId(response.data.data.version.id);
        
        // Inicializar los precios sugeridos
        const capsulesWithDefaultPrices = response.data.data.capsules_pending_price.map((cap: CapsulePending) => ({
          ...cap,
          price: 10000 // Precio por defecto
        }));
        
        setCapsulesWithPrices(capsulesWithDefaultPrices);
        setShowPricingModal(true);
      } else {
        // No hay cápsulas, mostrar éxito normal
        setSuccess(response.data);
        setSelectedFile(null);
        setBasePrice('');
        
        if (onUploadSuccess) {
          onUploadSuccess(response.data);
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al subir el archivo');
    } finally {
      setUploading(false);
    }
  };

  const handlePriceChange = (slug: string, price: string) => {
    setCapsulesWithPrices(prev => 
      prev.map(cap => 
        cap.slug === slug ? { ...cap, price: parseInt(price) || 0 } : cap
      )
    );
  };

  const handleAssignPrices = async () => {
    if (!versionId) return;
    
    // Validar que todas las cápsulas tengan precio
    const invalidCapsules = capsulesWithPrices.filter(cap => !cap.price || cap.price <= 0);
    if (invalidCapsules.length > 0) {
      setError(`Las siguientes cápsulas necesitan un precio válido: ${invalidCapsules.map(c => c.slug).join(', ')}`);
      return;
    }
    
    setAssigningPrices(true);
    setError(null);
    
    try {
      await setCapsulePrices(versionId, capsulesWithPrices);
      
      // Éxito: cerrar modal y mostrar mensaje
      setShowPricingModal(false);
      setSuccess({
        message: `Versión creada con ${capsulesWithPrices.length} cápsulas. Puedes publicarla ahora.`,
        data: { capsules: capsulesWithPrices }
      });
      
      setSelectedFile(null);
      setBasePrice('');
      setCapsulesWithPrices([]);
      setVersionId(null);
      
      if (onUploadSuccess) {
        onUploadSuccess({ versionId, capsules: capsulesWithPrices });
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al asignar precios a las cápsulas');
    } finally {
      setAssigningPrices(false);
    }
  };

  const handleCancelPricing = () => {
    setShowPricingModal(false);
    setCapsulesWithPrices([]);
    setVersionId(null);
    setError('Versión creada pero las cápsulas no tienen precios asignados. Puedes asignarlos después.');
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;
    
    setSelectedFile(file);
    setError(null);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    multiple: false,
    disabled: uploading
  });

  return (
    <div className="contract-uploader">
      <div
        {...getRootProps()}
        className={`dropzone ${isDragActive ? 'active' : ''} ${uploading ? 'disabled' : ''}`}
        style={{
          border: '2px dashed #ccc',
          borderRadius: '8px',
          padding: '40px',
          textAlign: 'center',
          cursor: uploading ? 'not-allowed' : 'pointer',
          backgroundColor: isDragActive ? '#f0f8ff' : selectedFile ? '#e8f5e9' : '#fafafa',
          transition: 'all 0.3s ease'
        }}
      >
        <input {...getInputProps()} />
        {uploading ? (
          <div>
            <p>Subiendo archivo...</p>
            <div style={{ 
              width: '100%', 
              height: '20px', 
              backgroundColor: '#e0e0e0',
              borderRadius: '10px',
              overflow: 'hidden',
              marginTop: '10px'
            }}>
              <div style={{
                width: `${progress}%`,
                height: '100%',
                backgroundColor: '#4caf50',
                transition: 'width 0.3s ease'
              }} />
            </div>
            <p style={{ marginTop: '10px' }}>{progress}%</p>
          </div>
        ) : selectedFile ? (
          <div>
            <p>✅ Archivo seleccionado: <strong>{selectedFile.name}</strong></p>
            <p style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
              Haz clic para cambiar el archivo
            </p>
          </div>
        ) : isDragActive ? (
          <p>📄 Suelta el archivo aquí...</p>
        ) : (
          <div>
            <p>📤 Arrastra un archivo .docx aquí o haz clic para seleccionar</p>
            <p style={{ fontSize: '12px', color: '#666', marginTop: '10px' }}>
              Tamaño máximo: 10MB
            </p>
          </div>
        )}
      </div>

      {selectedFile && !uploading && (
        <div style={{ marginTop: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
            💰 Precio base del template (CLP):
          </label>
          <input
            type="number"
            value={basePrice}
            onChange={(e) => setBasePrice(e.target.value)}
            placeholder="Ej: 50000"
            min="0"
            step="1000"
            style={{
              width: '100%',
              padding: '10px',
              fontSize: '16px',
              border: '1px solid #ccc',
              borderRadius: '4px'
            }}
          />
          <button
            onClick={handleUpload}
            disabled={!basePrice || uploading}
            style={{
              marginTop: '15px',
              width: '100%',
              padding: '12px',
              backgroundColor: basePrice ? '#4caf50' : '#ccc',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: basePrice ? 'pointer' : 'not-allowed',
              fontSize: '16px',
              fontWeight: 'bold'
            }}
          >
            Subir Template
          </button>
        </div>
      )}

      {error && (
        <div style={{
          marginTop: '20px',
          padding: '15px',
          backgroundColor: '#ffebee',
          color: '#c62828',
          borderRadius: '4px'
        }}>
          ❌ {error}
        </div>
      )}

      {success && (
        <div style={{
          marginTop: '20px',
          padding: '15px',
          backgroundColor: '#e8f5e9',
          color: '#2e7d32',
          borderRadius: '4px'
        }}>
          <p style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '10px' }}>
            ✅ {success.message}
          </p>
          
          {success.base_variables_detected > 0 && (
            <div style={{ marginTop: '15px', padding: '10px', backgroundColor: '#fff', borderRadius: '4px' }}>
              <strong>📝 Variables base detectadas: {success.base_variables_detected}</strong>
            </div>
          )}
          
          {success.data?.capsules && success.data.capsules.length > 0 && (
            <div style={{ marginTop: '15px', padding: '15px', backgroundColor: '#fff', borderRadius: '4px' }}>
              <strong>📦 Cápsulas creadas ({success.data.capsules.length}):</strong>
              <ul style={{ marginTop: '10px', marginLeft: '0', paddingLeft: '20px' }}>
                {success.data.capsules.map((capsule: any, index: number) => (
                  <li key={index} style={{ marginBottom: '8px' }}>
                    <strong>{capsule.slug}</strong>
                    <span style={{ margin: '0 8px', color: '#666' }}>|</span>
                    <span style={{ color: '#2e7d32' }}>${capsule.price?.toLocaleString()}</span>
                    <span style={{ margin: '0 8px', color: '#666' }}>|</span>
                    <span style={{ fontSize: '12px', color: '#666' }}>{capsule.variables_count || 0} variables</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Modal para asignar precios a las cápsulas */}
      {showPricingModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '30px',
            maxWidth: '600px',
            maxHeight: '80vh',
            overflow: 'auto',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)'
          }}>
            <h2 style={{ marginTop: 0, marginBottom: '20px' }}>
              💰 Asignar Precios a las Cápsulas
            </h2>
            
            <p style={{ color: '#666', marginBottom: '20px' }}>
              Se detectaron <strong>{capsulesWithPrices.length} cápsulas opcionales</strong> en el contrato. 
              Asigna un precio a cada una:
            </p>

            {capsulesWithPrices.map((capsule, index) => (
              <div key={capsule.slug} style={{
                padding: '15px',
                marginBottom: '15px',
                border: '1px solid #e0e0e0',
                borderRadius: '8px',
                backgroundColor: '#fafafa'
              }}>
                <div style={{ marginBottom: '10px' }}>
                  <strong style={{ fontSize: '16px', color: '#1976d2' }}>
                    {index + 1}. {capsule.title}
                  </strong>
                  <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
                    📝 {capsule.variables_count} variable(s) | Orden: {capsule.display_order}
                  </div>
                </div>
                
                <div style={{ 
                  fontSize: '13px', 
                  color: '#555', 
                  marginBottom: '10px',
                  maxHeight: '60px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  {capsule.legal_text.substring(0, 150)}...
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '14px' }}>
                    Precio (CLP):
                  </label>
                  <input
                    type="number"
                    value={capsule.price || ''}
                    onChange={(e) => handlePriceChange(capsule.slug, e.target.value)}
                    placeholder="Ej: 10000"
                    min="0"
                    step="1000"
                    style={{
                      width: '100%',
                      padding: '8px',
                      fontSize: '16px',
                      border: '1px solid #ccc',
                      borderRadius: '4px'
                    }}
                  />
                </div>
              </div>
            ))}

            <div style={{ 
              marginTop: '25px', 
              display: 'flex', 
              gap: '10px',
              justifyContent: 'flex-end'
            }}>
              <button
                onClick={handleCancelPricing}
                disabled={assigningPrices}
                style={{
                  padding: '12px 24px',
                  backgroundColor: '#757575',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: assigningPrices ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  fontWeight: 'bold'
                }}
              >
                Cancelar
              </button>
              <button
                onClick={handleAssignPrices}
                disabled={assigningPrices}
                style={{
                  padding: '12px 24px',
                  backgroundColor: assigningPrices ? '#ccc' : '#4caf50',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: assigningPrices ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  fontWeight: 'bold'
                }}
              >
                {assigningPrices ? 'Guardando...' : 'Guardar Precios'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};