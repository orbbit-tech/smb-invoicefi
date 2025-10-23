/**
 * React Query hook for fetching dashboard metrics
 */

import { useQuery } from '@tanstack/react-query';
import { SMBDashboardApi } from '@api-client';
import { createApiConfig } from '@/lib/api-client';

export function useDashboardMetrics(organizationId: string) {
  return useQuery({
    queryKey: ['dashboard-metrics', organizationId],
    queryFn: async () => {
      const api = new SMBDashboardApi(createApiConfig());
      return await api.getMetrics(organizationId);
    },
    enabled: !!organizationId, // Only fetch if organizationId exists
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
