import { useState, useEffect, useCallback } from 'react';
import { apiService } from '@/lib/api';

interface UseApiDataOptions {
  cacheTime?: number;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

const cacheStore = new Map<string, { data: any; timestamp: number }>();

export function invalidateCache(endpoint?: string) {
  if (endpoint) {
    cacheStore.delete(endpoint);
  } else {
    cacheStore.clear();
  }
}

export function useApiData<T>(
  endpoint: string,
  options: UseApiDataOptions = {}
) {
  const { cacheTime = 30000, autoRefresh = true, refreshInterval = 30000 } = options;
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async (skipCache = false) => {
    try {
      setLoading(true);
      setError(null);
      
      const now = Date.now();
      const cached = cacheStore.get(endpoint);
      
      if (!skipCache && cached && now - cached.timestamp < cacheTime) {
        setData(cached.data);
        setLoading(false);
        return;
      }
      
      const response = await apiService.request<T>(endpoint);
      
      if (response.success && response.data) {
        cacheStore.set(endpoint, { data: response.data, timestamp: now });
        setData(response.data);
      } else {
        setError(response.error || 'Failed to fetch data');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [endpoint, cacheTime]);

  useEffect(() => {
    fetchData();

    if (autoRefresh) {
      const interval = setInterval(() => fetchData(true), refreshInterval);
      return () => clearInterval(interval);
    }
  }, [fetchData, autoRefresh, refreshInterval]);

  return { data, loading, error, refetch: fetchData };
}

export function useUsers() {
  return useApiData('/users/admin/users/', { cacheTime: 30000 });
}

export function useSuspiciousActivities() {
  return useApiData('/admin/suspicious-activities/', { cacheTime: 30000 });
}

export function useAuditLogs() {
  return useApiData('/admin/audit-logs/', { cacheTime: 60000 });
}

export function invalidateUsersCache() {
  invalidateCache('/users/admin/users/');
}

export function invalidateSuspiciousActivitiesCache() {
  invalidateCache('/admin/suspicious-activities/');
}

export function invalidateAuditLogsCache() {
  invalidateCache('/admin/audit-logs/');
}
