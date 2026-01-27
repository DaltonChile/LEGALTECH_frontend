export interface Template {
  id: string;
  title: string;
  slug: string;
  description: string;
  short_description?: string;
  is_active: boolean;
  requires_notary: boolean;
  category: string | null;
  versions: Version[];
}

export interface Capsule {
  id: string;
  slug: string;
  title: string;
  price: number;
  display_order: number;
  form_schema: any[];
}

export interface Version {
  id: string;
  version_number: number;
  base_price: number;
  is_published: boolean;
  created_at: string;
  base_form_schema: any[];
  capsules?: Capsule[];
  has_contracts?: boolean;
  contract_count?: number;
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