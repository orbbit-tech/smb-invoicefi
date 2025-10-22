'use client';

import { Card, CardHeader, CardContent, Badge, Button } from '@ui';
import { Invoice } from '@/types/invoice';
import { InvoiceStatusBadge } from './invoice-status-badge';
import { Eye, Calendar, DollarSign, TrendingUp } from 'lucide-react';
import Link from 'next/link';

interface InvoiceGalleryViewProps {
  invoices: Invoice[];
}

export function InvoiceGalleryView({ invoices }: InvoiceGalleryViewProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(date);
  };

  const getRiskColor = (riskScore: string) => {
    switch (riskScore) {
      case 'LOW':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'HIGH':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  if (invoices.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>No invoices found</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {invoices.map((invoice) => (
        <Card key={invoice.id} className="hover:shadow-lg transition-shadow">
          <CardHeader className="space-y-3">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Invoice</p>
                <h3 className="font-mono text-base font-semibold">
                  {invoice.invoiceNumber}
                </h3>
              </div>
              <InvoiceStatusBadge status={invoice.status} />
            </div>

            <div className="flex items-baseline gap-1">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <span className="text-xl font-semibold">
                {formatCurrency(invoice.amount)}
              </span>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Payer Information */}
            <div>
              <p className="text-sm font-medium">{invoice.payer.name}</p>
              {invoice.payer.industry && (
                <p className="text-xs text-muted-foreground">
                  {invoice.payer.industry}
                </p>
              )}
            </div>

            {/* Metrics Row */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  <span>Due Date</span>
                </div>
                <p className="text-sm font-medium">
                  {formatDate(invoice.dueDate)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {invoice.daysUntilDue} days
                </p>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <TrendingUp className="h-3 w-3" />
                  <span>APY</span>
                </div>
                <p className="text-sm font-medium">{invoice.apy}%</p>
              </div>
            </div>

            {/* Risk Badge */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Risk:</span>
              <Badge className={getRiskColor(invoice.riskScore)} variant="secondary">
                {invoice.riskScore}
              </Badge>
            </div>

            {/* Actions */}
            <Link href={`/invoices/${invoice.id}`} className="block">
              <Button variant="outline" size="sm" className="w-full">
                <Eye className="h-4 w-4 mr-2" />
                View Details
              </Button>
            </Link>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
