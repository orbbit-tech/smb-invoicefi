'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Card,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from '@ui';
import { TrendingUp, Wallet, Clock, CheckCircle } from 'lucide-react';
import { PortfolioNFTCard, type InvoiceData } from '@/components/invoices';

/**
 * Portfolio Page
 *
 * Clean Dashboard Design principles:
 * - Consistent 24px (p-6) card padding
 * - Clear visual hierarchy
 * - Professional data presentation
 */

// Mock portfolio data - in production this would come from smart contracts
// Using discount rate model: payout = investment / (1 - discountRate)
const MOCK_PORTFOLIO = {
  totalInvested: 25350,
  activeInvestments: 3,
  totalEarned: 2295, // Realized (1140) + Unrealized (1155)
  averageAPY: 12.4,
  investments: [
    {
      id: 1,
      amount: 5000,
      funded: 5000,
      companyName: 'Gallivant Ice Cream',
      companyLogoUrl: '/gallivant-ice-cream-logo.png',
      category: 'CPG',
      payer: 'Walmart',
      payerLogoUrl: '/Walmart-logo.png',
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      daysUntilDue: 30,
      apy: 10.5,
      return: 250,
      riskScore: 'Low' as const,
      status: 'funded' as const,
      discountRate: 0.05,
      userInvestment: 4750, // Full funding amount (5000 * 0.95)
      expectedReturn: 5000, // invoice.amount / (1 - discountRate)
      // NFT fields
      tokenId: '1',
      contractAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
      blockchainTxHash:
        '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
      fundingDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
      paymentsMade: [],
    },
    {
      id: 4,
      amount: 22000,
      funded: 22000,
      companyName: 'Urban Apparel Supply',
      companyLogoUrl: '/urban-apparel-logo.png',
      category: 'Retail',
      payer: 'Target',
      payerLogoUrl: '/target-logo.png',
      dueDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
      daysUntilDue: 60,
      apy: 15.2,
      return: 455,
      riskScore: 'Medium' as const,
      status: 'active' as const,
      discountRate: 0.07,
      userInvestment: 6050, // Partial funding (22000 * 0.93 * 0.275 ≈ 6050)
      expectedReturn: 6505, // userInvestment / (1 - 0.07)
      // NFT fields
      tokenId: '4',
      contractAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
      blockchainTxHash:
        '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
      fundingDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      paymentsMade: [],
    },
  ],
  completedInvestments: [
    {
      id: 2,
      amount: 8000,
      funded: 8000,
      companyName: 'FreshMart Distributors',
      companyLogoUrl: '/fast-distributor-logo.png',
      category: 'Shipping',
      payer: 'Amazon',
      payerLogoUrl: '/amazon-logo.png',
      dueDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      daysUntilDue: 0,
      apy: 10.5,
      return: 400,
      riskScore: 'Low' as const,
      status: 'repaid' as const,
      discountRate: 0.05,
      userInvestment: 7600, // Full funding amount (8000 * 0.95)
      actualReturn: 8000,
      profit: 400,
      // NFT fields
      tokenId: '2',
      contractAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
      blockchainTxHash:
        '0xfedcba0987654321fedcba0987654321fedcba0987654321fedcba0987654321',
      fundingDate: new Date(Date.now() - 50 * 24 * 60 * 60 * 1000).toISOString(),
      settlementDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      paymentsMade: [
        {
          date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          amount: 8000,
        },
      ],
    },
  ],
};

export default function PortfolioPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('active');

  const handleInvestmentClick = (investment: InvoiceData) => {
    router.push(`/portfolio/${investment.id}`);
  };

  const unrealizedGains = MOCK_PORTFOLIO.investments.reduce(
    (sum, inv) => sum + (inv.expectedReturn - inv.userInvestment),
    0
  );

  const realizedGains = MOCK_PORTFOLIO.completedInvestments.reduce(
    (sum, inv) => sum + inv.profit,
    0
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground mb-3 leading-tight">
          My Portfolio
        </h1>
        <p className="text-lg text-muted-foreground leading-relaxed">
          Track your investments and returns
        </p>
      </div>

      {/* Portfolio Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Invested */}
        <Card className="p-6 transition-all duration-200 hover:shadow-md">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-muted-foreground mb-2">
                Total Invested
              </p>
              <p className="text-2xl font-bold text-foreground leading-tight">
                ${MOCK_PORTFOLIO.totalInvested.toLocaleString()}
              </p>
            </div>
            <div className="flex-shrink-0 p-3 rounded-lg">
              <Wallet className="h-5 w-5" />
            </div>
          </div>
        </Card>

        {/* Active Investments */}
        <Card className="p-6 transition-all duration-200 hover:shadow-md">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-muted-foreground mb-2">
                Active Investments
              </p>
              <p className="text-2xl font-bold text-foreground leading-tight">
                {MOCK_PORTFOLIO.activeInvestments}
              </p>
            </div>
            <div className="flex-shrink-0 p-3 rounded-lg">
              <Clock className="h-5 w-5" />
            </div>
          </div>
        </Card>

        {/* Total Earned */}
        <Card className="p-6 transition-all duration-200 hover:shadow-md">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-muted-foreground mb-2">
                Total Earned
              </p>
              <p className="text-2xl font-bold leading-tight">
                ${(realizedGains + unrealizedGains).toFixed(2)}
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                ${realizedGains.toFixed(2)} realized
              </p>
            </div>
            <div className="flex-shrink-0 p-3 rounded-lg">
              <TrendingUp className="h-5 w-5 " />
            </div>
          </div>
        </Card>

        {/* Average APY */}
        <Card className="p-6 transition-all duration-200 hover:shadow-md">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-muted-foreground mb-2">
                Average APY
              </p>
              <p className="text-2xl font-bold text-foreground leading-tight">
                {MOCK_PORTFOLIO.averageAPY}%
              </p>
            </div>
            <div className="flex-shrink-0 p-3 rounded-lg">
              <CheckCircle className="h-5 w-5 " />
            </div>
          </div>
        </Card>
      </div>

      {/* Investment Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="active">
            Active ({MOCK_PORTFOLIO.investments.length})
          </TabsTrigger>
          <TabsTrigger value="completed">
            Completed ({MOCK_PORTFOLIO.completedInvestments.length})
          </TabsTrigger>
        </TabsList>

        {/* Active Investments */}
        <TabsContent value="active" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {MOCK_PORTFOLIO.investments.map((investment) => (
              <PortfolioNFTCard
                key={investment.id}
                invoice={{
                  ...investment,
                  payerName: investment.payer,
                  userInvestment: investment.userInvestment,
                  expectedReturn: investment.expectedReturn,
                }}
                onClick={handleInvestmentClick}
              />
            ))}
          </div>
        </TabsContent>

        {/* Completed Investments */}
        <TabsContent value="completed" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {MOCK_PORTFOLIO.completedInvestments.map((investment) => (
              <PortfolioNFTCard
                key={investment.id}
                invoice={{
                  ...investment,
                  payerName: investment.payer,
                  userInvestment: investment.userInvestment,
                  expectedReturn: investment.actualReturn,
                  profit: investment.profit,
                }}
                onClick={handleInvestmentClick}
              />
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
