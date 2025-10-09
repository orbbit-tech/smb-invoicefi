'use client';

import { useState, useMemo } from 'react';
import { InvoiceCard, type InvoiceData } from '@/components/invoices';
import {
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@ui';
import { Search, Filter } from 'lucide-react';

// Mock invoice data - in production this would come from smart contracts
const MOCK_INVOICES: InvoiceData[] = [
  {
    id: 1,
    amount: 50000,
    funded: 35000,
    payer: 'Microsoft',
    daysUntilDue: 60,
    apy: 10.5,
    riskScore: 'Low',
    status: 'active',
  },
  {
    id: 2,
    amount: 25000,
    funded: 25000,
    payer: 'Salesforce',
    daysUntilDue: 45,
    apy: 9.2,
    riskScore: 'Low',
    status: 'funded',
  },
  {
    id: 3,
    amount: 75000,
    funded: 15000,
    payer: 'Oracle',
    daysUntilDue: 90,
    apy: 12.1,
    riskScore: 'Medium',
    status: 'active',
  },
  {
    id: 4,
    amount: 30000,
    funded: 5000,
    payer: 'Adobe',
    daysUntilDue: 30,
    apy: 8.5,
    riskScore: 'Low',
    status: 'active',
  },
  {
    id: 5,
    amount: 100000,
    funded: 20000,
    payer: 'IBM',
    daysUntilDue: 120,
    apy: 13.2,
    riskScore: 'Medium',
    status: 'active',
  },
];

export default function MarketplacePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [riskFilter, setRiskFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('apy-desc');

  // Filter and sort invoices
  const filteredInvoices = useMemo(() => {
    let filtered = MOCK_INVOICES;

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter((invoice) =>
        invoice.payer.toLowerCase().includes(searchQuery.toLowerCase())
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

  const handleFundInvoice = (invoiceId: number | string) => {
    // TODO: Open funding modal
    console.log('Fund invoice:', invoiceId);
  };

  return (
    <>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Invoice Marketplace
        </h1>
        <p className="text-muted-foreground">
          Browse and fund SMB invoices to earn yield on USDC
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-card p-4 rounded-lg border">
          <div className="text-sm text-muted-foreground mb-1">
            Total Available
          </div>
          <div className="text-2xl font-bold text-foreground">
            $
            {MOCK_INVOICES.reduce(
              (sum, inv) => sum + inv.amount,
              0
            ).toLocaleString()}
          </div>
        </div>
        <div className="bg-card p-4 rounded-lg border">
          <div className="text-sm text-muted-foreground mb-1">
            Active Invoices
          </div>
          <div className="text-2xl font-bold text-foreground">
            {MOCK_INVOICES.filter((inv) => inv.status === 'active').length}
          </div>
        </div>
        <div className="bg-card p-4 rounded-lg border">
          <div className="text-sm text-muted-foreground mb-1">Average APY</div>
          <div className="text-2xl font-bold text-success">
            {(
              MOCK_INVOICES.reduce((sum, inv) => sum + inv.apy, 0) /
              MOCK_INVOICES.length
            ).toFixed(1)}
            %
          </div>
        </div>
        <div className="bg-card p-4 rounded-lg border">
          <div className="text-sm text-muted-foreground mb-1">
            Funding Progress
          </div>
          <div className="text-2xl font-bold text-primary">
            {(
              (MOCK_INVOICES.reduce((sum, inv) => sum + inv.funded, 0) /
                MOCK_INVOICES.reduce((sum, inv) => sum + inv.amount, 0)) *
              100
            ).toFixed(0)}
            %
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search by payer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Risk Filter */}
        <Select value={riskFilter} onValueChange={setRiskFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
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
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
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
        <div className="grid grid-cols-1 gap-4">
          {filteredInvoices.map((invoice) => (
            <InvoiceCard
              key={invoice.id}
              invoice={invoice}
              onFund={handleFundInvoice}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            No invoices found matching your filters
          </p>
        </div>
      )}
    </>
  );
}
