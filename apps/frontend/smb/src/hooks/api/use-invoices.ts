/**
 * React Query hooks for invoice operations
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { SMBInvoicesApi, CreateInvoiceDto, UpdateInvoiceDto } from '@api-client';
import { createApiConfig } from '@/lib/api-client';

export interface UseInvoicesParams {
  organizationId: string;
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Hook to fetch paginated list of invoices
 */
export function useInvoices(params: UseInvoicesParams) {
  return useQuery({
    queryKey: ['invoices', params],
    queryFn: async () => {
      const api = new SMBInvoicesApi(createApiConfig());
      // Note: organizationId is the last parameter in the generated API
      return await api.list(
        params.status,
        params.search,
        params.page,
        params.limit,
        params.sortBy,
        params.sortOrder as 'asc' | 'desc' | undefined,
        params.organizationId
      );
    },
    enabled: !!params.organizationId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Hook to fetch a single invoice by ID
 */
export function useInvoice(invoiceId: string, organizationId: string) {
  return useQuery({
    queryKey: ['invoice', invoiceId, organizationId],
    queryFn: async () => {
      const api = new SMBInvoicesApi(createApiConfig());
      return await api.getById(invoiceId, organizationId);
    },
    enabled: !!invoiceId && !!organizationId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to create a new invoice
 */
export function useCreateInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      organizationId,
      data,
    }: {
      organizationId: string;
      data: CreateInvoiceDto;
    }) => {
      const api = new SMBInvoicesApi(createApiConfig());
      return await api.create(organizationId, data);
    },
    onSuccess: () => {
      // Invalidate invoices list to refetch
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
    },
  });
}

/**
 * Hook to update an existing invoice
 */
export function useUpdateInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      invoiceId,
      organizationId,
      data,
    }: {
      invoiceId: string;
      organizationId: string;
      data: UpdateInvoiceDto;
    }) => {
      const api = new SMBInvoicesApi(createApiConfig());
      return await api.update(invoiceId, organizationId, data);
    },
    onSuccess: (_, variables) => {
      // Invalidate specific invoice and list
      queryClient.invalidateQueries({
        queryKey: ['invoice', variables.invoiceId],
      });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
    },
  });
}

/**
 * Hook to fetch invoice status history
 */
export function useInvoiceStatusHistory(
  invoiceId: string,
  organizationId: string
) {
  return useQuery({
    queryKey: ['invoice-status-history', invoiceId, organizationId],
    queryFn: async () => {
      const api = new SMBInvoicesApi(createApiConfig());
      return await api.getStatusHistory(invoiceId, organizationId);
    },
    enabled: !!invoiceId && !!organizationId,
  });
}
