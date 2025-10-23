'use client';

import {
  Card,
  Separator,
  Badge,
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@ui';
import { Hash, TrendingUp } from 'lucide-react';
import { type InvoiceData } from './invoice-card';

interface PortfolioNFTCardProps {
  invoice: InvoiceData;
  onClick?: (invoice: InvoiceData) => void;
  className?: string;
}

/**
 * PortfolioNFTCard - NFT-styled card for portfolio investments
 *
 * Hybrid design combining NFT visual elements with invoice financial details
 */
export function PortfolioNFTCard({
  invoice,
  onClick,
  className,
}: PortfolioNFTCardProps) {
  const handleClick = () => {
    if (onClick) {
      onClick(invoice);
    }
  };

  const getStatusColor = () => {
    switch (invoice.status) {
      case 'repaid':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'funded':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      default:
        return 'bg-amber-100 text-amber-700 border-amber-200';
    }
  };

  const getStatusLabel = () => {
    switch (invoice.status) {
      case 'repaid':
        return 'Repaid';
      case 'funded':
        return 'Active';
      default:
        return 'Active';
    }
  };

  const cardContent = (
    <Card
      className={`transition-all duration-200 hover:shadow-lg p-0 overflow-hidden hover:cursor-pointer ${className}`}
    >
      {/* NFT Visual Header */}
      <div className="relative h-48 bg-gradient-to-br from-primary/20 via-primary/10 to-background flex items-center justify-center border-b-2 border-primary/20">
        {/* NFT Artwork/Logo */}
        <div className="text-center space-y-2">
          <Avatar className="h-20 w-20 mx-auto bg-neutral-100/90 shadow-lg">
            <AvatarImage src={invoice.companyLogoUrl} />
            <AvatarFallback className="bg-neutral-100/90 font-bold text-2xl">
              {invoice.companyName[0].toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-bold text-lg">{invoice.companyName}</p>
            {invoice.tokenId && (
              <div className="flex items-center justify-center gap-1 mt-1">
                <Hash className="h-3 w-3 text-muted-foreground" />
                <p className="text-xs text-muted-foreground font-mono">
                  Token ID: {invoice.tokenId}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Status Badge - Top Right */}
        <div className="absolute top-3 right-3">
          <Badge className={`${getStatusColor()} text-xs px-2 py-1`}>
            {getStatusLabel()}
          </Badge>
        </div>
      </div>

      {/* Invoice Details Section */}
      <div className="p-4 space-y-4">
        {/* Investment Overview */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              Your Investment
            </span>
            <span className="text-lg font-bold">
              $
              {(
                (invoice as any).userInvestment ||
                invoice.amount * (1 - invoice.discountRate)
              ).toLocaleString()}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              {invoice.status === 'repaid'
                ? 'Actual Return'
                : 'Expected Return'}
            </span>
            <div className="text-right">
              <p className="text-lg font-bold ">
                $
                {invoice.status === 'repaid' && invoice.actualReturn
                  ? invoice.actualReturn.toLocaleString()
                  : (
                      (invoice as any).expectedReturn || invoice.return
                    ).toLocaleString()}
              </p>
              {invoice.status === 'repaid' && (invoice as any).profit && (
                <p className="text-xs text-green-600">
                  +${(invoice as any).profit.toLocaleString()} profit
                </p>
              )}
              {invoice.status !== 'repaid' && (
                <p className="text-xs ">
                  +$
                  {(
                    ((invoice as any).expectedReturn || invoice.return) -
                    ((invoice as any).userInvestment ||
                      invoice.amount * (1 - invoice.discountRate))
                  ).toLocaleString()}{' '}
                  profit
                </p>
              )}
            </div>
          </div>
        </div>

        <Separator />

        {/* Financial Details Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-neutral-100/80 p-3 rounded-md">
            <p className="text-xs text-muted-foreground mb-1">Invoice Amount</p>
            <p className="text-sm font-semibold">
              ${invoice.amount.toLocaleString()}
            </p>
          </div>
          <div className="bg-neutral-100/80 p-3 rounded-md">
            <p className="text-xs text-muted-foreground mb-1">APR</p>
            <p className="text-sm font-semibold">{invoice.apr}%</p>
          </div>
          <div className="bg-neutral-100/80 p-3 rounded-md">
            <p className="text-xs text-muted-foreground mb-1">Term</p>
            <p className="text-sm font-semibold">{invoice.daysUntilDue}d</p>
          </div>
          <div className="bg-neutral-100/80 p-3 rounded-md">
            <p className="text-xs text-muted-foreground mb-1">Risk</p>
            <Badge variant="secondary" className="text-xs">
              {invoice.riskScore}
            </Badge>
          </div>
        </div>

        <Separator />

        {/* Payer Information */}
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">Payer</p>
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8 bg-neutral-100/90 shadow-sm">
              <AvatarImage src={invoice.payerLogoUrl} />
              <AvatarFallback className="bg-neutral-100/90 font-semibold text-xs">
                {invoice.payerName[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <p className="text-sm font-semibold">{invoice.payerName}</p>
              <p className="text-xs text-muted-foreground">
                {invoice.status === 'repaid'
                  ? 'Paid'
                  : `Due: ${new Date(invoice.dueDate).toLocaleDateString()}`}
              </p>
            </div>
          </div>
        </div>

        {/* Category Badge */}
        <div className="flex items-center justify-between">
          <Badge variant="outline" className="text-xs">
            {invoice.category}
          </Badge>
          {invoice.status !== 'repaid' && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3" />
              <span>{invoice.daysUntilDue}d remaining</span>
            </div>
          )}
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
        aria-label={`View investment details for ${invoice.companyName} invoice NFT`}
      >
        {cardContent}
      </button>
    );
  }

  return cardContent;
}
