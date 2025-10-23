'use client';

import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Separator,
  Badge,
  InvoiceDetailHeader,
  InvoiceMetrics,
} from '@ui';
import { Invoice, InvoiceStatus } from '@/types/invoice';
import { InvoiceStatusBadge } from './invoice-status-badge';
import {
  ArrowLeft,
  Calendar,
  DollarSign,
  TrendingUp,
  Building2,
  FileText,
  CheckCircle2,
  Clock,
  AlertCircle,
} from 'lucide-react';
import Link from 'next/link';

interface InvoiceDetailClientProps {
  invoice: Invoice;
}

export function InvoiceDetailClient({ invoice }: InvoiceDetailClientProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    }).format(date);
  };

  // Calculate expected funding amount (80% of invoice)
  const expectedFunding = invoice.amount * 0.8;

  // Timeline steps based on invoice status
  const getTimelineSteps = () => {
    const steps = [
      {
        label: 'Created',
        status: InvoiceStatus.CREATED,
        icon: FileText,
        date: invoice.createdDate,
        completed: true,
      },
      {
        label: 'Listed for Funding',
        status: InvoiceStatus.LISTED,
        icon: TrendingUp,
        completed: [
          InvoiceStatus.LISTED,
          InvoiceStatus.FULLY_FUNDED,
          InvoiceStatus.DISBURSED,
          InvoiceStatus.PENDING_REPAYMENT,
          InvoiceStatus.REPAID,
        ].includes(invoice.status),
      },
      {
        label: 'Fully Funded',
        status: InvoiceStatus.FULLY_FUNDED,
        icon: CheckCircle2,
        completed: [
          InvoiceStatus.FULLY_FUNDED,
          InvoiceStatus.DISBURSED,
          InvoiceStatus.PENDING_REPAYMENT,
          InvoiceStatus.REPAID,
        ].includes(invoice.status),
      },
      {
        label: 'Funds Disbursed',
        status: InvoiceStatus.DISBURSED,
        icon: DollarSign,
        date: invoice.disbursedDate,
        completed: [
          InvoiceStatus.DISBURSED,
          InvoiceStatus.PENDING_REPAYMENT,
          InvoiceStatus.REPAID,
        ].includes(invoice.status),
      },
      {
        label: 'Repaid',
        status: InvoiceStatus.REPAID,
        icon: CheckCircle2,
        date: invoice.repaidDate,
        completed: invoice.status === InvoiceStatus.REPAID,
      },
    ];

    return steps;
  };

  const timelineSteps = getTimelineSteps();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link href="/">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Invoices
          </Button>
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {invoice.invoiceNumber}
            </h1>
            <p className="text-muted-foreground mt-1">{invoice.payer.name}</p>
          </div>
          <InvoiceStatusBadge status={invoice.status} />
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - Main Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Invoice Information Card */}
          <InvoiceMetrics
            invoice={{
              id: invoice.id,
              companyName: invoice.payer.name,
              amount: invoice.amount,
              dueDate: invoice.dueDate,
              apr: invoice.apr,
              daysUntilDue: invoice.daysUntilDue,
              discountRate: 0,
              payerName: invoice.payer.name,
            }}
            title="Invoice Information"
            metrics={[
              {
                label: 'Invoice Amount',
                value: formatCurrency(invoice.amount),
              },
              {
                label: 'Expected Funding',
                value: formatCurrency(expectedFunding),
                subtitle: '80% of invoice value',
              },
              {
                label: 'Due Date',
                value: formatDate(invoice.dueDate),
                subtitle:
                  invoice.daysUntilDue > 0
                    ? `${invoice.daysUntilDue} days remaining`
                    : 'Overdue',
              },
              {
                label: 'Payer',
                value: invoice.payer.name,
                subtitle: invoice.payer.industry,
              },
            ]}
          />

          {/* Additional Details Card */}
          {invoice.description && (
            <Card>
              <CardHeader>
                <CardTitle>Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{invoice.description}</p>
              </CardContent>
            </Card>
          )}

          {/* APR and Created Date */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">APR</p>
                  <p className="text-lg font-semibold">{invoice.apr}%</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Created</p>
                  <p className="text-sm font-medium">
                    {formatDate(invoice.createdDate)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Timeline Card */}
          <Card>
            <CardHeader>
              <CardTitle>Invoice Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {timelineSteps.map((step, index) => {
                  const Icon = step.icon;
                  const isLast = index === timelineSteps.length - 1;

                  return (
                    <div key={step.label} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            step.completed
                              ? 'bg-primarytext-primary-foreground'
                              : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          <Icon className="h-4 w-4" />
                        </div>
                        {!isLast && (
                          <div
                            className={`w-px h-8 ${
                              step.completed ? 'bg-primary' : 'bg-border'
                            }`}
                          />
                        )}
                      </div>
                      <div className="flex-1 pb-4">
                        <p
                          className={`font-medium ${
                            step.completed ? '' : 'text-muted-foreground'
                          }`}
                        >
                          {step.label}
                        </p>
                        {step.date && (
                          <p className="text-sm text-muted-foreground">
                            {formatDate(step.date)}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Summary */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Quick Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <InvoiceStatusBadge status={invoice.status} className="mt-1" />
              </div>
              <Separator />
              <div>
                <p className="text-sm text-muted-foreground">Invoice Amount</p>
                <p className="text-lg font-bold">
                  {formatCurrency(invoice.amount)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">You Receive</p>
                <p className="text-lg font-bold">
                  {formatCurrency(expectedFunding)}
                </p>
              </div>
              <Separator />
              {invoice.disbursedDate && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Disbursed On
                    </p>
                    <p className="text-sm font-medium">
                      {formatDate(invoice.disbursedDate)}
                    </p>
                  </div>
                </>
              )}
              {invoice.repaidDate && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm text-muted-foreground">Repaid On</p>
                    <p className="text-sm font-medium">
                      {formatDate(invoice.repaidDate)}
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
