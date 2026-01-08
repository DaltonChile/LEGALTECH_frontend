export interface Template {
  id: string;  // UUID
  title: string;
  slug: string;
  description: string;
  is_active: boolean;
  versions: Version[];
}

export interface Capsule {
  id: string;  // UUID
  slug: string;
  title: string;
  price: number;
  display_order: number;
  form_schema: any[];
}

export interface Version {
  id: string;  // UUID (no number)
  version_number: number;
  base_price: number;
  is_published: boolean;
  requires_notary: boolean;
  created_at: string;
  base_form_schema: any[];
  capsules?: Capsule[];
  has_contracts?: boolean;    // Indica si tiene contratos asociados
  contract_count?: number;    // Número de contratos asociados
}

export interface CapsulePending {
  slug: string;
  title: string;
  legal_text: string;
  form_schema: any[];
  display_order: number;
  variables_count: number;
  price?: number;
}

export type FilterType = 'all' | 'published' | 'draft';
