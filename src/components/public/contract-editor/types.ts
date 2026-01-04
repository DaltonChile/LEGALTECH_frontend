export interface Capsule {
  id: number;
  slug: string;
  title: string;
  description?: string;
  price: number;
  legal_text?: string;
  variables?: string[];
  display_order: number;
}

export interface ClauseNumbering {
  order: number;
  title: string;
  is_in_capsule: boolean;
  capsule_slug: string | null;
}

export interface SignerConfig {
  role: string;
  display_name: string;
  signature_order: number;
  name_variable: string;
  rut_variable: string;
  email_variable: string;
}

export interface VariableMetadata {
  canonical: string;
  normalized: string;
  aliases: string[];
}

export interface ContractEditorProps {
  templateText: string;
  variables: string[];
  formData: Record<string, string>;
  onFormChange: (data: Record<string, string>) => void;
  capsules: Capsule[];
  selectedCapsules: number[];
  onCapsuleSelectionChange: (selectedIds: number[]) => void;
  basePrice: number;
  isLoading?: boolean;
  clauseNumbering?: ClauseNumbering[];
  signersConfig?: SignerConfig[];
  variablesMetadata?: {
    variables: VariableMetadata[];
    baseVariables: string[];
  };
  onContinueToPayment?: () => void;
}
