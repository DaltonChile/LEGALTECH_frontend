import { useState, useEffect } from 'react';
import { getAdminContracts } from '../../services/api';

interface Contract {
  id: string;
  tracking_code: string;
  status: string;
  buyer_email: string;
  buyer_rut: string;
  total_amount: number;
  created_at: string;
  updated_at: string;
  templateVersion?: {
    template?: {
      title: string;
      slug: string;
    };
  };
  signers?: Array<{
    id: string;
    full_name: string;
    role: string;
    has_signed: boolean;
  }>;
}

interface UseAdminContractsResult {
  contracts: Contract[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  } | null;
}

export function useAdminContracts(
  status?: string,
  page: number = 1,
  limit: number = 20
): UseAdminContractsResult {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<{
    total: number;
    page: number;
    limit: number;
    pages: number;
  } | null>(null);

  const fetchContracts = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const params: { status?: string; page?: number; limit?: number } = { page, limit };
      if (status) params.status = status;
      
      const response = await getAdminContracts(params);
      
      if (response.data.success) {
        setContracts(response.data.data);
        if (response.data.pagination) {
          setPagination(response.data.pagination);
        }
      } else {
        setError('Error al cargar los contratos');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al cargar los contratos');
      console.error('Error fetching contracts:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchContracts();
  }, [status, page, limit]);

  return {
    contracts,
    isLoading,
    error,
    refetch: fetchContracts,
    pagination
  };
}
