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
    const response = await api.get<{ data: Template[] }>('/templates/catalog');
    return response.data.data || [];
  },

  getBySlug: async (slug: string): Promise<TemplateDetail> => {
    const response = await api.get<{ data: TemplateDetail }>(`/templates/${slug}`);
    return response.data.data;
  },
};

// Agregar estas funciones a LEGALTECH_frontend/src/services/api.ts

export const uploadTemplateVersion = async (templateId: string, file: File, basePrice: number = 0) => {
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
  requires_notary?: boolean;
}) => {
  return await api.post('/admin/templates', data);
};

export const publishVersion = async (versionId: string) => {
  return await api.post(`/admin/versions/${versionId}/publish`);
};

export const assignCapsulesToVersion = async (
  versionId: string, 
  capsules: { capsule_id: number; display_order: number }[]
) => {
  return await api.post(`/admin/versions/${versionId}/capsules`, { capsules });
};

export const getTemplateVersionDownloadUrl = async (versionId: string) => {
  const response = await api.get(`/admin/versions/${versionId}/download`);
  return response.data;
};

export const deleteTemplateVersion = async (versionId: string) => {
  return await api.delete(`/admin/versions/${versionId}`);
};

export const deleteTemplate = async (templateId: string, hardDelete: boolean = false) => {
  const params = hardDelete ? { hard: 'true' } : {};
  return await api.delete(`/admin/templates/${templateId}`, { params });
};

export const deleteObsoleteVersions = async (templateId: string) => {
  return await api.delete(`/admin/templates/${templateId}/obsolete-versions`);
};

export const setCapsulePrices = async (versionId: string, capsules: any[]) => {
  return await api.post(`/admin/versions/${versionId}/capsules/set-prices`, { capsules });
};

// ============================================
// APIs para Admin Users
// ============================================

export const getAdminUsers = async (params?: { role?: string; is_active?: boolean }) => {
  return await api.get('/admin/users', { params });
};

export const createUser = async (data: {
  email: string;
  password: string;
  full_name: string;
  role: 'admin' | 'notario';
  rut?: string;
}) => {
  return await api.post('/admin/users', data);
};

export const updateUser = async (userId: string, data: {
  email?: string;
  password?: string;
  full_name?: string;
  rut?: string;
}) => {
  return await api.put(`/admin/users/${userId}`, data);
};

export const deleteUser = async (userId: string) => {
  return await api.delete(`/admin/users/${userId}`);
};

export const reactivateUser = async (userId: string) => {
  return await api.post(`/admin/users/${userId}/reactivate`);
};

// ============================================
// APIs para Admin Contracts
// ============================================

export const getAdminContracts = async (params?: { status?: string; page?: number; limit?: number }) => {
  return await api.get('/admin/contracts', { params });
};

export const getAdminContractById = async (contractId: string) => {
  return await api.get(`/admin/contracts/${contractId}`);
};

// ============================================
// APIs para Dashboard
// ============================================

export const getDashboardStats = async () => {
  return await api.get('/admin/dashboard/stats');
};

export const getDashboardWeeklyActivity = async () => {
  return await api.get('/admin/dashboard/weekly-activity');
};

export const getDashboardMonthlyActivity = async () => {
  return await api.get('/admin/dashboard/monthly-activity');
};

export const getDashboardRecentContracts = async (limit?: number) => {
  return await api.get('/admin/dashboard/recent-contracts', { params: { limit } });
};

export const getDashboardPopularTemplates = async (limit?: number) => {
  return await api.get('/admin/dashboard/popular-templates', { params: { limit } });
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
  signature_type?: string;
}) => {
  return await api.post('/contracts', data);
};

export const updateTemplateStatus = async (templateId: string, isActive: boolean) => {
  console.log('📤 API: Updating template', { templateId, isActive, type: typeof templateId });
  console.log('📤 API: Base URL:', API_BASE_URL);
  console.log('📤 API: Full URL will be:', `${API_BASE_URL}/admin/templates/${templateId}`);
  const response = await api.put(`/admin/templates/${templateId}`, { is_active: isActive });
  console.log('📥 API: Response:', response.data);
  return response.data;
};

// ============================================
// APIs para Platform Configuration
// ============================================

export interface PlatformConfig {
  id: string;
  key: string;
  value: string;
  value_type: 'string' | 'integer' | 'float' | 'boolean';
  description: string;
  is_editable_by_admin: boolean;
}

export const getPlatformConfig = async (): Promise<PlatformConfig[]> => {
  const response = await api.get<{ success: boolean; data: PlatformConfig[] }>('/admin/config');
  return response.data.data || [];
};

export const updatePlatformConfig = async (key: string, value: string | number): Promise<void> => {
  await api.put(`/admin/config/${key}`, { value });
};

// ============================================
// APIs para Notario
// ============================================

export interface NotaryContract {
  id: string;
  tracking_code: string;
  buyer_email: string;
  buyer_rut: string;
  status: 'waiting_notary' | 'signed';
  total_amount: number;
  requires_notary: boolean;
  draft_pdf_path: string | null;
  final_pdf_path: string | null;
  created_at: string;
  templateVersion: {
    template: {
      title: string;
      slug: string;
    };
  };
  signers: Array<{
    id: string;
    full_name: string;
    email: string;
    role: string;
    has_signed: boolean;
    signed_at: string | null;
  }>;
}

export const notaryApi = {
  getContracts: async (): Promise<NotaryContract[]> => {
    const response = await api.get<{ success: boolean; data: NotaryContract[] }>('/notary/contracts');
    return response.data.data || [];
  },

  downloadContract: async (contractId: string) => {
    const response = await api.get<{ success: boolean; download_url: string; filename: string }>(`/notary/contracts/${contractId}/download`);
    return response.data;
  },

  uploadSignedContract: async (contractId: string, file: File) => {
    const formData = new FormData();
    formData.append('signed_pdf', file);
    const response = await api.post(`/notary/contracts/${contractId}/upload-signed`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};

export default api;
