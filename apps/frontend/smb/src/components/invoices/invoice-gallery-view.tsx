'use client';

import {
  Card,
  CardHeader,
  CardContent,
  Badge,
  Avatar,
  AvatarImage,
  AvatarFallback,
} from '@ui';
import { Invoice } from '@/types/invoice';
import { InvoiceStatusBadge } from './invoice-status-badge';
import { Calendar } from 'lucide-react';
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
    }).format(date);
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
        <Link key={invoice.id} href={`/invoices/${invoice.id}`}>
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader className="p-4 pb-3">
              {/* Avatar and Status Badge Row */}
              <div className="flex items-start justify-between mb-3">
                <Avatar className="h-10 w-10 shrink-0">
                  <AvatarImage
                    src={invoice.payer.logoUrl}
                    alt={invoice.payer.name}
                  />
                  <AvatarFallback className="bg-muted text-base font-medium">
                    {invoice.payer.name[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <InvoiceStatusBadge status={invoice.status} />
              </div>

              {/* Invoice Info */}
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">
                  {invoice.invoiceNumber}
                </p>
                <h4 className="font-semibold text-sm truncate">
                  {invoice.payer.name}
                </h4>
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-0 space-y-2">
              {/* Amount */}
              <div className="text-lg font-bold">
                {formatCurrency(invoice.amount)}
              </div>

              {/* Due Date */}
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3" />
                <span>Due: {formatDate(invoice.dueDate)}</span>
                <span className="ml-1">({invoice.daysUntilDue}d)</span>
              </div>

              {/* Industry */}
              {invoice.payer.industry && (
                <p className="text-xs text-muted-foreground truncate">
                  {invoice.payer.industry}
                </p>
              )}
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
