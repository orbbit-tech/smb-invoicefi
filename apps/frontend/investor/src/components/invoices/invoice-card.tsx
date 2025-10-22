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
  apy: number;
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

  const handleClick = () => {
    console.log('clicked');

    if (onClick) {
      onClick(invoice);
    }
  };

  const cardContent = (
    <Card className="transition-all duration-200 hover:shadow-lg hover:shadow-md p-4 space-y-4 hover:cursor-pointer">
      <div className="flex flex-col items-center justify-center gap-1">
        <div className="flex flex-col items-center justify-center gap-2">
          <Avatar className="h-12 w-12 bg-neutral-200/80 shadow-sm">
            <AvatarImage src={invoice.companyLogoUrl} />
            <AvatarFallback className="bg-neutral-200/80 font-semibold text-sm">
              {invoice.companyName[0].toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <span className="font-semibold text-sm">{invoice.companyName}</span>
        </div>
        <p className="font-semibold text-2xl truncate">
          ${invoice.amount.toLocaleString()}
        </p>
      </div>

      <div className="bg-neutral-100/80 p-4 space-y-1 rounded-md">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Funding Amount</span>
          <span className="truncate">
            ${(invoice.amount * (1 - invoice.discountRate)).toLocaleString()}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Discount Rate</span>
          <span className="truncate">{(invoice.discountRate * 100).toFixed(1)}%</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Term (days)</span>
          <span className="truncate">{invoice.daysUntilDue}</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">APY</span>
          <span className="truncate">{invoice.apy}%</span>
        </div>

        <Separator className="my-1" />
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Expected Return</span>
          <span className="font-bold truncate">
            ${(invoice.amount * invoice.discountRate).toLocaleString()}
          </span>
        </div>
      </div>

      {/* <div className="bg-neutral-100/80 p-4 rounded-md">
        <FundingProgress
          funded={invoice.funded}
          total={invoice.amount}
          showLabel={true}
        />
      </div> */}
      <div className="flex flex-col bg-neutral-100/80 p-4 space-y-1 rounded-md">
        <div className="flex justify-between items-center ">
          <span className="text-muted-foreground text-sm">To Be Paid By</span>
          <div className="flex items-center justify-center gap-1">
            {/* <Avatar className="h-6 w-6 bg-neutral-200/80 shadow-sm">
              <AvatarImage src={invoice.payerLogoUrl} />
              <AvatarFallback className="bg-neutral-200/80 font-semibold text-sm">
                {invoice.payerName[0].toUpperCase()}
              </AvatarFallback>
            </Avatar> */}
            <span className="font-semibold text-sm">{invoice.payerName}</span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Due Date</span>
          <span className="truncate text-sm">
            {new Date(invoice.dueDate).toLocaleDateString()}
          </span>
        </div>
      </div>

      {/* Bottom Section: Metrics Row */}
      <div className="grid grid-cols-2 gap-3 bg-neutral-100/80 p-4 rounded-md">
        <div className="flex flex-col items-start gap-1">
          <span className="text-xs text-muted-foreground font-medium">
            Industry
          </span>
          <Badge variant="secondary"> {invoice.category}</Badge>
        </div>

        <div className="flex flex-col items-start gap-1">
          <span className="text-xs text-muted-foreground font-medium">
            Risk Level
          </span>
          <Badge variant="secondary"> {invoice.riskScore}</Badge>
        </div>
      </div>

      {/* <div className="flex justify-end">
        <Button size="sm" className="w-full">
          Fund
        </Button>
      </div> */}
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
