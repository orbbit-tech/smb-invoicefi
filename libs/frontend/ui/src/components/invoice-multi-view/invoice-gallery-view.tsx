'use client';

import {
  Card,
  CardHeader,
  CardContent,
  Badge,
  Avatar,
  AvatarImage,
  AvatarFallback,
} from '../shadcn';
import { Invoice, InvoiceMultiViewConfig } from '../../types';
import { InvoiceStatusBadge } from './invoice-status-badge';
import { EntityInfo } from './entity-info';
import { Calendar } from 'lucide-react';
import Link from 'next/link';

interface InvoiceGalleryViewProps {
  invoices: Invoice[];
  baseRoute?: string;
  config?: InvoiceMultiViewConfig;
  onRepaymentClick?: (invoice: Invoice) => void;
}

export function InvoiceGalleryView({
  invoices,
  baseRoute = '/invoices',
  config,
}: InvoiceGalleryViewProps) {
  const showSmbInfo = config?.showSmbColumn ?? false;
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'numeric',
      year: 'numeric',
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
        <Link key={invoice.id} href={`${baseRoute}/${invoice.id}`}>
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader className="p-4 pb-3">
              {/* Invoice Info */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">
                    {invoice.invoiceNumber}
                  </p>
                  <InvoiceStatusBadge status={invoice.status} />
                </div>

                {showSmbInfo && invoice.smb ? (
                  <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8 bg-neutral-200/80 shadow-sm flex-shrink-0">
                      <AvatarImage
                        src={invoice.smb.logoUrl}
                        alt={invoice.smb.name}
                      />
                      <AvatarFallback className="bg-neutral-200/80 font-semibold text-xs">
                        {invoice.smb.name[0]?.toUpperCase() || '?'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {invoice.smb.name}
                      </p>
                    </div>
                  </div>
                ) : (
                  <EntityInfo
                    name={invoice.payer.name}
                    logoUrl={invoice.payer.logoUrl}
                    secondaryInfo={invoice.payer.industry}
                    size="sm"
                  />
                )}
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-0 space-y-2">
              {/* Amount */}
              <div className="font-bold">{formatCurrency(invoice.amount)}</div>

              {/* Payer Name */}
              {showSmbInfo && (
                <p className="text-xs text-muted-foreground">
                  {invoice.payer.name}
                </p>
              )}

              {/* Due Date */}
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <span> {formatDate(invoice.dueDate)}</span>
                {invoice.daysUntilDue > 0 && (
                  <span className="ml-1">({invoice.daysUntilDue}d)</span>
                )}
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
