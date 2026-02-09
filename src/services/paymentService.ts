import api from './api';

// Interfaces
export interface CreatePreferenceRequest {
  contract_id: string;
  tracking_code: string;
  rut: string;
}

export interface CreatePreferenceResponse {
  success: boolean;
  data: {
    payment_id: string;
    preference_id: string;
    public_key: string;
    amount: number;
  };
}

export interface PaymentStatusResponse {
  success: boolean;
  data: {
    contract_id: string;
    contract_status: 'pending_payment' | 'draft' | 'waiting_signatures' | 'waiting_notary' | 'completed' | 'failed';
    payment_status: 'pending' | 'approved' | 'rejected' | 'in_process';
    payment_id: string;
    amount: number;
    tracking_code: string;
  };
}

class PaymentService {
  /**
   * Crear preferencia de pago en el backend
   */
  async createPreference(data: CreatePreferenceRequest): Promise<CreatePreferenceResponse> {
    const response = await api.post<CreatePreferenceResponse>('/payments/create', data);
    return response.data;
  }

  /**
   * Consultar estado de pago (para polling después del pago)
   */
  async getPaymentStatus(
    contractId: string, 
    trackingCode: string, 
    rut: string
  ): Promise<PaymentStatusResponse> {
    const response = await api.get<PaymentStatusResponse>(`/payments/status/${contractId}`, {
      params: { 
        tracking_code: trackingCode, 
        rut 
      }
    });
    return response.data;
  }

  /**
   * Polling del estado del pago con retry
   * Retorna cuando el estado cambia a 'draft' o alcanza maxAttempts
   */
  async pollPaymentStatus(
    contractId: string,
    trackingCode: string,
    rut: string,
    options: {
      intervalMs?: number;
      maxAttempts?: number;
      onStatusChange?: (status: PaymentStatusResponse['data']) => void;
    } = {}
  ): Promise<PaymentStatusResponse['data']> {
    const { 
      intervalMs = 800, // Chequeo cada 800ms para respuesta rápida
      maxAttempts = 25, // 20 segundos total (800ms × 25 = 20s)
      onStatusChange 
    } = options;

    let attempts = 0;

    return new Promise((resolve, reject) => {
      const checkStatus = async () => {
        try {
          attempts++;
          const response = await this.getPaymentStatus(contractId, trackingCode, rut);
          
          if (onStatusChange) {
            onStatusChange(response.data);
          }

          // VALIDACIÓN: Esperamos confirmación del WEBHOOK
          // El pago debe estar 'approved' Y el contrato debe haber avanzado
          // de 'pending_payment' a cualquier estado posterior (draft, waiting_notary, etc.)
          const isPaymentApproved = response.data.payment_status === 'approved';
          const postPaymentStatuses = ['draft', 'waiting_notary', 'waiting_signatures', 'completed'];
          const isContractReady = postPaymentStatuses.includes(response.data.contract_status);
          
          if (isPaymentApproved && isContractReady) {
            resolve(response.data);
            return;
          }
          
          // Wait for webhook to update contract status
          if (isPaymentApproved && !isContractReady) {
            // Payment approved but contract not ready yet - webhook still processing
          }

          // Si el pago fue rechazado
          if (response.data.payment_status === 'rejected' || response.data.contract_status === 'failed') {
            reject(new Error('Pago rechazado'));
            return;
          }

          // Si alcanzamos el máximo de intentos
          if (attempts >= maxAttempts) {
            reject(new Error('Tiempo de espera agotado'));
            return;
          }

          // Continuar polling
          setTimeout(checkStatus, intervalMs);
        } catch (error) {
          if (attempts >= maxAttempts) {
            reject(error);
            return;
          }
          // Reintentar en caso de error de red
          setTimeout(checkStatus, intervalMs);
        }
      };

      checkStatus();
    });
  }
}

export const paymentService = new PaymentService();
export default paymentService;
