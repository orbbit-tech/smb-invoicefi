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
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <h3 className="font-semibold text-lg">{invoice.invoiceNumber}</h3>
            <p className="text-sm text-muted-foreground">{invoice.payer.name}</p>
          </div>
          <InvoiceStatusBadge status={invoice.status} />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Amount</p>
              <p className="font-semibold">{formattedAmount}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Due Date</p>
              <p className="font-semibold text-sm">{formattedDueDate}</p>
            </div>
          </div>
        </div>

        {invoice.fundingProgress > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Funding Progress</span>
              <span className="font-medium">{invoice.fundingProgress}%</span>
            </div>
            <Progress value={invoice.fundingProgress} />
          </div>
        )}

        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
          <div>
            <p className="text-xs text-muted-foreground">APY</p>
            <p className="font-semibold text-green-600">{invoice.apy}%</p>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Link href={`/invoices/${invoice.id}`} className="w-full">
          <Button variant="outline" className="w-full">
            View Details
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}
