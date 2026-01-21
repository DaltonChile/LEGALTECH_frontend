// LEGALTECH_frontend/src/hooks/useAsyncData.ts
import { useState, useEffect, useCallback } from 'react';

interface UseAsyncDataOptions<T> {
  initialData?: T;
  onError?: (error: Error) => void;
  immediate?: boolean;
}

interface UseAsyncDataReturn<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Custom hook for handling async data fetching with loading and error states
 * @param fetchFn - Async function that fetches data
 * @param dependencies - Array of dependencies that trigger refetch (optional)
 * @param options - Configuration options
 * @returns Object containing data, loading state, error state, and refetch function
 */
export function useAsyncData<T>(
  fetchFn: () => Promise<T>,
  dependencies: any[] = [],
  options: UseAsyncDataOptions<T> = {}
): UseAsyncDataReturn<T> {
  const { initialData = null, onError, immediate = true } = options;
  
  const [data, setData] = useState<T | null>(initialData);
  const [loading, setLoading] = useState(immediate);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await fetchFn();
      setData(result);
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.message || 'Error desconocido';
      setError(errorMessage);
      if (onError) {
        onError(err);
      } else {
        console.error('Error fetching data:', err);
      }
    } finally {
      setLoading(false);
    }
  }, [fetchFn, onError]);

  useEffect(() => {
    if (immediate) {
      fetchData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dependencies);

  return {
    data,
    loading,
    error,
    refetch: fetchData
  };
}
