'use client';

import { useState } from 'react';
import {
  Card,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Avatar,
  AvatarImage,
  AvatarFallback,
} from '@ui';
import { TrendingUp, Wallet, Clock, CheckCircle } from 'lucide-react';

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
      daysUntilDue: 30,
      apy: 10.5,
      riskScore: 'Low' as const,
      status: 'funded' as const,
      discountRate: 0.05,
      userInvestment: 4750, // Full funding amount (5000 * 0.95)
      expectedReturn: 5000, // invoice.amount / (1 - discountRate)
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
      daysUntilDue: 60,
      apy: 15.2,
      riskScore: 'Medium' as const,
      status: 'active' as const,
      discountRate: 0.07,
      userInvestment: 6050, // Partial funding (22000 * 0.93 * 0.275 ≈ 6050)
      expectedReturn: 6505, // userInvestment / (1 - 0.07)
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
      daysUntilDue: 0,
      apy: 10.5,
      riskScore: 'Low' as const,
      status: 'repaid' as const,
      discountRate: 0.05,
      userInvestment: 7600, // Full funding amount (8000 * 0.95)
      actualReturn: 8000,
      profit: 400,
    },
  ],
};

export default function PortfolioPage() {
  const [activeTab, setActiveTab] = useState('active');

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
        <TabsContent value="active" className="space-y-4 mt-6">
          {MOCK_PORTFOLIO.investments.map((investment) => (
            <Card
              key={investment.id}
              className="p-6 transition-all duration-200 hover:shadow-md"
            >
              <div className="flex items-start gap-4 mb-6">
                {/* Company Logo */}
                <Avatar className="h-14 w-14 bg-neutral-200/80 shadow-sm flex-shrink-0">
                  <AvatarImage src={investment.companyLogoUrl} />
                  <AvatarFallback className="bg-neutral-200/80 font-semibold">
                    {investment.companyName[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                {/* Invoice Details */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-foreground mb-1">
                    {investment.companyName}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Invoice to {investment.payer} • $
                    {investment.amount.toLocaleString()}
                  </p>
                  <div className="flex items-center gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">
                        Your Investment:
                      </span>{' '}
                      <span className="font-semibold">
                        ${investment.userInvestment.toLocaleString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Due in:</span>{' '}
                      <span className="font-semibold">
                        {investment.daysUntilDue} days
                      </span>
                    </div>
                  </div>
                </div>

                {/* Returns */}
                <div className="flex-shrink-0 text-right">
                  <p className="text-xs font-medium text-muted-foreground mb-1">
                    Expected Return
                  </p>
                  <p className="text-2xl font-bold leading-tight">
                    ${investment.expectedReturn.toLocaleString()}
                  </p>
                  <p className="text-xs text-primary mt-1">
                    +$
                    {(
                      investment.expectedReturn - investment.userInvestment
                    ).toLocaleString()}{' '}
                    profit
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </TabsContent>

        {/* Completed Investments */}
        <TabsContent value="completed" className="space-y-4 mt-6">
          {MOCK_PORTFOLIO.completedInvestments.map((investment) => (
            <Card
              key={investment.id}
              className="p-6 transition-all duration-200 hover:shadow-md"
            >
              <div className="flex items-start gap-4 mb-4">
                {/* Company Logo */}
                <Avatar className="h-14 w-14 bg-neutral-200/80 shadow-sm flex-shrink-0">
                  <AvatarImage src={investment.companyLogoUrl} />
                  <AvatarFallback className="bg-neutral-200/80 font-semibold">
                    {investment.companyName[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                {/* Invoice Details */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-foreground mb-1">
                    {investment.companyName}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Invoice to {investment.payer} • $
                    {investment.amount.toLocaleString()}
                  </p>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Repaid</span>
                    <span className="text-muted-foreground">•</span>
                    <span className="text-muted-foreground">
                      Investment: ${investment.userInvestment.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Returns */}
                <div className="flex-shrink-0 text-right">
                  <p className="text-xs font-medium text-muted-foreground mb-1">
                    Actual Return
                  </p>
                  <p className="text-2xl font-bold leading-tight">
                    ${investment.actualReturn.toLocaleString()}
                  </p>
                  <p className="text-xs text-primary mt-1">
                    +${investment.profit.toLocaleString()} profit
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
