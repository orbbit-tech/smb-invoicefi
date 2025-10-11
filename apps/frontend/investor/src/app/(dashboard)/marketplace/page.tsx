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
} from '@ui';
import { Search, Filter } from 'lucide-react';
import { MOCK_INVOICES } from '@/data/mock-invoices';

/**
 * Marketplace Page
 *
 * Clean Dashboard Design principles:
 * - Consistent spacing and hierarchy
 * - Clear visual grouping
 * - Professional stats display
 */

export default function MarketplacePage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [riskFilter, setRiskFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('default');

  // Filter and sort invoices
  const filteredInvoices = useMemo(() => {
    let filtered = MOCK_INVOICES;

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter((invoice) =>
        invoice.payerName.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Risk filter
    if (riskFilter !== 'all') {
      filtered = filtered.filter((invoice) => invoice.riskScore === riskFilter);
    }

    // Sort
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'apy-desc':
          return b.apy - a.apy;
        case 'apy-asc':
          return a.apy - b.apy;
        case 'amount-desc':
          return b.amount - a.amount;
        case 'amount-asc':
          return a.amount - b.amount;
        case 'due-date-asc':
          return a.daysUntilDue - b.daysUntilDue;
        case 'due-date-desc':
          return b.daysUntilDue - a.daysUntilDue;
        default:
          return 0;
      }
    });

    return sorted;
  }, [searchQuery, riskFilter, sortBy]);

  const handleClickInvoice = (invoice: InvoiceData) => {
    router.push(`/marketplace/${invoice.id}`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-foreground leading-tight">
          Invoice Marketplace
        </h1>
        <p className=" text-muted-foreground leading-relaxed">
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
            className="pl-10 h-11"
          />
        </div>

        {/* Risk Filter */}
        <Select value={riskFilter} onValueChange={setRiskFilter}>
          <SelectTrigger className="w-full sm:w-[200px] h-11">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Risk Level" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Risk Levels</SelectItem>
            <SelectItem value="Low">Low Risk</SelectItem>
            <SelectItem value="Medium">Medium Risk</SelectItem>
            <SelectItem value="High">High Risk</SelectItem>
          </SelectContent>
        </Select>

        {/* Sort */}
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-full sm:w-[200px] h-11">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="default">Default</SelectItem>
            <SelectItem value="apy-desc">APY (High to Low)</SelectItem>
            <SelectItem value="apy-asc">APY (Low to High)</SelectItem>
            <SelectItem value="amount-desc">Amount (High to Low)</SelectItem>
            <SelectItem value="amount-asc">Amount (Low to High)</SelectItem>
            <SelectItem value="due-date-asc">Due Date (Soonest)</SelectItem>
            <SelectItem value="due-date-desc">Due Date (Latest)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Invoice Grid */}
      {filteredInvoices.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {filteredInvoices.map((invoice) => (
            <InvoiceCard
              key={invoice.id}
              invoice={invoice}
              onClick={handleClickInvoice}
            />
          ))}
        </div>
      ) : (
        <Card className="p-12 col-span-1">
          <div className="text-center">
            <p className="text-lg text-muted-foreground">
              No invoices found matching your filters
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Try adjusting your search criteria
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}
