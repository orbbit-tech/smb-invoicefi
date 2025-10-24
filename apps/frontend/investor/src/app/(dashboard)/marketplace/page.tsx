'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { InvoiceCard, type InvoiceData } from '@/components/invoices';
import {
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Card,
  Button,
} from '@ui';
import { Search, ArrowUp, ArrowDown } from 'lucide-react';
import { useMarketplaceInvoices } from '@/hooks/api';
import { mapMarketplaceInvoice } from '@/lib/mappers/invoice-mapper';
import { InvoiceCardSkeleton } from '@/components/skeletons';

/**
 * Marketplace Page
 *
 * Clean Dashboard Design principles:
 * - Consistent spacing and hierarchy
 * - Clear visual grouping
 * - Professional stats display
 */

type SortField = 'default' | 'apr' | 'amount' | 'termDays' | 'dueDate';
type SortDirection = 'asc' | 'desc';

export default function MarketplacePage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('default');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // Fetch marketplace invoices from API
  const { data, isLoading, isError } = useMarketplaceInvoices({
    search: searchQuery || undefined,
    sortBy: sortField !== 'default' ? sortField : undefined,
    sortOrder: sortField !== 'default' ? sortDirection : undefined,
    limit: 100, // Get all invoices for now
  });

  // Map API data to frontend format
  const invoices = useMemo(() => {
    if (!data?.data) return [];
    return data.data.map((invoice) => {
      const mapped = mapMarketplaceInvoice(invoice);
      return {
        id: mapped.id,
        companyName: mapped.issuer.name,
        companyLogoUrl: undefined, // TODO: Add logo URL from issuer data
        dueDate: mapped.dueDate.toISOString(),
        category: mapped.issuer.industry || 'General',
        amount: mapped.amount,
        funded: 0, // Not applicable for marketplace (not yet funded)
        payerName: mapped.payer.name,
        payerLogoUrl: undefined, // TODO: Add logo URL from payer data
        daysUntilDue: mapped.daysUntilDue,
        return: mapped.expectedReturn,
        apr: mapped.apr,
        discountRate: mapped.discountRate,
        riskScore: mapped.riskScore as 'Low' | 'Medium' | 'High',
        status: 'active' as const,
      } as InvoiceData;
    });
  }, [data]);

  const handleClickInvoice = (invoice: InvoiceData) => {
    router.push(`/marketplace/${invoice.id}`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-foreground tracking-tight">
          Invoice Marketplace
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Browse and fund SMB invoices to earn yield on USDC
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search by payer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-9"
          />
        </div>

        {/* Sort Field */}
        <Select value={sortField} onValueChange={(value) => setSortField(value as SortField)}>
          <SelectTrigger className="w-full sm:w-[200px] h-9">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="default">Default</SelectItem>
            <SelectItem value="apr">APR</SelectItem>
            <SelectItem value="amount">Funding Amount</SelectItem>
            <SelectItem value="termDays">Term Days</SelectItem>
            <SelectItem value="dueDate">Due Date</SelectItem>
          </SelectContent>
        </Select>

        {/* Sort Direction Toggle */}
        <Button
          variant="outline"
          size="icon"
          className="h-9 w-9"
          disabled={sortField === 'default'}
          onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
          title={sortDirection === 'asc' ? 'Ascending' : 'Descending'}
        >
          {sortDirection === 'asc' ? (
            <ArrowUp className="h-4 w-4" />
          ) : (
            <ArrowDown className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <InvoiceCardSkeleton key={i} />
          ))}
        </div>
      )}

      {/* Error State */}
      {isError && (
        <Card className="p-12">
          <div className="text-center">
            <p className="text-lg text-destructive">Failed to load invoices</p>
            <p className="text-sm text-muted-foreground mt-2">
              Please try again later or contact support
            </p>
          </div>
        </Card>
      )}

      {/* Invoice Grid */}
      {!isLoading && !isError && invoices.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {invoices.map((invoice) => (
            <InvoiceCard
              key={invoice.id}
              invoice={invoice}
              onClick={handleClickInvoice}
            />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !isError && invoices.length === 0 && (
        <Card className="p-12 col-span-1">
          <div className="text-center">
            <p className="text-lg text-muted-foreground">
              No invoices found
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              {searchQuery
                ? 'Try adjusting your search criteria'
                : 'Check back later for new opportunities'}
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}
