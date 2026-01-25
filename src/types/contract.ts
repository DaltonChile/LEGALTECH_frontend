export type ContractStatus = 
  | 'pending_payment'    // 30% completado, esperando pago
  | 'draft'              // Pagado, puede completar formulario
  | 'waiting_signatures' // Aprobado, esperando firmas
  | 'waiting_notary'     // Esperando firma de notario
  | 'completed'          // Completado
  | 'failed';            // Fallido

export interface ContractData {
  id: string;
  tracking_code: string;
  status: ContractStatus;
  form_data: Record<string, string>;
  template_version_id: string;
  total_amount: number;
  signature_type: 'none' | 'simple' | 'fea';
  signature_price: number;
  selectedCapsules: Array<{
    id: number;
    price_at_purchase: number;
  }>;
  buyer_rut: string;
  buyer_email: string;
  template?: {
    id: string;
    title: string;
    slug: string;
    requires_notary: boolean;
  };
  templateVersion?: {
    id: string;
    template_content: string;
    base_form_schema: any[];
    signers_config: any[];
    clause_numbering?: any[];
  };
}

export interface InitialFormData {
  template_version_id: string;
  buyer_rut: string;
  buyer_email: string;
  capsule_ids: number[];
  form_data: Record<string, string>;
  signature_type: 'none' | 'simple' | 'fea';
}

export interface InitialFormResponse {
  id: string;
  tracking_code: string;
  total_amount: number;
  signature_price: number;
  status: ContractStatus;
}
