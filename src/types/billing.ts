export interface BillingData {
  billing_type: 'boleta' | 'factura';
  billing_rut?: string;
  billing_razon_social?: string;
  billing_giro?: string;
  billing_direccion?: string;
  billing_comuna?: string;
  billing_ciudad?: string;
}
