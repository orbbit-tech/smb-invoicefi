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
    <div className="py-8 space-y-8">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Overview</h1>
          <p className="text-muted-foreground mt-1">
            Welcome back! Here's an overview of your invoice financing.
          </p>
        </div>
        <Link href="/invoices/submit">
          <Button size="lg">
            <PlusCircle className="mr-2 h-4 w-4" />
            Submit Invoice
          </Button>
        </Link>
      </div>

      {/* Metrics Grid */}
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
          description="Invoices in funding process"
          icon={TrendingUp}
        />
        <MetricCard
          title="Total Funded"
          value={formatCurrency(metrics.totalFundedToDate)}
          description="Lifetime funded amount"
          icon={DollarSign}
        />
        <MetricCard
          title="Pending Repayments"
          value={formatCurrency(metrics.pendingRepayments)}
          description="Awaiting payment"
          icon={Clock}
        />
      </div>

      {/* Recent Invoices Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">
              Recent Invoices
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Your most recently submitted invoices
            </p>
          </div>
          <Link href="/invoices">
            <Button variant="outline">View All</Button>
          </Link>
        </div>

        <InvoiceTable invoices={recentInvoices} />
      </div>

      {/* Quick Actions Section */}
      <div className="bg-muted rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
        <div className="grid gap-4 md:grid-cols-3">
          <Link href="/invoices/submit" className="block">
            <div className="bg-background rounded-md p-4 hover:shadow-md transition-shadow cursor-pointer">
              <PlusCircle className="h-8 w-8 mb-2 text-primary" />
              <h4 className="font-medium mb-1">Submit New Invoice</h4>
              <p className="text-sm text-muted-foreground">
                Get funding for your invoices in under 24 hours
              </p>
            </div>
          </Link>
          <Link href="/invoices" className="block">
            <div className="bg-background rounded-md p-4 hover:shadow-md transition-shadow cursor-pointer">
              <FileText className="h-8 w-8 mb-2 text-primary" />
              <h4 className="font-medium mb-1">View All Invoices</h4>
              <p className="text-sm text-muted-foreground">
                Track status and funding progress of all invoices
              </p>
            </div>
          </Link>
          <div className="bg-background rounded-md p-4 opacity-60">
            <TrendingUp className="h-8 w-8 mb-2 text-muted-foreground" />
            <h4 className="font-medium mb-1">Analytics (Coming Soon)</h4>
            <p className="text-sm text-muted-foreground">
              View detailed insights and performance metrics
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
