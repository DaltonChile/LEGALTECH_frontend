import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

export interface CustomContractSigner {
    full_name: string;
    rut: string;
    email: string;
    phone?: string;
    role?: string;
}

export interface CustomContractData {
    buyer_rut: string;
    buyer_email: string;
    signature_type: 'simple' | 'fea' | 'none';
    signers: CustomContractSigner[];
    require_notary: boolean;
}

export interface CustomContractResponse {
    id: string;
    tracking_code: string;
    total_amount: number;
    price_breakdown: {
        base: number;
        signatures: number;
        notary: number;
    };
    status: string;
    signers_count: number;
    require_notary: boolean;
}

export interface PricingInfo {
    basePrice: number;
    fes: {
        pricePerSigner: number;
    };
    fea: {
        pricePerSigner: number;
    };
    notary: number;
}

export interface CustomContractResumeData {
    id: string;
    tracking_code: string;
    status: string;
    is_custom_upload: boolean;
    total_amount: number;
    signature_type: string;
    signature_price: number;
    buyer_rut: string;
    buyer_email: string;
    pdf_path: string;
    original_filename: string;
    require_notary: boolean;
    signers: Array<{
        id: string;
        full_name: string;
        rut: string;
        email: string;
        phone: string;
        role: string;
        has_signed: boolean;
        signed_at: string | null;
        display_order: number;
    }>;
}

/**
 * Upload custom PDF document and create contract
 */
export async function uploadCustomDocument(
    file: File,
    data: CustomContractData
): Promise<CustomContractResponse> {
    const formData = new FormData();
    formData.append('document', file);
    formData.append('buyer_rut', data.buyer_rut);
    formData.append('buyer_email', data.buyer_email);
    formData.append('signature_type', data.signature_type);
    formData.append('signers', JSON.stringify(data.signers));
    formData.append('require_notary', String(data.require_notary));

    const response = await axios.post(
        `${API_URL}/custom-contracts/upload`,
        formData,
        {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        }
    );

    if (!response.data.success) {
        throw new Error(response.data.error || 'Error al subir documento');
    }

    return response.data.data;
}

/**
 * Get pricing information for custom documents
 */
export async function getCustomPricingInfo(): Promise<PricingInfo> {
    const response = await axios.get(`${API_URL}/custom-contracts/pricing`);

    if (!response.data.success) {
        throw new Error(response.data.error || 'Error al obtener precios');
    }

    return response.data.data;
}

/**
 * Resume a custom contract flow
 */
export async function resumeCustomContract(
    params: { id?: string; code?: string; rut: string }
): Promise<CustomContractResumeData> {
    const queryParams = new URLSearchParams();
    if (params.id) queryParams.append('id', params.id);
    if (params.code) queryParams.append('code', params.code);
    queryParams.append('rut', params.rut);

    const response = await axios.get(
        `${API_URL}/custom-contracts/resume?${queryParams.toString()}`
    );

    if (!response.data.success) {
        throw new Error(response.data.error || 'Error al recuperar contrato');
    }

    return response.data.data;
}

/**
 * Calculate custom contract price (client-side helper)
 */
export function calculateCustomPrice(
    pricing: PricingInfo,
    signatureType: 'simple' | 'fea' | 'none',
    signersCount: number,
    requireNotary: boolean
): {
    basePrice: number;
    signaturePrice: number;
    notaryPrice: number;
    totalPrice: number;
} {
    let signaturePrice = 0;

    if (signatureType === 'simple' && signersCount > 0) {
        signaturePrice = signersCount * pricing.fes.pricePerSigner;
    } else if (signatureType === 'fea' && signersCount > 0) {
        signaturePrice = signersCount * pricing.fea.pricePerSigner;
    }

    const notaryPrice = requireNotary ? pricing.notary : 0;
    const totalPrice = pricing.basePrice + signaturePrice + notaryPrice;

    return {
        basePrice: pricing.basePrice,
        signaturePrice,
        notaryPrice,
        totalPrice,
    };
}
