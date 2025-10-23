'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useMemo } from 'react';
import { useAccount } from 'wagmi';
import {
  Card,
  Badge,
  Button,
  Separator,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  InvoiceDetailHeader,
  InvoiceMetrics,
  PayerInformation,
  RiskAssessment,
  FinancialBreakdown,
  DocumentsSection,
} from '@ui';
import {
  ArrowLeft,
  Loader2,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';
import { toast } from 'sonner';
import { type InvoiceData } from '@/components/invoices';
import { useMarketplaceInvoice } from '@/hooks/api';
import { useInvoiceData } from '@/hooks/blockchain';
import { mapMarketplaceDetail } from '@/lib/mappers/invoice-mapper';
import { NFTOwnership } from '@/components/portfolio';

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
  const { address } = useAccount();
  const invoiceId = params.id as string;

  // Fetch invoice data from API
  const { data: apiData, isLoading, isError } = useMarketplaceInvoice(invoiceId);

  // Map API data to frontend format
  const invoiceDetail = useMemo(() => {
    if (!apiData) return null;
    return mapMarketplaceDetail(apiData);
  }, [apiData]);

  // Fetch blockchain data if NFT token ID exists
  const contractAddress = process.env.NEXT_PUBLIC_INVOICE_CONTRACT_ADDRESS as `0x${string}` | undefined;
  const { data: blockchainData } = useInvoiceData(
    invoiceDetail?.nftTokenId,
    contractAddress
  );

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Convert to InvoiceData format for components
  const invoice: InvoiceData | null = useMemo(() => {
    if (!invoiceDetail) return null;
    return {
      id: invoiceDetail.id,
      companyName: invoiceDetail.issuer.name,
      companyLogoUrl: undefined,
      dueDate: invoiceDetail.dueDate.toISOString(),
      category: invoiceDetail.issuer.industry || 'General',
      amount: invoiceDetail.amount,
      funded: 0,
      payerName: invoiceDetail.payer.name,
      payerLogoUrl: undefined,
      daysUntilDue: invoiceDetail.daysUntilDue,
      return: invoiceDetail.expectedReturn,
      apr: invoiceDetail.apr,
      discountRate: invoiceDetail.discountRate,
      riskScore: invoiceDetail.riskScore as 'Low' | 'Medium' | 'High',
      status: 'active',
    };
  }, [invoiceDetail]);

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => router.back()} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Marketplace
        </Button>
        <Card className="p-12">
          <div className="flex flex-col items-center justify-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Loading invoice details...</p>
          </div>
        </Card>
      </div>
    );
  }

  // Error state
  if (isError || !invoice) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => router.back()} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Marketplace
        </Button>
        <Card className="p-12">
          <div className="text-center">
            <p className="text-lg text-destructive">
              {isError ? 'Failed to load invoice' : 'Invoice not found'}
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Please try again or return to the marketplace
            </p>
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
    <div className="space-y-6">
      {/* Back Button */}
      <Button variant="ghost" onClick={() => router.back()} className="gap-2">
        <ArrowLeft className="h-4 w-4" />
        Back to Marketplace
      </Button>

      {/* Header Section */}
      <InvoiceDetailHeader invoice={invoice} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content - Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Financial Breakdown */}
          <FinancialBreakdown
            invoice={invoice}
            lineItems={[
              {
                label: 'Invoice Amount',
                value: `$${invoice.amount.toLocaleString()}`,
              },
              {
                label: 'Discount Rate',
                value: `${(invoice.discountRate * 100).toFixed(1)}%`,
              },
              {
                label: 'Funding Amount',
                value: `$${fundingAmountRequired.toLocaleString()}`,
              },
              {
                label: 'Due Date',
                value: new Date(invoice.dueDate).toLocaleDateString(),
                emphasis: true,
              },
              {
                label: 'Days Until Due',
                value: invoice.daysUntilDue,
              },
              {
                label: 'Expected Return',
                value: `$${invoice.return.toLocaleString()}`,
                emphasis: true,
              },
            ]}
          />

          {/* Payer Information */}
          <PayerInformation invoice={invoice} />

          {/* Documents Section */}
          <DocumentsSection />
        </div>

        {/* Sidebar - Right Column */}
        <div className="lg:col-span-1 space-y-6">
          {/* NFT Ownership */}
          <NFTOwnership
            tokenId={invoice.id.toString()}
            contractAddress="0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
            blockchainTxHash={`0x${invoice.id.toString().padStart(64, '0')}`}
            companyName={invoice.companyName}
            companyLogoUrl={invoice.companyLogoUrl}
          />

          {/* Risk Assessment */}
          <RiskAssessment invoice={invoice} />

          {/* Fund Button - Primary Action */}
          <Card className="p-6 space-y-4 bg-primary/5 border-primary/20">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Ready to fund this invoice?
              </p>
              <Button
                className="w-full"
                onClick={() => setIsModalOpen(true)}
                disabled={!address}
              >
                Fund Invoice
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                {!address ? 'Connect your wallet to invest' : 'Review details and confirm'}
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
                  <span className="text-sm text-muted-foreground">APR</span>
                  <span className="text-sm font-semibold">{invoice.apr}%</span>
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
                  <CheckCircle2 className="h-12 w-12 " />
                </div>

                {/* Success Message */}
                <div className="text-center space-y-2">
                  <DialogTitle className="text-xl">
                    Investment Successful!
                  </DialogTitle>
                  <DialogDescription className="text-sm">
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
