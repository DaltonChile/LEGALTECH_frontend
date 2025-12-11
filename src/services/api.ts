import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
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

export default api;
