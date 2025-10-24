'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAccount } from 'wagmi';
import { Card, InvoiceMultiView, Invoice, InvoiceStatus } from '@ui';
import { TrendingUp, Wallet, Clock, CheckCircle } from 'lucide-react';
import { usePortfolioSummary, usePortfolioPositions } from '@/hooks/api';
import { mapPortfolioPosition, usdcToDollars } from '@/lib/mappers/invoice-mapper';
import { SummaryCardSkeleton, InvoiceTableSkeleton } from '@/components/skeletons';

/**
 * Portfolio Page
 *
 * Clean Dashboard Design principles:
 * - Consistent 24px (p-6) card padding
 * - Clear visual hierarchy
 * - Professional data presentation
 */

export default function PortfolioPage() {
  const router = useRouter();
  const { address } = useAccount();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch portfolio data from API
  const { data: summaryData, isLoading: isSummaryLoading } = usePortfolioSummary(address || '');
  const { data: positionsData, isLoading: isPositionsLoading } = usePortfolioPositions({
    investorAddress: address || '',
    status: statusFilter !== 'all' ? statusFilter : undefined,
    limit: 100,
  });

  const isLoading = isSummaryLoading || isPositionsLoading;

  // Calculate gains from summary
  const unrealizedGains = summaryData ? usdcToDollars(summaryData.totalUnrealizedGains) : 0;
  const realizedGains = summaryData ? usdcToDollars(summaryData.totalRealizedGains) : 0;

  // Transform portfolio positions to Invoice format
  const invoices: Invoice[] = useMemo(() => {
    if (!positionsData?.data) return [];

    return positionsData.data.map((position) => {
      const mapped = mapPortfolioPosition(position);

      // Determine status based on position status
      let status: InvoiceStatus;
      switch (mapped.positionStatus.toLowerCase()) {
        case 'funded':
          status = InvoiceStatus.FULLY_FUNDED;
          break;
        case 'disbursed':
          status = InvoiceStatus.DISBURSED;
          break;
        case 'settled':
          status = InvoiceStatus.SETTLED;
          break;
        case 'defaulted':
          status = InvoiceStatus.DEFAULTED;
          break;
        default:
          status = InvoiceStatus.FULLY_FUNDED;
      }

      return {
        id: mapped.id,
        invoiceNumber: mapped.invoice.invoiceNumber,
        amount: mapped.investment.fundedAmount,
        dueDate: mapped.invoice.dueAt,
        createdDate: mapped.investment.fundedAt,
        payer: {
          name: mapped.payer.name,
          industry: mapped.payer.industry || 'General',
          logoUrl: undefined,
        },
        smb: {
          name: mapped.issuer.name,
          logoUrl: undefined,
        },
        status,
        apr: mapped.investment.expectedReturn,
        daysUntilDue: Math.max(
          0,
          Math.ceil((mapped.invoice.dueAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
        ),
        repaidDate: mapped.settledAt,
        tokenId: mapped.nft.tokenId,
        contractAddress: mapped.nft.contractAddress,
        blockchainTxHash: mapped.investment.fundingTxHash,
      } as Invoice;
    });
  }, [positionsData]);

  // Filter invoices based on search query
  const filteredInvoices = invoices.filter((invoice) => {
    const matchesSearch =
      invoice.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      invoice.payer.name.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesSearch;
  });

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-bold text-foreground tracking-tight">
            My Portfolio
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Track your investments and returns
          </p>
        </div>

        {/* Portfolio Summary Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <SummaryCardSkeleton key={i} />
          ))}
        </div>

        {/* Invoice Table Skeleton */}
        <InvoiceTableSkeleton rows={5} />
      </div>
    );
  }

  // No wallet connected - show empty portfolio structure
  const showEmptyState = !address;
  const displaySummary = showEmptyState ? {
    totalInvested: 0,
    activePositionsCount: 0,
    totalUnrealizedGains: 0,
    totalRealizedGains: 0,
    averageApy: 0,
  } : summaryData;

  const displayInvoices = showEmptyState ? [] : filteredInvoices;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-foreground tracking-tight">
          My Portfolio
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {showEmptyState
            ? 'Connect your wallet to view your investments and returns'
            : 'Track your investments and returns'}
        </p>
      </div>

      {/* Portfolio Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Invested */}
        <Card className="p-6 transition-all duration-200 hover:shadow-md">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-muted-foreground mb-2">
                Total Invested
              </p>
              <p className="text-xl font-bold text-foreground tracking-tight">
                ${displaySummary ? usdcToDollars(displaySummary.totalInvested).toLocaleString() : '0'}
              </p>
            </div>
            <div className="flex-shrink-0">
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </div>
          </div>
        </Card>

        {/* Active Investments */}
        <Card className="p-6 transition-all duration-200 hover:shadow-md">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-muted-foreground mb-2">
                Active Investments
              </p>
              <p className="text-xl font-bold text-foreground tracking-tight">
                {displaySummary?.activePositionsCount || 0}
              </p>
            </div>
            <div className="flex-shrink-0">
              <Clock className="h-4 w-4 text-muted-foreground" />
            </div>
          </div>
        </Card>

        {/* Total Earned */}
        <Card className="p-6 transition-all duration-200 hover:shadow-md">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-muted-foreground mb-2">
                Total Earned
              </p>
              <p className="text-xl font-bold tracking-tight">
                ${showEmptyState ? '0.00' : (realizedGains + unrealizedGains).toFixed(2)}
              </p>
            </div>
            <div className="flex-shrink-0">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </div>
          </div>
        </Card>

        {/* Average APR */}
        <Card className="p-6 transition-all duration-200 hover:shadow-md">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-muted-foreground mb-2">
                Average APR
              </p>
              <p className="text-xl font-bold text-foreground tracking-tight">
                {displaySummary?.averageApy.toFixed(1) || '0.0'}%
              </p>
            </div>
            <div className="flex-shrink-0">
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </div>
          </div>
        </Card>
      </div>

      {/* Invoice Multi-View */}
      <InvoiceMultiView
        invoices={displayInvoices}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        baseRoute="/portfolio"
        config={{
          showSmbColumn: true,
          availableStatuses: [
            InvoiceStatus.FULLY_FUNDED,
            InvoiceStatus.DISBURSED,
            InvoiceStatus.PENDING_REPAYMENT,
            InvoiceStatus.FULLY_PAID,
            InvoiceStatus.REPAID,
            InvoiceStatus.DEFAULTED,
            InvoiceStatus.SETTLED,
          ],
        }}
      />
    </div>
  );
}
