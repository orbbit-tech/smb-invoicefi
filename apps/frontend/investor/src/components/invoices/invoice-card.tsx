'use client';

import {
  Card,
  Separator,
  Badge,
  cn,
  Avatar,
  AvatarFallback,
  AvatarImage,
  Button,
} from '@ui';

// import { FundingProgress } from '@/components/invoices/funding-progress';

export interface InvoiceData {
  id: number | string;
  companyName: string;
  companyLogoUrl?: string;
  dueDate: string;
  category: string;
  amount: number;
  funded: number;
  payerName: string;
  payerLogoUrl?: string;
  daysUntilDue: number;
  return: number;
  apr: number;
  discountRate: number;
  riskScore: 'Low' | 'Medium' | 'High';
  status?: 'active' | 'funded' | 'repaid';
  // NFT-specific fields
  tokenId?: string;
  contractAddress?: string;
  blockchainTxHash?: string;
  fundingDate?: string;
  settlementDate?: string;
  actualReturn?: number;
  paymentsMade?: { date: string; amount: number }[];
  // Portfolio-specific fields
  userInvestment?: number;
  expectedReturn?: number;
  profit?: number;
  payer?: string; // Alternative to payerName for backwards compatibility
}

interface InvoiceCardProps {
  invoice: InvoiceData;
  onFund?: (invoiceId: number | string) => void;
  onClick?: (invoice: InvoiceData) => void;
  variant?: 'default' | 'compact';
  className?: string;
}

/**
 * InvoiceCard - Display invoice funding opportunities
 *
 * Clean Dashboard Design principles:
 * - Consistent 24px (p-6) padding
 * - Clear visual hierarchy with proper typography
 * - Subtle hover elevation
 * - Uses UI library Button component
 */
export function InvoiceCard({
  invoice,
  onFund,
  onClick,
  variant = 'default',
  className,
}: InvoiceCardProps) {
  const fundedPercent = (invoice.funded / invoice.amount) * 100;
  const isFullyFunded = fundedPercent >= 100;
  const dueDate = new Date(
    Date.now() + invoice.daysUntilDue * 24 * 60 * 60 * 1000
  );
  const fundingAmount = invoice.amount * (1 - invoice.discountRate / 100);

  const handleClick = () => {
    console.log('clicked');

    if (onClick) {
      onClick(invoice);
    }
  };

  const cardContent = (
    <Card className="transition-all duration-200 hover:shadow-lg hover:shadow-md p-5 space-y-3 hover:cursor-pointer">
      <div className="flex flex-col gap-3">
        <div className="flex items-start gap-3">
          <Avatar className="h-9 w-9 bg-neutral-100/90 shadow-sm flex-shrink-0">
            <AvatarImage src={invoice.companyLogoUrl} />
            <AvatarFallback className="bg-neutral-100/90 font-semibold text-xs">
              {invoice.companyName[0].toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col min-w-0 flex-1">
            <span className="font-semibold text-sm truncate">
              {invoice.companyName}
            </span>
            <span className="text-xs text-muted-foreground truncate">
              {invoice.category}
            </span>
          </div>
        </div>
      </div>

      <div className="bg-neutral-100/80 p-3 space-y-1 rounded-md">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Funding Amount</span>
          <span className="text-xs truncate">
            ${(invoice.amount * (1 - invoice.discountRate / 100)).toLocaleString()}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">APR</span>
          <span className="text-xs truncate">{invoice.apr}%</span>
        </div>

        <Separator className="my-1" />
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Expected Return</span>
          <span className="font-bold text-xs truncate text-emerald-700">
            ${(invoice.amount * (invoice.discountRate / 100)).toLocaleString()}
          </span>
        </div>
      </div>

      <div className="bg-neutral-100/80 p-3 space-y-1 rounded-md">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Face Value</span>
          <span className="text-xs truncate">
            ${invoice.amount.toLocaleString()}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Discount Rate</span>
          <span className="text-xs truncate">
            {invoice.discountRate.toFixed(1)}%
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Term (days)</span>
          <span className="text-xs truncate">{invoice.daysUntilDue}</span>
        </div>
      </div>

      <div className="flex flex-col bg-neutral-100/80 p-3 space-y-1 rounded-md">
        <div className="flex justify-between items-center ">
          <span className="text-muted-foreground text-xs">To Be Paid By</span>
          <div className="flex items-center justify-center gap-1">
            <span className="font-medium text-xs">{invoice.payerName}</span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Due Date</span>
          <span className="text-xs truncate">
            {new Date(invoice.dueDate).toLocaleDateString()}
          </span>
        </div>
      </div>
    </Card>
  );

  // If clickable, wrap in a button for proper semantics
  if (onClick) {
    return (
      <button
        onClick={handleClick}
        className="w-full text-left border-0 p-0 bg-transparent focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-lg"
        aria-label={`View invoice from ${invoice.companyName} to ${invoice.payerName}`}
      >
        {cardContent}
      </button>
    );
  }

  return cardContent;
}
