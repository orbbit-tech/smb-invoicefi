'use client';

import { useState } from 'react';
import { InvoiceTable } from '@/components/invoices/invoice-table';
import { Button } from '@ui';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@ui';
import { Input } from '@ui';
import { mockInvoices } from '@/data/mock-invoices';
import { InvoiceStatus } from '@/types/invoice';
import { PlusCircle, Search, Filter } from 'lucide-react';
import Link from 'next/link';

export default function InvoicesPage() {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

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
    <div className="py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Invoices</h1>
          <p className="text-muted-foreground mt-1">
            View and manage all your invoices
          </p>
        </div>
        <Link href="/invoices/submit">
          <Button size="lg">
            <PlusCircle className="mr-2 h-4 w-4" />
            Submit Invoice
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by invoice number or payer..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value={InvoiceStatus.CREATED}>Created</SelectItem>
              <SelectItem value={InvoiceStatus.LISTED}>Listed</SelectItem>
              <SelectItem value={InvoiceStatus.PARTIALLY_FUNDED}>
                Partially Funded
              </SelectItem>
              <SelectItem value={InvoiceStatus.FULLY_FUNDED}>
                Fully Funded
              </SelectItem>
              <SelectItem value={InvoiceStatus.DISBURSED}>Disbursed</SelectItem>
              <SelectItem value={InvoiceStatus.PENDING_REPAYMENT}>
                Pending Repayment
              </SelectItem>
              <SelectItem value={InvoiceStatus.REPAID}>Repaid</SelectItem>
              <SelectItem value={InvoiceStatus.OVERDUE}>Overdue</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Results Summary */}
      <div className="text-sm text-muted-foreground">
        Showing {filteredInvoices.length} of {mockInvoices.length} invoices
      </div>

      {/* Invoice Table */}
      <InvoiceTable invoices={filteredInvoices} />
    </div>
  );
}
