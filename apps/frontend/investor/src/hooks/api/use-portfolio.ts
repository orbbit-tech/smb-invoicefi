/**
 * React Query hooks for portfolio operations
 */

import { useQuery } from '@tanstack/react-query';
import { InvestorPortfolioApi } from '@api-client';
import { createApiConfig } from '@/lib/api-client';

export interface UsePortfolioPositionsParams {
  investorAddress: string;
  status?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Hook to fetch portfolio summary metrics
 */
export function usePortfolioSummary(investorAddress: string) {
  return useQuery({
    queryKey: ['portfolio-summary', investorAddress],
    queryFn: async () => {
      const api = new InvestorPortfolioApi(createApiConfig());
      return await api.getSummary(investorAddress);
    },
    enabled: !!investorAddress,
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });
}

/**
 * Hook to fetch paginated list of portfolio positions
 */
export function usePortfolioPositions(params: UsePortfolioPositionsParams) {
  return useQuery({
    queryKey: ['portfolio-positions', params],
    queryFn: async () => {
      const api = new InvestorPortfolioApi(createApiConfig());
      return await api.getPositions(
        params.investorAddress,
        params.status,
        params.page,
        params.limit,
        params.sortBy,
        params.sortOrder
      );
    },
    enabled: !!params.investorAddress,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Hook to fetch a single portfolio position by ID
 */
export function usePortfolioPosition(id: string, investorAddress: string) {
  return useQuery({
    queryKey: ['portfolio-position', id, investorAddress],
    queryFn: async () => {
      const api = new InvestorPortfolioApi(createApiConfig());
      return await api.getPositionById(id, investorAddress);
    },
    enabled: !!id && !!investorAddress,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}
