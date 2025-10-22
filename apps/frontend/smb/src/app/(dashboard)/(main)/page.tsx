'use client';

import { useState } from 'react';
import { MetricCard } from '@/components/dashboard/metric-card';
import { InvoiceMultiView } from '@/components/invoices/invoice-multi-view';
import { Button } from '@ui';
import { getMockMetrics, mockInvoices } from '@/data/mock-invoices';
import { DollarSign, FileText, TrendingUp, Clock, Plus } from 'lucide-react';
import Link from 'next/link';

export default function MyInvoicesPage() {
  const metrics = getMockMetrics();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Filter invoices based on status and search query
  const filteredInvoices = mockInvoices.filter((invoice) => {
    const matchesStatus =
      statusFilter === 'all' || invoice.status === statusFilter;
    const matchesSearch =
      invoice.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      invoice.payer.name.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesStatus && matchesSearch;
  });

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

      {/* Invoice Multi-View */}
      <InvoiceMultiView
        invoices={filteredInvoices}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
      />
    </div>
  );
}
