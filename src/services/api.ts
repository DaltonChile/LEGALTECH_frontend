import axios from 'axios';

// Use relative base URL so Vite dev proxy can forward to backend.
// This also keeps cookies same-origin from the browser's perspective during development.
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface Template {
  id: string;
  title: string;
  slug: string;
  base_price: number;
  description: string;
}

export interface TemplateDetail extends Template {
  version_id: string;
  base_form_schema: any[];
  capsules: Array<{
    id: string;
    title: string;
    price: number;
    form_schema: any[];
  }>;
}

export const templatesApi = {
  getAll: async (): Promise<Template[]> => {
    const response = await api.get<{ data: Template[] }>('/templates');
    return response.data.data;
  },

  getBySlug: async (slug: string): Promise<TemplateDetail> => {
    const response = await api.get<{ data: TemplateDetail }>(`/templates/${slug}`);
    return response.data.data;
  },
};

// Agregar estas funciones a LEGALTECH_frontend/src/services/api.ts

export const uploadTemplateVersion = async (templateId: number, file: File, basePrice: number = 0) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('base_price', basePrice.toString());

  const response = await api.post(
    `/admin/templates/${templateId}/versions/upload`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );
  return response;
};

export const getAdminTemplates = async () => {
  return await api.get('/admin/templates');
};

export const createTemplate = async (data: { 
  title: string; 
  slug: string; 
  description: string;
}) => {
  return await api.post('/admin/templates', data);
};

export const publishVersion = async (versionId: number) => {
  return await api.post(`/admin/versions/${versionId}/publish`);
};

export const assignCapsulesToVersion = async (
  versionId: number, 
  capsules: { capsule_id: number; display_order: number }[]
) => {
  return await api.post(`/admin/versions/${versionId}/capsules`, { capsules });
};

export const getTemplateVersionDownloadUrl = async (versionId: number) => {
  const response = await api.get(`/admin/versions/${versionId}/download`);
  return response.data;
};

export const deleteTemplateVersion = async (versionId: number) => {
  return await api.delete(`/admin/versions/${versionId}`);
};

// ============================================
// APIs para Editor de Contratos
// ============================================

export const getContract = async (
  contractId: string,
  trackingCode: string,
  rut: string
) => {
  return await api.get(`/contracts/${contractId}`, {
    params: { tracking_code: trackingCode, rut }
  });
};

export const updateContractForm = async (
  contractId: string,
  trackingCode: string,
  rut: string,
  formData: Record<string, any>
) => {
  return await api.patch(`/contracts/${contractId}`, {
    tracking_code: trackingCode,
    rut,
    form_data: formData
  });
};

export const getContractPreview = async (
  contractId: string,
  trackingCode: string,
  rut: string
) => {
  return await api.get(`/contracts/${contractId}/preview`, {
    params: { tracking_code: trackingCode, rut }
  });
};

export const createContractRequest = async (data: {
  template_version_id: string;
  buyer_rut: string;
  buyer_email: string;
  capsule_ids?: string[];
  form_data?: Record<string, any>;
  requires_notary?: boolean;
}) => {
  return await api.post('/contracts', data);
};

export default api;
