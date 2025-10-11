'use client';

import { useState } from 'react';
import { Card, Tabs, TabsList, TabsTrigger, TabsContent } from '@ui';
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
const MOCK_PORTFOLIO = {
  totalInvested: 45000,
  activeInvestments: 3,
  totalEarned: 3250,
  averageAPY: 10.8,
  investments: [
    {
      id: 1,
      amount: 50000,
      funded: 35000,
      companyName: 'FreshMart Distributors',
      category: 'Distribution',
      payer: 'Microsoft',
      daysUntilDue: 60,
      apy: 10.5,
      riskScore: 'Low' as const,
      status: 'active' as const,
      userInvestment: 15000,
      expectedReturn: 15787.5, // 15000 * (1 + 0.105 * 60/365)
    },
    {
      id: 3,
      amount: 75000,
      funded: 15000,
      companyName: 'DataSync Systems',
      category: 'Software',
      payer: 'Oracle',
      daysUntilDue: 90,
      apy: 12.1,
      riskScore: 'Medium' as const,
      status: 'active' as const,
      userInvestment: 15000,
      expectedReturn: 15447.95, // 15000 * (1 + 0.121 * 90/365)
    },
    {
      id: 4,
      amount: 30000,
      funded: 30000,
      companyName: 'Creative Agency Pro',
      category: 'Marketing',
      payer: 'Adobe',
      daysUntilDue: 15,
      apy: 8.5,
      riskScore: 'Low' as const,
      status: 'funded' as const,
      userInvestment: 15000,
      expectedReturn: 15052.74, // 15000 * (1 + 0.085 * 30/365)
    },
  ],
  completedInvestments: [
    {
      id: 2,
      amount: 25000,
      funded: 25000,
      companyName: 'CloudTech Solutions',
      category: 'Technology',
      payer: 'Salesforce',
      daysUntilDue: 0,
      apy: 9.2,
      riskScore: 'Low' as const,
      status: 'repaid' as const,
      userInvestment: 10000,
      actualReturn: 10378.08, // 10000 * (1 + 0.092 * 45/365) - actual paid
      profit: 378.08,
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
              <div className="flex items-start justify-between gap-6 mb-6">
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    {investment.payer} - ${investment.amount.toLocaleString()}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Your investment: $
                    {investment.userInvestment.toLocaleString()}
                  </p>
                </div>
                <div className="flex-shrink-0 text-right">
                  <p className="text-xs font-medium text-muted-foreground mb-1">
                    Expected Return
                  </p>
                  <p className="text-2xl font-bold leading-tight">
                    ${investment.expectedReturn.toFixed(2)}
                  </p>
                  <p className="text-xs  mt-1">
                    +$
                    {(
                      investment.expectedReturn - investment.userInvestment
                    ).toFixed(2)}{' '}
                    ({investment.apy}% APY)
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="font-semibold text-foreground">
                  {investment.daysUntilDue} days
                </span>
                <span className="text-muted-foreground"> until due</span>
                <span className="font-semibold">
                  {investment.status === 'funded' ? 'Fully Funded' : 'Active'}
                </span>
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
              <div className="flex items-start justify-between gap-6 mb-6">
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    {investment.payer} - ${investment.amount.toLocaleString()}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Your investment: $
                    {investment.userInvestment.toLocaleString()}
                  </p>
                </div>
                <div className="flex-shrink-0 text-right">
                  <p className="text-xs font-medium text-muted-foreground mb-1">
                    Actual Return
                  </p>
                  <p className="text-2xl font-bold  leading-tight">
                    ${investment.actualReturn.toFixed(2)}
                  </p>
                  <p className="text-xs  mt-1">
                    +${investment.profit.toFixed(2)} profit
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="h-4 w-4 " />
                <span className=" font-semibold">Repaid</span>
              </div>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
