export interface PaymentInfo {
  id: string;
  provider: string;
  external_transaction_id: string | null;
  amount: number;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  processor_fee: number | null;
  net_amount: number | null;
  iva_amount: number | null;
  billing_type: 'boleta' | 'factura' | null;
  billing_rut: string | null;
  billing_razon_social: string | null;
  dte_type: number | null;
  dte_folio: number | null;
  dte_status: 'pending' | 'issued' | 'failed' | 'cancelled' | null;
  dte_pdf_url: string | null;
  created_at: string;
}

export interface HistoryRecord {
  id: string;
  tracking_code: string;
  status: 'pending_payment' | 'draft' | 'waiting_signatures' | 'waiting_notary' | 'completed' | 'failed';
  buyer_rut: string;
  buyer_email: string;
  total_amount: number;
  signature_type: 'none' | 'simple' | 'fea';
  signature_price: number;
  is_custom_document: boolean;
  created_at: string;
  updated_at: string;
  templateVersion?: {
    template?: {
      title: string;
      slug: string;
      category?: string;
    };
  };
  signers?: Array<{
    id: string;
    full_name: string;
    role: string;
    has_signed: boolean;
  }>;
  payments?: PaymentInfo[];
}
