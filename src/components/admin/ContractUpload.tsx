// LEGALTECH_frontend/src/components/admin/ContractUploader.tsx
import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { uploadTemplateVersion } from '../../services/api';

interface ContractUploaderProps {
  templateId: number;
  onUploadSuccess?: (data: any) => void;
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
      setSuccess(response.data);
      setSelectedFile(null);
      setBasePrice('');
      
      if (onUploadSuccess) {
        onUploadSuccess(response.data);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al subir el archivo');
    } finally {
      setUploading(false);
    }
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
              <strong>📦 Cápsulas opcionales detectadas ({success.data.capsules.length}):</strong>
              <ul style={{ marginTop: '10px', marginLeft: '0', paddingLeft: '20px' }}>
                {success.data.capsules.map((capsule: any, index: number) => (
                  <li key={index} style={{ marginBottom: '8px' }}>
                    <strong>{capsule.slug}</strong>
                    <span style={{ margin: '0 8px', color: '#666' }}>|</span>
                    <span style={{ color: '#2e7d32' }}>${capsule.price.toLocaleString()}</span>
                    <span style={{ margin: '0 8px', color: '#666' }}>|</span>
                    <span style={{ fontSize: '12px', color: '#666' }}>{capsule.variables} variables</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};