'use client';

import { useParams, useRouter } from 'next/navigation';
import {
  Card,
  Badge,
  Button,
  Separator,
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@ui';
import { ArrowLeft, FileText, ShieldCheck, TrendingUp } from 'lucide-react';
import { type InvoiceData } from '@/components/invoices';
import { getInvoiceById } from '@/data/mock-invoices';

/**
 * Invoice Detail Page
 *
 * Clean Dashboard Design principles:
 * - Consistent 24px (p-6) padding
 * - Clear visual hierarchy
 * - Comprehensive information display
 * - Primary action prominently displayed
 */

export default function InvoiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const invoiceId = params.id as string;
  const invoice = getInvoiceById(invoiceId);

  if (!invoice) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => router.back()} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Marketplace
        </Button>
        <Card className="p-12">
          <div className="text-center">
            <p className="text-lg text-muted-foreground">Invoice not found</p>
          </div>
        </Card>
      </div>
    );
  }

  const fundedPercent = (invoice.funded / invoice.amount) * 100;
  const remainingToFund = invoice.amount - invoice.funded;
  const fundingAmount = invoice.amount * (1 - invoice.discountRate);

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Back Button */}
      <Button variant="ghost" onClick={() => router.back()} className="gap-2">
        <ArrowLeft className="h-4 w-4" />
        Back to Marketplace
      </Button>

      {/* Header Section */}
      <div className="space-y-1">
        <div className="flex items-center gap-3">
          <Avatar className="h-16 w-16 bg-neutral-200/80 shadow-sm">
            <AvatarImage src={invoice.companyLogoUrl} />
            <AvatarFallback className="bg-neutral-200/80 font-semibold text-lg">
              {invoice.companyName[0].toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-2xl font-bold text-foreground leading-tight">
              {invoice.companyName}
            </h1>
            <p className="text-muted-foreground">
              Invoice #{invoice.id} • {invoice.category}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content - Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Key Metrics */}
          <Card className="p-6 space-y-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold">Investment Overview</h2>
            </div>
            <Separator />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Invoice Amount</p>
                <p className="text-2xl font-bold">
                  ${invoice.amount.toLocaleString()}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">APY</p>
                <p className="text-2xl font-bold">{invoice.apy}%</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Term</p>
                <p className="text-2xl font-bold">{invoice.daysUntilDue}d</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Expected Return</p>
                <p className="text-2xl font-bold">
                  ${invoice.return.toLocaleString()}
                </p>
              </div>
            </div>
          </Card>

          {/* Financial Breakdown */}
          <Card className="p-6 space-y-4">
            <h2 className="text-lg font-semibold">Financial Details</h2>
            <Separator />
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Invoice Amount</span>
                <span className="font-semibold">
                  ${invoice.amount.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Discount Rate</span>
                <span className="font-semibold">
                  {(invoice.discountRate * 100).toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Funding Amount</span>
                <span className="font-semibold">
                  ${fundingAmount.toLocaleString()}
                </span>
              </div>
              <Separator />
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Due Date</span>
                <span className="font-semibold">
                  {new Date(invoice.dueDate).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Days Until Due</span>
                <span className="font-semibold">{invoice.daysUntilDue}</span>
              </div>
              <Separator />
              <div className="flex justify-between items-center">
                <span className="font-semibold">Expected Return</span>
                <span className="text-lg font-bold">
                  ${invoice.return.toLocaleString()}
                </span>
              </div>
            </div>
          </Card>

          {/* Payer Information */}
          <Card className="p-6 space-y-4">
            <h2 className="text-lg font-semibold">Payer Information</h2>
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
                  Payment due on{' '}
                  {new Date(invoice.dueDate).toLocaleDateString()}
                </p>
              </div>
            </div>
            <div className="bg-neutral-100/80 p-4 rounded-md space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">
                  Payment History
                </span>
                <span className="text-sm font-semibold">100% On-Time</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">
                  Total Invoices Paid
                </span>
                <span className="text-sm font-semibold">127</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">
                  Average Payment Time
                </span>
                <span className="text-sm font-semibold">28 days</span>
              </div>
            </div>
          </Card>

          {/* Documents Section */}
          <Card className="p-6 space-y-4">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold">Documents</h2>
            </div>
            <Separator />
            <div className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start gap-2"
                disabled
              >
                <FileText className="h-4 w-4" />
                Invoice Document.pdf
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start gap-2"
                disabled
              >
                <FileText className="h-4 w-4" />
                Purchase Order.pdf
              </Button>
              <p className="text-xs text-muted-foreground mt-2">
                Documents will be available after connecting your wallet
              </p>
            </div>
          </Card>
        </div>

        {/* Sidebar - Right Column */}
        <div className="lg:col-span-1 space-y-6">
          {/* Risk Assessment */}
          <Card className="p-6 space-y-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold">Risk Assessment</h2>
            </div>
            <Separator />
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  Risk Level
                </span>
                <Badge variant="secondary">{invoice.riskScore}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Industry</span>
                <Badge variant="secondary">{invoice.category}</Badge>
              </div>
            </div>
            <div className="bg-neutral-100/80 p-4 rounded-md space-y-2">
              <p className="text-sm font-semibold">Risk Factors:</p>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                <li>Strong payer credit history</li>
                <li>Established business relationship</li>
                <li>Short payment term (30 days)</li>
              </ul>
            </div>
          </Card>

          {/* Funding Progress */}
          <Card className="p-6 space-y-4">
            <h2 className="text-lg font-semibold">Funding Progress</h2>
            <Separator />
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Funded</span>
                <span className="font-semibold">
                  ${invoice.funded.toLocaleString()}
                </span>
              </div>
              <div className="w-full bg-neutral-200 rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all"
                  style={{ width: `${fundedPercent}%` }}
                />
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Remaining</span>
                <span className="font-semibold">
                  ${remainingToFund.toLocaleString()}
                </span>
              </div>
            </div>
          </Card>

          {/* Fund Button - Primary Action */}
          <Card className="p-6 space-y-4 bg-primary/5 border-primary/20">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Ready to fund this invoice?
              </p>
              <Button
                className="w-full"
                onClick={() => {
                  // TODO: Open funding modal
                  console.log('Fund invoice:', invoice.id);
                }}
              >
                Fund Invoice
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                Connect your wallet to continue
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
