'use client';

import { Button } from '@ui';
import { Card, CardContent, CardHeader, CardTitle } from '@ui';
import { Progress } from '@ui';
import { Separator } from '@ui';
import { Badge } from '@ui';
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
          InvoiceStatus.PARTIALLY_FUNDED,
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
    <div className="py-8 space-y-6">
      {/* Header */}
      <div>
        <Link href="/invoices">
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
          <Card>
            <CardHeader>
              <CardTitle>Invoice Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="flex items-start gap-3">
                  <DollarSign className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Invoice Amount
                    </p>
                    <p className="text-2xl font-bold">
                      {formatCurrency(invoice.amount)}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <TrendingUp className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Expected Funding
                    </p>
                    <p className="text-2xl font-bold">
                      {formatCurrency(expectedFunding)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      80% of invoice value
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Due Date</p>
                    <p className="font-semibold">
                      {formatDate(invoice.dueDate)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {invoice.daysUntilDue > 0
                        ? `${invoice.daysUntilDue} days remaining`
                        : 'Overdue'}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Building2 className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Payer</p>
                    <p className="font-semibold">{invoice.payer.name}</p>
                    {invoice.payer.industry && (
                      <p className="text-xs text-muted-foreground">
                        {invoice.payer.industry}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {invoice.description && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">
                      Description
                    </p>
                    <p className="text-sm">{invoice.description}</p>
                  </div>
                </>
              )}

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Risk Score</p>
                  <Badge
                    variant={
                      invoice.riskScore === 'LOW' ? 'default' : 'secondary'
                    }
                  >
                    {invoice.riskScore}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">APY</p>
                  <p className="text-lg font-semibold">{invoice.apy}%</p>
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

          {/* Funding Progress Card */}
          {[
            InvoiceStatus.LISTED,
            InvoiceStatus.PARTIALLY_FUNDED,
            InvoiceStatus.FULLY_FUNDED,
          ].includes(invoice.status) && (
            <Card>
              <CardHeader>
                <CardTitle>Funding Progress</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Amount Funded</span>
                    <span className="font-semibold">
                      {formatCurrency(invoice.fundedAmount)} /{' '}
                      {formatCurrency(invoice.amount)}
                    </span>
                  </div>
                  <Progress value={invoice.fundingProgress} className="h-2" />
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-semibold">
                      {invoice.fundingProgress}%
                    </span>
                  </div>
                </div>

                {invoice.status === InvoiceStatus.FULLY_FUNDED && (
                  <div className="rounded-lg border p-4">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4" />
                      <p className="font-semibold">Fully Funded!</p>
                    </div>
                    <p className="text-sm mt-1">
                      Your invoice has been fully funded. Funds will be
                      disbursed to your account shortly.
                    </p>
                  </div>
                )}

                {invoice.status === InvoiceStatus.PARTIALLY_FUNDED && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-blue-800">
                      <Clock className="h-4 w-4" />
                      <p className="font-semibold">Funding in Progress</p>
                    </div>
                    <p className="text-sm text-blue-700 mt-1">
                      Your invoice is being funded by investors. You'll receive
                      funds once it reaches 100%.
                    </p>
                  </div>
                )}

                {invoice.status === InvoiceStatus.LISTED && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-yellow-800">
                      <AlertCircle className="h-4 w-4" />
                      <p className="font-semibold">Listed for Funding</p>
                    </div>
                    <p className="text-sm text-yellow-700 mt-1">
                      Your invoice is now available to investors. Funding
                      typically completes within 24 hours.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

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
                              ? 'bg-primary text-primary-foreground'
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
              <div>
                <p className="text-sm text-muted-foreground">
                  Funding Progress
                </p>
                <p className="text-lg font-bold">{invoice.fundingProgress}%</p>
              </div>
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
