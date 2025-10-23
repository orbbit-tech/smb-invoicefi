/**
 * React Query hooks for marketplace operations
 */

import { useQuery } from '@tanstack/react-query';
import { InvestorMarketplaceApi } from '@api-client';
import { createApiConfig } from '@/lib/api-client';

export interface UseMarketplaceInvoicesParams {
  riskScore?: string;
  minApr?: number;
  maxApr?: number;
  minAmount?: number;
  maxAmount?: number;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Hook to fetch paginated list of marketplace invoices
 */
export function useMarketplaceInvoices(params?: UseMarketplaceInvoicesParams) {
  return useQuery({
    queryKey: ['marketplace-invoices', params],
    queryFn: async () => {
      const api = new InvestorMarketplaceApi(createApiConfig());
      return await api.listInvoices(
        params?.riskScore,
        params?.minApr,
        params?.maxApr,
        params?.minAmount,
        params?.maxAmount,
        params?.search,
        params?.page,
        params?.limit,
        params?.sortBy,
        params?.sortOrder
      );
    },
    staleTime: 30 * 1000, // 30 seconds - marketplace data changes frequently
    refetchInterval: 60 * 1000, // Refetch every minute for fresh data
  });
}

/**
 * Hook to fetch a single marketplace invoice by ID
 */
export function useMarketplaceInvoice(id: string) {
  return useQuery({
    queryKey: ['marketplace-invoice', id],
    queryFn: async () => {
      const api = new InvestorMarketplaceApi(createApiConfig());
      return await api.getInvoiceDetail(id);
    },
    enabled: !!id,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}
