import { MetricCard } from '@/components/dashboard/metric-card';
import { InvoiceTable } from '@/components/invoices/invoice-table';
import { Button } from '@ui';
import { getMockMetrics, getRecentInvoices } from '@/data/mock-invoices';
import {
  DollarSign,
  FileText,
  TrendingUp,
  Clock,
  PlusCircle,
} from 'lucide-react';
import Link from 'next/link';

export default function OverviewPage() {
  const metrics = getMockMetrics();
  const recentInvoices = getRecentInvoices(5);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="space-y-8 p-8">
      {/* Header Section - 32px from top */}
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">Overview</h1>
          <p className="text-muted-foreground">
            Monitor your invoice financing at a glance
          </p>
        </div>
        <Link href="/invoices/submit">
          <Button className="font-semibold">
            <PlusCircle className="h-4 w-4" />
            Submit Invoice
          </Button>
        </Link>
      </div>

      {/* Metrics Grid - 16px gaps */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Invoices"
          value={metrics.totalInvoicesSubmitted.toString()}
          description="All time submitted"
          icon={FileText}
        />
        <MetricCard
          title="Active Funding"
          value={formatCurrency(metrics.activeFundingAmount)}
          description="Currently in process"
          icon={TrendingUp}
        />
        <MetricCard
          title="Total Funded"
          value={formatCurrency(metrics.totalFundedToDate)}
          description="Lifetime funded"
          icon={DollarSign}
        />
        <MetricCard
          title="Pending Repayments"
          value={formatCurrency(metrics.pendingRepayments)}
          description="Awaiting payment"
          icon={Clock}
        />
      </div>

      {/* Recent Invoices Section - 32px spacing */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="text-2xl font-semibold tracking-tight">
              Recent Invoices
            </h2>
            <p className="text-sm text-muted-foreground">
              Latest submissions and their status
            </p>
          </div>
          <Link href="/invoices">
            <Button variant="outline">View All</Button>
          </Link>
        </div>

        <InvoiceTable invoices={recentInvoices} />
      </div>
    </div>
  );
}
