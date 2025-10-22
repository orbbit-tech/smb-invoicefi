'use client';

import { Card, Separator, Badge } from '@ui';
import { TrendingUp, TrendingDown, DollarSign, Percent } from 'lucide-react';

interface PerformanceMetricsProps {
  userInvestment: number;
  expectedReturn: number;
  actualReturn?: number;
  apy: number;
  fundingDate: string;
  settlementDate?: string;
  status: 'active' | 'funded' | 'repaid';
}

/**
 * Performance Metrics Component
 *
 * Displays investment performance analysis
 */
export function PerformanceMetrics({
  userInvestment,
  expectedReturn,
  actualReturn,
  apy,
  fundingDate,
  settlementDate,
  status,
}: PerformanceMetricsProps) {
  const expectedProfit = expectedReturn - userInvestment;
  const actualProfit = actualReturn ? actualReturn - userInvestment : 0;
  const realizedGain = status === 'repaid' ? actualProfit : 0;
  const unrealizedGain = status !== 'repaid' ? expectedProfit : 0;

  // Calculate effective APY if completed
  const holdingPeriodDays = settlementDate
    ? Math.floor(
        (new Date(settlementDate).getTime() - new Date(fundingDate).getTime()) /
          (1000 * 60 * 60 * 24)
      )
    : 0;
  const effectiveAPY =
    status === 'repaid' && actualReturn && holdingPeriodDays > 0
      ? ((actualProfit / userInvestment) * 365) / holdingPeriodDays
      : apy;

  const getPerformanceComparison = () => {
    if (status !== 'repaid' || !actualReturn) return null;

    const difference = actualProfit - expectedProfit;
    const percentDiff = (difference / expectedProfit) * 100;
    const isPositive = difference >= 0;

    return {
      difference,
      percentDiff,
      isPositive,
    };
  };

  const performance = getPerformanceComparison();

  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-center gap-2">
        <TrendingUp className="h-5 w-5 " />
        <h2 className="text-lg font-semibold">Performance Metrics</h2>
      </div>
      <Separator />

      {/* Main Metrics Grid */}
      <div className="grid grid-cols-2 gap-4">
        {/* Investment Amount */}
        <div className="bg-neutral-100/80 p-4 rounded-md">
          <div className="flex items-center gap-1 mb-1">
            <DollarSign className="h-3 w-3 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">Investment</p>
          </div>
          <p className="text-xl font-bold">
            ${userInvestment.toLocaleString()}
          </p>
        </div>

        {/* Current/Expected Value */}
        <div className="bg-neutral-100/80 p-4 rounded-md">
          <p className="text-xs text-muted-foreground mb-1">
            {status === 'repaid' ? 'Actual Return' : 'Expected Return'}
          </p>
          <p className="text-xl font-bold ">
            $
            {status === 'repaid' && actualReturn
              ? actualReturn.toLocaleString()
              : expectedReturn.toLocaleString()}
          </p>
        </div>

        {/* Realized Gains */}
        {realizedGain > 0 && (
          <div className="bg-green-50 border border-green-200 p-4 rounded-md">
            <div className="flex items-center gap-1 mb-1">
              <TrendingUp className="h-3 w-3 text-green-700" />
              <p className="text-xs text-green-700 font-medium">
                Realized Gain
              </p>
            </div>
            <p className="text-xl font-bold text-green-700">
              +${realizedGain.toLocaleString()}
            </p>
          </div>
        )}

        {/* Unrealized Gains */}
        {unrealizedGain > 0 && (
          <div className="border p-4 rounded-md">
            <div className="flex items-center gap-1 mb-1">
              <TrendingUp className="h-3 w-3" />
              <p className="text-xs font-medium">Expected Gain</p>
            </div>
            <p className="text-xl font-bold">
              +${unrealizedGain.toLocaleString()}
            </p>
          </div>
        )}

        {/* APY */}
        <div className="bg-neutral-100/80 p-4 rounded-md">
          <div className="flex items-center gap-1 mb-1">
            <Percent className="h-3 w-3 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">
              {status === 'repaid' ? 'Effective APY' : 'Target APY'}
            </p>
          </div>
          <p className="text-xl font-bold">
            {(effectiveAPY * 100).toFixed(1)}%
          </p>
        </div>

        {/* Holding Period */}
        {holdingPeriodDays > 0 && (
          <div className="bg-neutral-100/80 p-4 rounded-md">
            <p className="text-xs text-muted-foreground mb-1">Holding Period</p>
            <p className="text-xl font-bold">{holdingPeriodDays}d</p>
          </div>
        )}
      </div>

      {/* Performance Comparison */}
      {performance && (
        <>
          <Separator />
          <div
            className={`p-4 rounded-md border ${
              performance.isPositive
                ? 'bg-green-50 border-green-200'
                : 'bg-amber-50 border-amber-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  {performance.isPositive ? (
                    <TrendingUp className="h-4 w-4 text-green-700" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-amber-700" />
                  )}
                  <p
                    className={`text-sm font-semibold ${
                      performance.isPositive
                        ? 'text-green-700'
                        : 'text-amber-700'
                    }`}
                  >
                    {performance.isPositive
                      ? 'Outperformed Expectations'
                      : 'Below Expectations'}
                  </p>
                </div>
                <p
                  className={`text-xs ${
                    performance.isPositive ? 'text-green-600' : 'text-amber-600'
                  }`}
                >
                  Actual vs Expected Return
                </p>
              </div>
              <div className="text-right">
                <p
                  className={`text-lg font-bold ${
                    performance.isPositive ? 'text-green-700' : 'text-amber-700'
                  }`}
                >
                  {performance.isPositive ? '+' : ''}$
                  {Math.abs(performance.difference).toLocaleString()}
                </p>
                <p
                  className={`text-xs ${
                    performance.isPositive ? 'text-green-600' : 'text-amber-600'
                  }`}
                >
                  {performance.isPositive ? '+' : ''}
                  {performance.percentDiff.toFixed(1)}%
                </p>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Status Badge */}
      <div className="flex justify-center">
        <Badge
          variant={status === 'repaid' ? 'default' : 'secondary'}
          className="text-xs"
        >
          {status === 'repaid'
            ? 'Investment Completed'
            : status === 'funded'
            ? 'Investment Active'
            : 'Investment Active'}
        </Badge>
      </div>
    </Card>
  );
}
