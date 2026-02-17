import { useState, useEffect, useCallback } from 'react';
import { getAdminHistory } from '../../services/api';
import type { HistoryRecord } from '../../types/history';

interface Pagination {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

interface UseAdminHistoryFilters {
  status?: string;
  paymentStatus?: string;
  billingType?: string;
  search?: string;
  page: number;
  limit: number;
}

interface UseAdminHistoryResult {
  records: HistoryRecord[];
  isLoading: boolean;
  error: string | null;
  pagination: Pagination | null;
  refetch: () => Promise<void>;
}

export function useAdminHistory(filters: UseAdminHistoryFilters): UseAdminHistoryResult {
  const [records, setRecords] = useState<HistoryRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<Pagination | null>(null);

  const fetchHistory = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const params: Record<string, string | number> = {
        page: filters.page,
        limit: filters.limit,
      };
      if (filters.status) params.status = filters.status;
      if (filters.paymentStatus) params.payment_status = filters.paymentStatus;
      if (filters.billingType) params.billing_type = filters.billingType;
      if (filters.search) params.search = filters.search;

      const response = await getAdminHistory(params as any);

      if (response.data.success) {
        setRecords(response.data.data);
        if (response.data.pagination) {
          setPagination(response.data.pagination);
        }
      } else {
        setError('Error al cargar el historial');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al cargar el historial');
      console.error('Error fetching history:', err);
    } finally {
      setIsLoading(false);
    }
  }, [filters.status, filters.paymentStatus, filters.billingType, filters.search, filters.page, filters.limit]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  return { records, isLoading, error, pagination, refetch: fetchHistory };
}
