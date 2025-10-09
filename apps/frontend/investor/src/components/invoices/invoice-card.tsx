'use client';

import { Card, cn } from '@ui';
import { RiskBadge } from './risk-badge';
import { FundingProgress } from './funding-progress';

export interface InvoiceData {
  id: number | string;
  amount: number;
  funded: number;
  payer: string;
  daysUntilDue: number;
  apy: number;
  riskScore: 'Low' | 'Medium' | 'High';
  status?: 'active' | 'funded' | 'repaid';
}

interface InvoiceCardProps {
  invoice: InvoiceData;
  onFund?: (invoiceId: number | string) => void;
  variant?: 'default' | 'compact';
  className?: string;
}

export function InvoiceCard({
  invoice,
  onFund,
  variant = 'default',
  className,
}: InvoiceCardProps) {
  const fundedPercent = (invoice.funded / invoice.amount) * 100;
  const isFullyFunded = fundedPercent >= 100;
  const dueDate = new Date(
    Date.now() + invoice.daysUntilDue * 24 * 60 * 60 * 1000
  );

  return (
    <Card
      className={cn(
        'p-6 hover:shadow-md transition-shadow',
        variant === 'compact' && 'p-4',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-lg font-semibold">
              ${invoice.amount.toLocaleString()} Invoice
            </h3>
            <RiskBadge risk={invoice.riskScore} />
          </div>
          <p className="text-sm text-muted-foreground">
            Payer: <span className="font-medium text-foreground">{invoice.payer}</span>
          </p>
        </div>

        {/* APY Badge */}
        <div className="text-right">
          <div className="text-2xl font-bold text-success">
            {invoice.apy}%
          </div>
          <p className="text-xs text-muted-foreground">APY</p>
        </div>
      </div>

      {/* Funding Progress */}
      <FundingProgress
        funded={invoice.funded}
        total={invoice.amount}
        className="mb-4"
      />

      {/* Footer */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          <span className="font-medium">{invoice.daysUntilDue} days</span> until due
          {variant === 'default' && (
            <span className="block text-xs mt-0.5">
              Due: {dueDate.toLocaleDateString()}
            </span>
          )}
        </div>

        {onFund && (
          <button
            onClick={() => onFund(invoice.id)}
            disabled={isFullyFunded}
            className={cn(
              'px-4 py-2 rounded-lg font-semibold transition-colors text-sm',
              isFullyFunded
                ? 'bg-muted text-muted-foreground cursor-not-allowed'
                : 'bg-primary hover:bg-primary-600 text-primary-foreground'
            )}
          >
            {isFullyFunded ? 'Fully Funded' : 'Fund Invoice'}
          </button>
        )}
      </div>
    </Card>
  );
}
