import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

// ============================================
// Types
// ============================================

export type SignatureType = 'none' | 'simple' | 'fea';

export interface PricingOption {
  label: string;
  price_per_signer: number;
  description: string;
  requires_notary?: boolean;
}

export interface PricingOptions {
  base_price: number;
  none: PricingOption;
  simple: PricingOption;
  fea: PricingOption;
}

export interface CalculatePriceParams {
  signer_count: number;
  signature_type: SignatureType;
  custom_notary?: boolean;
}

export interface PriceBreakdown {
  signature_type: SignatureType;
  signer_count: number;
  price_per_signer: number;
  total_signature_cost: number;
  custom_notary: boolean;
  total: number;
}

export interface CreateCustomDocumentParams {
  pdf: File;
  buyer_rut: string;
  buyer_email: string;
  signature_type: SignatureType;
  custom_notary?: boolean;
  signers: Array<{
    full_name: string;
    email: string;
    rut: string;
    role?: string;
  }>;
}

export interface CustomDocumentResponse {
  id: string;
  tracking_code: string;
  status: string;
  signature_type: SignatureType;
  signer_count: number;
  custom_notary: boolean;
  total_amount: number;
  buyer_email: string;
  buyer_rut: string;
  signers: Array<{
    id: string;
    full_name: string;
    email: string;
    rut: string;
    role: string;
    has_signed: boolean;
  }>;
}

export interface CustomDocumentStatus {
  id: string;
  tracking_code: string;
  status: string;
  signature_type: SignatureType;
  custom_notary: boolean;
  total_amount: number;
  signers: Array<{
    full_name: string;
    email: string;
    role: string;
    has_signed: boolean;
    signed_at: string | null;
  }>;
  created_at: string;
  payment_status: string;
}

// ============================================
// API Functions
// ============================================

/**
 * Get pricing options for custom documents
 */
export const getPricingOptions = async (): Promise<PricingOptions> => {
  const response = await api.get<{ success: boolean; data: PricingOptions }>(
    '/custom-documents/pricing-options'
  );
  return response.data.data;
};

/**
 * Calculate price for a custom document
 */
export const calculatePrice = async (
  params: CalculatePriceParams
): Promise<PriceBreakdown> => {
  const response = await api.post<{ success: boolean; data: PriceBreakdown }>(
    '/custom-documents/calculate-price',
    params
  );
  return response.data.data;
};

/**
 * Create a new custom document request
 */
export const createCustomDocument = async (
  params: CreateCustomDocumentParams
): Promise<CustomDocumentResponse> => {
  const formData = new FormData();
  formData.append('pdf', params.pdf);
  formData.append('buyer_rut', params.buyer_rut);
  formData.append('buyer_email', params.buyer_email);
  formData.append('signature_type', params.signature_type);
  formData.append('custom_notary', String(params.custom_notary || false));
  formData.append('signers', JSON.stringify(params.signers));

  const response = await api.post<{ success: boolean; data: CustomDocumentResponse }>(
    '/custom-documents',
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );
  return response.data.data;
};

/**
 * Get custom document by tracking code
 */
export const getCustomDocument = async (
  trackingCode: string
): Promise<CustomDocumentResponse> => {
  const response = await api.get<{ success: boolean; data: CustomDocumentResponse }>(
    `/custom-documents/${trackingCode}`
  );
  return response.data.data;
};

/**
 * Get custom document status
 */
export const getCustomDocumentStatus = async (
  trackingCode: string,
  rut: string
): Promise<CustomDocumentStatus> => {
  const response = await api.get<{ success: boolean; data: CustomDocumentStatus }>(
    `/custom-documents/${trackingCode}/status`,
    { params: { rut } }
  );
  return response.data.data;
};

/**
 * Update signers for a custom document
 */
export const updateSigners = async (
  trackingCode: string,
  signers: Array<{
    full_name: string;
    email: string;
    rut: string;
    role?: string;
  }>
): Promise<CustomDocumentResponse> => {
  const response = await api.put<{ success: boolean; data: CustomDocumentResponse }>(
    `/custom-documents/${trackingCode}/signers`,
    { signers }
  );
  return response.data.data;
};

/**
 * Replace PDF for a custom document
 */
export const replacePdf = async (
  trackingCode: string,
  pdf: File
): Promise<CustomDocumentResponse> => {
  const formData = new FormData();
  formData.append('pdf', pdf);

  const response = await api.put<{ success: boolean; data: CustomDocumentResponse }>(
    `/custom-documents/${trackingCode}/pdf`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );
  return response.data.data;
};

/**
 * Get PDF preview URL
 */
export const getPreviewUrl = (trackingCode: string, rut: string): string => {
  return `${API_BASE_URL}/custom-documents/${trackingCode}/preview?rut=${encodeURIComponent(rut)}`;
};

export default {
  getPricingOptions,
  calculatePrice,
  createCustomDocument,
  getCustomDocument,
  getCustomDocumentStatus,
  updateSigners,
  replacePdf,
  getPreviewUrl,
};
