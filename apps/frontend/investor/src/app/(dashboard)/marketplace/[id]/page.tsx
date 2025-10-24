'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useMemo, useEffect } from 'react';
import { useAccount, useChainId } from 'wagmi';
import { parseUnits, formatUnits } from 'viem';
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
import { ArrowLeft, Loader2, Check, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { type InvoiceData } from '@/components/invoices';
import { useMarketplaceInvoice } from '@/hooks/api';
import { useInvoiceData, useApproveUSDC, useFundInvoice } from '@/hooks/blockchain';
import { mapMarketplaceDetail } from '@/lib/mappers/invoice-mapper';
import { NFTOwnership } from '@/components/portfolio';
import { getContractConfig } from '@/config/contracts';
import {
  InvoiceDetailHeaderSkeleton,
  CardSectionSkeleton,
} from '@/components/skeletons';

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
  const chainId = useChainId();
  const invoiceId = params.id as string;

  // Get contract configuration for current chain
  const contractConfig = getContractConfig(chainId);

  // Fetch invoice data from API
  const {
    data: apiData,
    isLoading,
    isError,
  } = useMarketplaceInvoice(invoiceId);

  // Map API data to frontend format
  const invoiceDetail = useMemo(() => {
    if (!apiData) return null;
    return mapMarketplaceDetail(apiData);
  }, [apiData]);

  // Fetch blockchain data if NFT token ID exists
  const { data: blockchainData } = useInvoiceData(
    invoiceDetail?.nftTokenId,
    contractConfig?.contracts.invoice
  );

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [transactionStep, setTransactionStep] = useState<
    'idle' | 'approving' | 'funding' | 'success'
  >('idle');

  // Calculate funding amount (USDC has 6 decimals)
  const fundingAmountInUnits = useMemo(() => {
    if (!invoiceDetail) return undefined;
    const fundingAmount = invoiceDetail.amount * (1 - invoiceDetail.discountRate);
    return parseUnits(fundingAmount.toFixed(6), 6);
  }, [invoiceDetail]);

  // USDC Approval Hook
  const {
    approve,
    isApproving,
    isApproveConfirming,
    isApproveSuccess,
    approveError,
    approveHash,
  } = useApproveUSDC({
    usdcAddress: contractConfig?.contracts.usdc,
    spender: contractConfig?.contracts.fundingPool,
    amount: fundingAmountInUnits,
  });

  // Fund Invoice Hook
  const {
    fundInvoice,
    isFunding,
    isFundingConfirming,
    isFundingSuccess,
    fundingError,
    fundingHash,
  } = useFundInvoice({
    fundingPoolAddress: contractConfig?.contracts.fundingPool,
    tokenId: invoiceDetail?.nftTokenId?.toString(),
  });

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

  // Calculate funding values (must be before early returns to maintain hook order)
  // Since we only support full funding (no partial), the funding amount is the full discounted amount
  const fundingAmountRequired = invoice?.amount ? invoice.amount * (1 - invoice.discountRate) : 0;
  const expectedReceiveBack = fundingAmountRequired && invoice?.discountRate ? fundingAmountRequired / (1 - invoice.discountRate) : 0;
  const expectedProfit = expectedReceiveBack - fundingAmountRequired;

  // Effect: Handle approval success -> trigger funding
  useEffect(() => {
    if (isApproveSuccess && transactionStep === 'approving') {
      toast.success('USDC approved successfully', {
        description: 'Now funding the invoice...',
      });
      setTransactionStep('funding');
      fundInvoice();
    }
  }, [isApproveSuccess, transactionStep, fundInvoice]);

  // Effect: Handle approval errors
  useEffect(() => {
    if (approveError) {
      toast.error('Approval failed', {
        description: approveError.message || 'Please try again',
      });
      setTransactionStep('idle');
    }
  }, [approveError]);

  // Effect: Handle funding success
  useEffect(() => {
    if (isFundingSuccess && transactionStep === 'funding') {
      setTransactionStep('success');
      setShowSuccess(true);
      toast.success('Invoice funded successfully!', {
        description: 'Your investment has been recorded on-chain',
      });
    }
  }, [isFundingSuccess, transactionStep]);

  // Effect: Handle funding errors
  useEffect(() => {
    if (fundingError) {
      toast.error('Funding failed', {
        description: fundingError.message || 'Please try again',
      });
      setTransactionStep('idle');
    }
  }, [fundingError]);

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => router.back()} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Marketplace
        </Button>

        {/* Header Skeleton */}
        <InvoiceDetailHeaderSkeleton />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <CardSectionSkeleton rows={6} />
            <CardSectionSkeleton rows={4} />
            <CardSectionSkeleton rows={3} />
          </div>

          {/* Right Column - Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            <CardSectionSkeleton rows={3} />
            <CardSectionSkeleton rows={4} />
            <CardSectionSkeleton rows={2} />
          </div>
        </div>
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

  // Handler for funding submission - starts approval process
  const handleFundInvoice = () => {
    if (!contractConfig) {
      toast.error('Network not supported', {
        description: 'Please switch to Base or Base Sepolia',
      });
      return;
    }

    if (!fundingAmountInUnits) {
      toast.error('Invalid funding amount');
      return;
    }

    setTransactionStep('approving');
    approve();
  };

  // Handler to close modal and reset states
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setShowSuccess(false);
    setTransactionStep('idle');
  };

  // Combined loading state
  const isProcessing =
    isApproving ||
    isApproveConfirming ||
    isFunding ||
    isFundingConfirming ||
    transactionStep !== 'idle';

  // Get current transaction hash for display
  const currentTxHash = fundingHash || approveHash;

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
              <p className="text-sm text-muted-foreground text-center">
                {!address
                  ? 'Connect your wallet to invest'
                  : 'Review details and confirm'}
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
              </DialogHeader>

              <div className="space-y-4 py-4">
                {/* Section 1: Investment Overview */}
                <div className="bg-neutral-100/80 p-3 space-y-1 rounded-md">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Funding Amount
                    </span>
                    <span className="text-sm truncate">
                      ${fundingAmountRequired.toLocaleString()}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">APR</span>
                    <span className="text-sm truncate">{invoice.apr}%</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Term Days
                    </span>
                    <span className="text-sm truncate">
                      {invoice.daysUntilDue}
                    </span>
                  </div>

                  <Separator className="my-1" />
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Expected Return
                    </span>
                    <span className="font-bold text-sm truncate text-primary">
                      ${expectedProfit.toLocaleString()}
                    </span>
                  </div>
                </div>

                <DialogFooter>
                  {/* Confirm Button */}
                  <Button onClick={handleFundInvoice} disabled={isProcessing}>
                    {isProcessing && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    {transactionStep === 'approving' && 'Approving USDC...'}
                    {transactionStep === 'funding' && 'Funding Invoice...'}
                    {transactionStep === 'idle' && 'Confirm'}
                  </Button>
                </DialogFooter>
              </div>
            </>
          ) : (
            <>
              {/* Success Screen */}
              <div className="space-y-6 py-6 items-center justify-center text-center">
                {/* Success Icon */}
                <div className="flex justify-center rounded-full bg-primary/10 w-10 h-10 items-center mx-auto">
                  <Check className="h-5 w-5 text-primary" />
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
                <div className="bg-neutral-100/80 p-6 rounded-lg space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">
                      Company
                    </span>
                    <span className="text-sm">{invoice.companyName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">
                      Investment Amount
                    </span>
                    <span className="text-sm">
                      ${fundingAmountRequired.toLocaleString()}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">
                      Expected Return
                    </span>
                    <span className="font-bold text-sm text-primary">
                      $
                      {expectedProfit.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">
                      Due Date
                    </span>
                    <span className="text-sm">
                      {new Date(invoice.dueDate).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Term</span>
                    <span className="text-sm">{invoice.daysUntilDue} days</span>
                  </div>
                </div>

                {/* Transaction Hash */}
                {currentTxHash && (
                  <div className="bg-primary/5 border border-primary/20 p-4 rounded-lg">
                    <div className="flex items-center justify-between gap-2">
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">
                          Transaction Hash
                        </p>
                        <p className="text-sm font-mono">
                          {currentTxHash.slice(0, 6)}...
                          {currentTxHash.slice(-4)}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="gap-1"
                        onClick={() => {
                          const explorerUrl =
                            chainId === 84532
                              ? `https://sepolia.basescan.org/tx/${currentTxHash}`
                              : chainId === 8453
                              ? `https://basescan.org/tx/${currentTxHash}`
                              : `http://localhost:8545`; // Hardhat doesn't have explorer
                          window.open(explorerUrl, '_blank');
                        }}
                      >
                        <ExternalLink className="h-3 w-3" />
                        View
                      </Button>
                    </div>
                  </div>
                )}

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
