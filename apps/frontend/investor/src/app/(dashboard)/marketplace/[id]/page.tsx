'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import {
  Card,
  Badge,
  Button,
  Separator,
  Avatar,
  AvatarFallback,
  AvatarImage,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@ui';
import {
  ArrowLeft,
  FileText,
  ShieldCheck,
  TrendingUp,
  Loader2,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';
import { toast } from 'sonner';
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

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

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

  // Since we only support full funding (no partial), the funding amount is the full discounted amount
  const fundingAmountRequired = invoice.amount * (1 - invoice.discountRate);

  // Calculate expected returns based on discount rate model
  const expectedReceiveBack =
    fundingAmountRequired / (1 - invoice.discountRate);
  const expectedProfit = expectedReceiveBack - fundingAmountRequired;

  // Handler for funding submission (full amount only)
  const handleFundInvoice = async () => {
    setIsProcessing(true);

    try {
      // TODO: Replace with actual blockchain transaction
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Show success state in modal
      setShowSuccess(true);
    } catch (error) {
      toast.error('Failed to process funding', {
        description: 'Please try again later',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Handler to close modal and reset states
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setShowSuccess(false);
  };

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
              <TrendingUp className="h-5 w-5 " />
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
                  ${fundingAmountRequired.toLocaleString()}
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
              <FileText className="h-5 w-5 " />
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
              <ShieldCheck className="h-5 w-5 " />
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
              <p className="text-sm font-semibold">Top :</p>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                <li>Strong payer credit history</li>
                <li>Established business relationship</li>
                <li>Short payment term (30 days)</li>
              </ul>
            </div>
          </Card>

          {/* Fund Button - Primary Action */}
          <Card className="p-6 space-y-4 bg-primary/5 border-primary/20">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Ready to fund this invoice?
              </p>
              <Button className="w-full" onClick={() => setIsModalOpen(true)}>
                Fund Invoice
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                Connect your wallet to continue
              </p>
            </div>
          </Card>
        </div>
      </div>

      {/* Funding Modal */}
      <Dialog open={isModalOpen} onOpenChange={handleCloseModal}>
        <DialogContent className="sm:max-w-[500px]">
          {!showSuccess ? (
            <>
              <DialogHeader>
                <DialogTitle>Confirm Funding</DialogTitle>
                <DialogDescription>
                  Review your investment details before confirming.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-3 py-4 bg-neutral-100 p-4 rounded-lg">
                {/* Invoice Details */}
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    Invoice Amount
                  </span>
                  <span className="text-sm font-semibold">
                    ${invoice.amount.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    Discount Rate
                  </span>
                  <span className="text-sm font-semibold">
                    {(invoice.discountRate * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">APY</span>
                  <span className="text-sm font-semibold">{invoice.apy}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Term</span>
                  <span className="text-sm font-semibold">
                    {invoice.daysUntilDue} days
                  </span>
                </div>

                <Separator />
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    Investment Required
                  </span>
                  <span className="text-sm font-bold">
                    ${fundingAmountRequired.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    Expected Payout
                  </span>
                  <span className="text-sm font-semibold">
                    $
                    {expectedReceiveBack.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    Expected Profit
                  </span>
                  <span className="text-sm font-semibold">
                    $
                    {expectedProfit.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>
              </div>

              {/* Total Summary */}
              <div className="bg-neutral-100 p-4 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="font-semibold">Total to Fund</span>
                  <span className="text-lg font-bold">
                    ${fundingAmountRequired.toLocaleString()}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Due: {new Date(invoice.dueDate).toLocaleDateString()} (
                  {invoice.daysUntilDue} days)
                </p>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={handleCloseModal}
                  disabled={isProcessing}
                >
                  Cancel
                </Button>
                <Button onClick={handleFundInvoice} disabled={isProcessing}>
                  {isProcessing && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {isProcessing
                    ? 'Processing...'
                    : `Confirm Funding $${fundingAmountRequired.toLocaleString()}`}
                </Button>
              </DialogFooter>
            </>
          ) : (
            <>
              {/* Success Screen */}
              <div className="space-y-6 py-6">
                {/* Success Icon */}
                <div className="flex justify-center rounded-full">
                  <CheckCircle2 className="h-16 w-16 " />
                </div>

                {/* Success Message */}
                <div className="text-center space-y-2">
                  <DialogTitle className="text-2xl">
                    Investment Successful!
                  </DialogTitle>
                  <DialogDescription className="text-base">
                    You've successfully funded invoice #{invoice.id}
                  </DialogDescription>
                </div>

                {/* Transaction Summary */}
                <div className="bg-neutral-100/80 p-6 rounded-lg space-y-4">
                  <h3 className="font-semibold text-center">
                    Transaction Summary
                  </h3>
                  <Separator />
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Company</span>
                      <span className="font-semibold">
                        {invoice.companyName}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Investment Amount
                      </span>
                      <span className="font-semibold">
                        ${fundingAmountRequired.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Expected Payout
                      </span>
                      <span className="font-semibold">
                        $
                        {expectedReceiveBack.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Expected Profit
                      </span>
                      <span className="font-bold">
                        $
                        {expectedProfit.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                    <Separator />
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Due Date</span>
                      <span className="font-semibold">
                        {new Date(invoice.dueDate).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Term</span>
                      <span className="font-semibold">
                        {invoice.daysUntilDue} days
                      </span>
                    </div>
                  </div>
                </div>

                {/* Transaction Hash (Placeholder) */}
                <div className="bg-primary/5 border border-primary/20 p-4 rounded-lg">
                  <div className="flex items-center justify-between gap-2">
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">
                        Transaction Hash
                      </p>
                      <p className="text-sm font-mono">0x1234...5678</p>
                    </div>
                    <Button variant="ghost" size="sm" className="gap-1">
                      <ExternalLink className="h-3 w-3" />
                      View
                    </Button>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => router.push('/portfolio')}
                  >
                    View Portfolio
                  </Button>
                  <Button className="flex-1" onClick={handleCloseModal}>
                    Done
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
