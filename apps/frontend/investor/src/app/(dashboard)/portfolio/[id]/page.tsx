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
import { ArrowLeft, TrendingUp, ShieldCheck } from 'lucide-react';
import { type InvoiceData } from '@/components/invoices';
import {
  NFTOwnership,
  InvestmentTimeline,
  PaymentStatus,
  PerformanceMetrics,
} from '@/components/portfolio';

/**
 * Portfolio Detail Page
 *
 * Displays comprehensive investment details with NFT ownership,
 * timeline, payment status, and performance metrics
 */

// Helper to get portfolio investment by ID
// In production, this would fetch from blockchain/API
const getPortfolioInvestmentById = (id: string): InvoiceData | undefined => {
  // This is a placeholder - in production, fetch from your data source
  const MOCK_PORTFOLIO_INVESTMENTS: InvoiceData[] = [
    {
      id: 1,
      amount: 5000,
      funded: 5000,
      companyName: 'Gallivant Ice Cream',
      companyLogoUrl: '/gallivant-ice-cream-logo.png',
      category: 'CPG',
      payerName: 'Walmart',
      payerLogoUrl: '/Walmart-logo.png',
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      daysUntilDue: 30,
      apy: 10.5,
      return: 250,
      riskScore: 'Low' as const,
      status: 'funded' as const,
      discountRate: 0.05,
      tokenId: '1',
      contractAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
      blockchainTxHash:
        '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
      fundingDate: new Date(
        Date.now() - 15 * 24 * 60 * 60 * 1000
      ).toISOString(),
      paymentsMade: [],
    },
    {
      id: 4,
      amount: 22000,
      funded: 22000,
      companyName: 'Urban Apparel Supply',
      companyLogoUrl: '/urban-apparel-logo.png',
      category: 'Retail',
      payerName: 'Target',
      payerLogoUrl: '/target-logo.png',
      dueDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
      daysUntilDue: 60,
      apy: 15.2,
      return: 455,
      riskScore: 'Medium' as const,
      status: 'active' as const,
      discountRate: 0.07,
      tokenId: '4',
      contractAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
      blockchainTxHash:
        '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
      fundingDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      paymentsMade: [],
    },
    {
      id: 2,
      amount: 8000,
      funded: 8000,
      companyName: 'FreshMart Distributors',
      companyLogoUrl: '/fast-distributor-logo.png',
      category: 'Shipping',
      payerName: 'Amazon',
      payerLogoUrl: '/amazon-logo.png',
      dueDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      daysUntilDue: 0,
      apy: 10.5,
      return: 400,
      riskScore: 'Low' as const,
      status: 'repaid' as const,
      discountRate: 0.05,
      tokenId: '2',
      contractAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
      blockchainTxHash:
        '0xfedcba0987654321fedcba0987654321fedcba0987654321fedcba0987654321',
      fundingDate: new Date(
        Date.now() - 50 * 24 * 60 * 60 * 1000
      ).toISOString(),
      settlementDate: new Date(
        Date.now() - 5 * 24 * 60 * 60 * 1000
      ).toISOString(),
      actualReturn: 8000,
      paymentsMade: [
        {
          date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          amount: 8000,
        },
      ],
    },
  ];

  return MOCK_PORTFOLIO_INVESTMENTS.find(
    (inv) => inv.id.toString() === id.toString()
  );
};

