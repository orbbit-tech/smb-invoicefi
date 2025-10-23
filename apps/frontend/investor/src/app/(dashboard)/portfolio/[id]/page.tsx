'use client';

import { useParams, useRouter } from 'next/navigation';
import { useMemo } from 'react';
import { useAccount } from 'wagmi';
import {
  Card,
  Badge,
  Button,
  Separator,
  InvoiceDetailHeader,
  PayerInformation,
  RiskAssessment,
  FinancialBreakdown,
  DocumentsSection,
} from '@ui';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { type InvoiceData } from '@/components/invoices';
import { usePortfolioPosition } from '@/hooks/api';
import { mapPortfolioPosition } from '@/lib/mappers/invoice-mapper';
import { NFTOwnership, InvestmentTimeline } from '@/components/portfolio';

/**
 * Portfolio Detail Page
 *
 * Displays comprehensive investment details with NFT ownership,
 * timeline, payment status, and performance metrics
 */

export default function PortfolioDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { address } = useAccount();
  const positionId = params.id as string;

  // Fetch position data from API
  const { data: positionData, isLoading, isError } = usePortfolioPosition(positionId, address || '');

  // Map to InvoiceData format
  const investment: InvoiceData | null = useMemo(() => {
    if (!positionData) return null;

    const mapped = mapPortfolioPosition(positionData);
    return {
      id: mapped.id,
      companyName: mapped.issuer.name,
      companyLogoUrl: undefined,
      dueDate: mapped.invoice.dueAt.toISOString(),
      category: mapped.payer.industry || 'General',
      amount: mapped.invoice.amount,
      funded: mapped.investment.fundedAmount,
      payerName: mapped.payer.name,
      payerLogoUrl: undefined,
      daysUntilDue: Math.max(
        0,
        Math.ceil((mapped.invoice.dueAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      ),
      return: mapped.realizedGains + mapped.unrealizedGains,
      apr: mapped.investment.expectedReturn,
      discountRate: 0, // Not directly available in position data
      riskScore: mapped.invoice.riskScore as 'Low' | 'Medium' | 'High',
      status: mapped.positionStatus === 'settled' ? 'repaid' : 'funded',
      tokenId: mapped.nft.tokenId,
      contractAddress: mapped.nft.contractAddress,
      blockchainTxHash: mapped.investment.fundingTxHash,
      fundingDate: mapped.investment.fundedAt.toISOString(),
      settlementDate: mapped.settledAt?.toISOString(),
      actualReturn: mapped.actualRepayment,
      paymentsMade: [],
      userInvestment: mapped.investment.fundedAmount,
      expectedReturn: mapped.investment.expectedRepayment,
      profit: mapped.realizedGains,
    };
  }, [positionData]);

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => router.back()} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Portfolio
        </Button>
        <Card className="p-12">
          <div className="flex flex-col items-center justify-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Loading investment details...</p>
          </div>
        </Card>
      </div>
    );
  }

  // Error or not found state
  if (isError || !investment) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => router.back()} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Portfolio
        </Button>
        <Card className="p-12">
          <div className="text-center">
            <p className="text-lg text-destructive">
              {isError ? 'Failed to load investment' : 'Investment not found'}
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Please try again or return to your portfolio
            </p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Button variant="ghost" onClick={() => router.back()} className="gap-2">
        <ArrowLeft className="h-4 w-4" />
        Back to Portfolio
      </Button>

      {/* Header Section */}
      <InvoiceDetailHeader invoice={investment} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content - Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Investment Timeline */}
          <InvestmentTimeline investment={investment} />

          {/* Financial Breakdown */}
          <FinancialBreakdown
            invoice={investment}
            lineItems={[
              {
                label: 'Investment Amount',
                value: `$${investment.userInvestment?.toLocaleString()}`,
              },
              {
                label: 'Expected Return',
                value: `$${investment.expectedReturn?.toLocaleString()}`,
                emphasis: true,
              },
              {
                label: 'Profit',
                value: `$${investment.profit?.toLocaleString()}`,
              },
              {
                label: 'Due Date',
                value: new Date(investment.dueDate).toLocaleDateString(),
                emphasis: true,
              },
            ]}
          />

          {/* Payer Information */}
          <PayerInformation invoice={investment} />
        </div>

        {/* Sidebar - Right Column */}
        <div className="lg:col-span-1 space-y-6">
          {/* NFT Ownership */}
          <NFTOwnership
            tokenId={investment.tokenId!}
            contractAddress={investment.contractAddress!}
            blockchainTxHash={investment.blockchainTxHash!}
            companyName={investment.companyName}
            companyLogoUrl={investment.companyLogoUrl}
          />

          {/* Risk Assessment */}
          <RiskAssessment invoice={investment} />
        </div>
      </div>
    </div>
  );
}
