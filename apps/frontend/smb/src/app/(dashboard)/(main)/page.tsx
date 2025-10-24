'use client';

import { useState, useMemo } from 'react';
import { MetricCard } from '@/components/dashboard/metric-card';
import {
  InvoiceMultiView,
  InvoiceStatus,
  Skeleton,
  Card,
  type Invoice,
} from '@ui';
import { Button } from '@ui';
import {
  DollarSign,
  FileText,
  TrendingUp,
  Clock,
  Plus,
  AlertCircle,
} from 'lucide-react';
import Link from 'next/link';
import { useDashboardMetrics, useInvoices } from '@/hooks/api';
import { Alert, AlertDescription } from '@ui';
import { mapApiInvoicesToFrontend } from '@/lib/invoice-mapper';
import { RepaymentModal } from '@/components/repayment/repayment-modal';

// TODO: Replace with actual organizationId from auth context
// Using org_gallivant from seed data (Gallivant Ice Cream - has 3 invoices)
const TEMP_ORGANIZATION_ID = 'org_gallivant';

// Skeleton component for loading metric cards
function MetricCardSkeleton() {
  return (
    <Card className="p-6">
      <div className="flex flex-row items-center justify-between mb-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-4 rounded-full" />
      </div>
      <Skeleton className="h-7 w-32 mb-1" />
      <Skeleton className="h-4 w-20" />
    </Card>
  );
}

// Skeleton component for loading invoice view
function InvoiceViewSkeleton() {
  return (
    <Card className="p-6">
      {/* Header with search and filters */}
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-20" />
          <Skeleton className="h-9 w-20" />
          <Skeleton className="h-9 w-20" />
        </div>
      </div>

      {/* Table structure */}
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center gap-4 py-4 border-b">
            <Skeleton className="h-12 w-12 rounded" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-48" />
            </div>
            <Skeleton className="h-6 w-20 rounded-full" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-9 w-20" />
          </div>
        ))}
      </div>
    </Card>
  );
}

export default function MyInvoicesPage() {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [selectedInvoiceForRepayment, setSelectedInvoiceForRepayment] =
    useState<Invoice | null>(null);
  const [isRepaymentModalOpen, setIsRepaymentModalOpen] = useState(false);
  const limit = 20;

  // Fetch dashboard metrics from API
  const {
    data: metricsData,
    isLoading: isLoadingMetrics,
    error: metricsError,
  } = useDashboardMetrics(TEMP_ORGANIZATION_ID);

  // Fetch invoices from API
  const {
    data: invoicesData,
    isLoading: isLoadingInvoices,
    error: invoicesError,
  } = useInvoices({
    organizationId: TEMP_ORGANIZATION_ID,
    status: statusFilter === 'all' ? undefined : statusFilter,
    search: searchQuery || undefined,
    page,
    limit,
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Convert 6-decimal format to dollars for display
  // Backend uses 6 decimals (e.g., 50000000000 = $50,000)
  const format6DecimalsToDollars = (amount: number) => {
    return formatCurrency(amount / 1000000);
  };

  // Map API invoices to frontend format
  const apiInvoices = invoicesData?.data || [];
  const invoices = mapApiInvoicesToFrontend(apiInvoices);

  // Calculate overdue invoices (only OVERDUE status)
  const overdueInvoices = useMemo(() => {
    return invoices.filter(
      (invoice) => invoice.status === InvoiceStatus.OVERDUE
    );
  }, [invoices]);

  const hasOverdueInvoices = overdueInvoices.length > 0;

  const isLoading = isLoadingMetrics || isLoadingInvoices;
  const hasError = metricsError || invoicesError;

  const handleRepaymentClick = (invoice: Invoice) => {
    setSelectedInvoiceForRepayment(invoice);
    setIsRepaymentModalOpen(true);
  };

  const handleRepaymentSuccess = () => {
    // Refetch invoices and metrics
    // The react-query hooks will automatically refetch
  };

  const handleMetricCardClick = () => {
    // Filter to OVERDUE status only (per user requirement)
    setStatusFilter(InvoiceStatus.OVERDUE);
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-xl font-bold tracking-tight">My Invoices</h1>
        <Link href="/invoices/submit">
          <Button>
            <Plus className="h-4 w-4" />
            <span className="text-sm font-medium">Submit Invoice</span>
          </Button>
        </Link>
      </div>

      {/* Error State */}
      {hasError && (
        <Alert variant="destructive">
          <AlertDescription>
            Failed to load data. Please try refreshing the page.
          </AlertDescription>
        </Alert>
      )}

      {/* Overdue Invoices Alert */}
      {/* {hasOverdueInvoices && !isLoading && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            You have {overdueInvoices.length} overdue invoice
            {overdueInvoices.length !== 1 ? 's' : ''} requiring immediate
            payment.{' '}
            <button
              onClick={() => handleMetricCardClick()}
              className="underline font-semibold hover:no-underline"
            >
              View overdue invoices
            </button>
          </AlertDescription>
        </Alert>
      )} */}

      {/* Loading State for Metrics */}
      {isLoadingMetrics ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <MetricCardSkeleton key={i} />
          ))}
        </div>
      ) : metricsData ? (
        /* Metrics Grid */
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            title="Total Invoices"
            value={metricsData.totalInvoicesSubmitted.toString()}
            description="All time submitted"
            icon={FileText}
          />
          <MetricCard
            title="Active Funding"
            value={format6DecimalsToDollars(metricsData.activeFundingAmount)}
            description="Currently in process"
            icon={TrendingUp}
          />
          <MetricCard
            title="Total Funded"
            value={format6DecimalsToDollars(metricsData.totalFundedToDate)}
            description="Lifetime funded"
            icon={DollarSign}
          />
          <div
            className="cursor-pointer transition-transform hover:scale-[1.02]"
            onClick={() => handleMetricCardClick()}
          >
            <MetricCard
              title="Pending Repayments"
              value={format6DecimalsToDollars(metricsData.pendingRepayments)}
              description="Awaiting payment"
              icon={Clock}
            />
          </div>
        </div>
      ) : null}

      {/* Invoice Multi-View */}
      {isLoadingInvoices ? (
        <InvoiceViewSkeleton />
      ) : (
        <InvoiceMultiView
          invoices={invoices}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          onRepaymentClick={handleRepaymentClick}
          config={{
            showSmbColumn: false,
            // SMB 7-Status System
            availableStatuses: [
              InvoiceStatus.SUBMITTED,
              InvoiceStatus.LISTED,
              InvoiceStatus.FULLY_FUNDED,
              InvoiceStatus.OVERDUE,
              InvoiceStatus.FULLY_PAID,
              InvoiceStatus.SETTLED,
              InvoiceStatus.DEFAULTED,
            ],
          }}
        />
      )}

      {/* Repayment Modal */}
      <RepaymentModal
        invoice={selectedInvoiceForRepayment}
        isOpen={isRepaymentModalOpen}
        onClose={() => setIsRepaymentModalOpen(false)}
        onRepaymentSuccess={handleRepaymentSuccess}
      />
    </div>
  );
}