export default function PortfolioDetailPage() {
  const params = useParams();
  const router = useRouter();
  const investmentId = params.id as string;
  const investment = getPortfolioInvestmentById(investmentId);

  if (!investment) {
    return (
      <div className="space-y-6">
        <Button
          variant="ghost"
          onClick={() => router.push('/')}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Portfolio
        </Button>
        <Card className="p-12">
          <div className="text-center">
            <p className="text-lg text-muted-foreground">
              Investment not found
            </p>
          </div>
        </Card>
      </div>
    );
  }

  // Calculate investment amounts
  const userInvestment = investment.amount * (1 - investment.discountRate);
  const expectedReturn = investment.amount;

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Back Button */}
      <Button
        variant="ghost"
        onClick={() => router.push('/')}
        className="gap-2"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Portfolio
      </Button>

      {/* Header Section */}
      <div className="space-y-1">
        <div className="flex items-center gap-3">
          <Avatar className="h-16 w-16 bg-neutral-200/80 shadow-sm">
            <AvatarImage src={investment.companyLogoUrl} />
            <AvatarFallback className="bg-neutral-200/80 font-semibold text-lg">
              {investment.companyName[0].toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-2xl font-bold text-foreground leading-tight">
              {investment.companyName}
            </h1>
            <p className="text-muted-foreground">
              Invoice NFT #{investment.tokenId} • {investment.category}
            </p>
          </div>
          <div className="ml-auto">
            <Badge
              variant={
                investment.status === 'repaid'
                  ? 'default'
                  : investment.status === 'funded'
                  ? 'secondary'
                  : 'outline'
              }
            >
              {investment.status === 'repaid'
                ? 'Completed'
                : investment.status === 'funded'
                ? 'Active'
                : 'Active'}
            </Badge>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content - Left Column (2/3 width) */}
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
                  ${investment.amount.toLocaleString()}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">APY</p>
                <p className="text-2xl font-bold">{investment.apy}%</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Term</p>
                <p className="text-2xl font-bold">{investment.daysUntilDue}d</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Your Investment</p>
                <p className="text-2xl font-bold">
                  ${userInvestment.toLocaleString()}
                </p>
              </div>
            </div>
          </Card>

          {/* Performance Metrics */}
          {investment.fundingDate && (
            <PerformanceMetrics
              userInvestment={userInvestment}
              expectedReturn={expectedReturn}
              actualReturn={investment.actualReturn}
              apy={investment.apy / 100}
              fundingDate={investment.fundingDate}
              settlementDate={investment.settlementDate}
              status={investment.status || 'active'}
            />
          )}

          {/* Investment Timeline */}
          {investment.fundingDate && (
            <InvestmentTimeline
              fundingDate={investment.fundingDate}
              dueDate={investment.dueDate}
              settlementDate={investment.settlementDate}
              status={investment.status || 'active'}
            />
          )}

          {/* Payment Status */}
          {investment.fundingDate && (
            <PaymentStatus
              totalAmount={expectedReturn}
              paymentsMade={investment.paymentsMade || []}
              status={investment.status || 'active'}
              dueDate={investment.dueDate}
            />
          )}

          {/* Payer Information */}
          <Card className="p-6 space-y-4">
            <h2 className="text-lg font-semibold">Payer Information</h2>
            <Separator />
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12 bg-neutral-200/80 shadow-sm">
                <AvatarImage src={investment.payerLogoUrl} />
                <AvatarFallback className="bg-neutral-200/80 font-semibold">
                  {investment.payerName[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold">{investment.payerName}</p>
                <p className="text-sm text-muted-foreground">
                  {investment.status === 'repaid'
                    ? `Paid on ${new Date(
                        investment.settlementDate || investment.dueDate
                      ).toLocaleDateString()}`
                    : `Payment due on ${new Date(
                        investment.dueDate
                      ).toLocaleDateString()}`}
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
        </div>

        {/* Sidebar - Right Column (1/3 width) */}
        <div className="lg:col-span-1 space-y-6">
          {/* NFT Ownership */}
          {investment.tokenId &&
            investment.contractAddress &&
            investment.blockchainTxHash && (
              <NFTOwnership
                tokenId={investment.tokenId}
                contractAddress={investment.contractAddress}
                blockchainTxHash={investment.blockchainTxHash}
                companyName={investment.companyName}
                companyLogoUrl={investment.companyLogoUrl}
              />
            )}

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
                <Badge variant="secondary">{investment.riskScore}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Industry</span>
                <Badge variant="secondary">{investment.category}</Badge>
              </div>
            </div>
            <div className="bg-neutral-100/80 p-4 rounded-md space-y-2">
              <p className="text-sm font-semibold">Key Factors:</p>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                <li>Strong payer credit history</li>
                <li>Established business relationship</li>
                <li>Verified invoice documentation</li>
              </ul>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
