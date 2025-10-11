'use client';

import { Card, CardContent, CardFooter, CardHeader } from '@ui';
import { Button } from '@ui';
import { Progress } from '@ui';
import { Invoice } from '@/types/invoice';
import { InvoiceStatusBadge } from './invoice-status-badge';
import { Calendar, DollarSign, TrendingUp } from 'lucide-react';
import Link from 'next/link';

interface InvoiceCardProps {
  invoice: Invoice;
}

export function InvoiceCard({ invoice }: InvoiceCardProps) {
  const formattedAmount = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
  }).format(invoice.amount);

  const formattedDueDate = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(invoice.dueDate);

  return (
    <Card className="group">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1 min-w-0 flex-1">
            <h3 className="font-semibold text-lg tracking-tight truncate">
              {invoice.invoiceNumber}
            </h3>
            <p className="text-sm text-muted-foreground truncate">
              {invoice.payer.name}
            </p>
          </div>
          <InvoiceStatusBadge status={invoice.status} />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Key metrics grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-muted-foreground">
              <DollarSign className="h-4 w-4" />
              <span className="text-xs">Amount</span>
            </div>
            <p className="font-semibold text-lg">{formattedAmount}</p>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span className="text-xs">Due Date</span>
            </div>
            <p className="font-semibold text-sm">{formattedDueDate}</p>
          </div>
        </div>

        {/* Funding progress */}
        {invoice.fundingProgress > 0 && (
          <div className="space-y-2 pt-2 border-t border-border/40">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Funding</span>
              <span className="font-medium text-primary">
                {invoice.fundingProgress}%
              </span>
            </div>
            <Progress value={invoice.fundingProgress} className="h-2" />
          </div>
        )}

        {/* APY display */}
        <div className="flex items-center justify-between pt-2 border-t border-border/40">
          <div className="flex items-center gap-2 text-muted-foreground">
            <TrendingUp className="h-4 w-4" />
            <span className="text-xs">APY</span>
          </div>
          <p className="font-semibold text-success">{invoice.apy}%</p>
        </div>
      </CardContent>
      <CardFooter className="pt-4">
        <Link href={`/invoices/${invoice.id}`} className="w-full">
          <Button variant="outline" className="w-full">
            View Details
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}
