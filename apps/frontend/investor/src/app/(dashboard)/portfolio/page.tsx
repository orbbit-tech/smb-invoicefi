'use client';

import { useState } from 'react';
import { Card, Tabs, TabsList, TabsTrigger, TabsContent } from '@ui';
import { TrendingUp, Wallet, Clock, CheckCircle } from 'lucide-react';

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
    <>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          My Portfolio
        </h1>
        <p className="text-muted-foreground">
          Track your investments and returns
        </p>
      </div>

      {/* Portfolio Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {/* Total Invested */}
        <Card className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">
                Total Invested
              </p>
              <p className="text-2xl font-bold text-foreground">
                ${MOCK_PORTFOLIO.totalInvested.toLocaleString()}
              </p>
            </div>
            <div className="p-2 bg-primary/10 rounded-lg">
              <Wallet className="h-5 w-5 text-primary" />
            </div>
          </div>
        </Card>

        {/* Active Investments */}
        <Card className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">
                Active Investments
              </p>
              <p className="text-2xl font-bold text-foreground">
                {MOCK_PORTFOLIO.activeInvestments}
              </p>
            </div>
            <div className="p-2 bg-warning/10 rounded-lg">
              <Clock className="h-5 w-5 text-warning" />
            </div>
          </div>
        </Card>

        {/* Total Earned */}
        <Card className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Total Earned</p>
              <p className="text-2xl font-bold text-success">
                ${(realizedGains + unrealizedGains).toFixed(2)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                ${realizedGains.toFixed(2)} realized
              </p>
            </div>
            <div className="p-2 bg-success/10 rounded-lg">
              <TrendingUp className="h-5 w-5 text-success" />
            </div>
          </div>
        </Card>

        {/* Average APY */}
        <Card className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Average APY</p>
              <p className="text-2xl font-bold text-foreground">
                {MOCK_PORTFOLIO.averageAPY}%
              </p>
            </div>
            <div className="p-2 bg-success/10 rounded-lg">
              <CheckCircle className="h-5 w-5 text-success" />
            </div>
          </div>
        </Card>
      </div>

      {/* Detailed Returns */}
      <Card className="p-6 mb-8">
        <h3 className="text-lg font-semibold mb-4">Returns Breakdown</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <p className="text-sm text-muted-foreground mb-1">
              Unrealized Gains
            </p>
            <p className="text-xl font-bold text-foreground">
              ${unrealizedGains.toFixed(2)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              From {MOCK_PORTFOLIO.activeInvestments} active positions
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">Realized Gains</p>
            <p className="text-xl font-bold text-success">
              ${realizedGains.toFixed(2)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              From {MOCK_PORTFOLIO.completedInvestments.length} completed
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">Total Return</p>
            <p className="text-xl font-bold text-foreground">
              {(
                ((unrealizedGains + realizedGains) /
                  MOCK_PORTFOLIO.totalInvested) *
                100
              ).toFixed(2)}
              %
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Lifetime portfolio return
            </p>
          </div>
        </div>
      </Card>

      {/* Investment Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="active">
            Active ({MOCK_PORTFOLIO.investments.length})
          </TabsTrigger>
          <TabsTrigger value="completed">
            Completed ({MOCK_PORTFOLIO.completedInvestments.length})
          </TabsTrigger>
        </TabsList>

        {/* Active Investments */}
        <TabsContent value="active" className="space-y-4">
          {MOCK_PORTFOLIO.investments.map((investment) => (
            <Card key={investment.id} className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold mb-1">
                    {investment.payer} - ${investment.amount.toLocaleString()}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Your investment: $
                    {investment.userInvestment.toLocaleString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground mb-1">
                    Expected Return
                  </p>
                  <p className="text-xl font-bold text-success">
                    ${investment.expectedReturn.toFixed(2)}
                  </p>
                  <p className="text-xs text-success">
                    +$
                    {(
                      investment.expectedReturn - investment.userInvestment
                    ).toFixed(2)}{' '}
                    ({investment.apy}% APY)
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {investment.daysUntilDue} days until due
                </span>
                <span
                  className={
                    investment.status === 'funded'
                      ? 'text-warning font-medium'
                      : 'text-muted-foreground'
                  }
                >
                  {investment.status === 'funded'
                    ? 'Fully Funded - Awaiting Repayment'
                    : 'Active'}
                </span>
              </div>
            </Card>
          ))}
        </TabsContent>

        {/* Completed Investments */}
        <TabsContent value="completed" className="space-y-4">
          {MOCK_PORTFOLIO.completedInvestments.map((investment) => (
            <Card key={investment.id} className="p-6 bg-success/5">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold mb-1">
                    {investment.payer} - ${investment.amount.toLocaleString()}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Your investment: $
                    {investment.userInvestment.toLocaleString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground mb-1">
                    Actual Return
                  </p>
                  <p className="text-xl font-bold text-success">
                    ${investment.actualReturn.toFixed(2)}
                  </p>
                  <p className="text-xs text-success">
                    +${investment.profit.toFixed(2)} profit
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="h-4 w-4 text-success" />
                <span className="text-success font-medium">Repaid</span>
              </div>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </>
  );
}
