'use client';

import { Card, Separator, Avatar, AvatarImage, AvatarFallback } from '../../';
import { InvoiceDetailData, PayerHistoryData } from './types';

interface PayerInformationProps {
  invoice: InvoiceDetailData;
  payerHistory?: PayerHistoryData;
}

/**
 * Payer Information Component
 *
 * Displays payer details and payment history
 * Reusable across SMB and Investor applications
 */
export function PayerInformation({
  invoice,
  payerHistory = {
    paymentHistory: '100% On-Time',
    totalInvoicesPaid: 127,
    averagePaymentTime: 28,
  },
}: PayerInformationProps) {
  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString();
  };

  return (
    <Card className="p-6 space-y-4">
      <h2 className="text-base font-semibold">Payer Information</h2>
      <Separator />
      <div className="flex items-center gap-3">
        <Avatar className="h-12 w-12 bg-neutral-200/80 shadow-sm">
          <AvatarImage src={invoice.payerLogoUrl} />
          <AvatarFallback className="bg-neutral-200/80 font-semibold">
            {invoice.payerName[0].toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div>
          <p className="font-semibold">{invoice.payerName}</p>
          <p className="text-sm text-muted-foreground">
            {invoice.status === 'repaid' && invoice.settlementDate
              ? `Paid on ${formatDate(invoice.settlementDate)}`
              : `Payment due on ${formatDate(invoice.dueDate)}`}
          </p>
        </div>
      </div>
      <div className="bg-neutral-100/80 p-4 rounded-md space-y-2">
        <div className="flex justify-between">
          <span className="text-sm text-muted-foreground">
            Payment History
          </span>
          <span className="text-sm font-semibold">
            {payerHistory.paymentHistory}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm text-muted-foreground">
            Total Invoices Paid
          </span>
          <span className="text-sm font-semibold">
            {payerHistory.totalInvoicesPaid}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm text-muted-foreground">
            Average Payment Time
          </span>
          <span className="text-sm font-semibold">
            {payerHistory.averagePaymentTime} days
          </span>
        </div>
      </div>
    </Card>
  );
}
