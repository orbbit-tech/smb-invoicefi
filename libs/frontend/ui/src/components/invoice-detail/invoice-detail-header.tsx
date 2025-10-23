'use client';

import { Avatar, AvatarFallback, AvatarImage, Badge } from '../../';
import { InvoiceDetailData } from './types';

interface InvoiceDetailHeaderProps {
  invoice: InvoiceDetailData;
  statusBadge?: React.ReactNode;
  subtitle?: string;
}

/**
 * Invoice Detail Header Component
 *
 * Displays company avatar, name, and invoice identifier
 * Reusable across SMB and Investor applications
 */
export function InvoiceDetailHeader({
  invoice,
  statusBadge,
  subtitle,
}: InvoiceDetailHeaderProps) {
  const displaySubtitle =
    subtitle ||
    `Invoice #${invoice.id}${invoice.category ? ` • ${invoice.category}` : ''}`;

  return (
    <div>
      <div className="flex items-center gap-3">
        <Avatar className="h-12 w-12 bg-neutral-200/80 shadow-sm">
          <AvatarImage src={invoice.companyLogoUrl} />
          <AvatarFallback className="bg-neutral-200/80 font-semibold">
            {invoice.companyName[0].toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-foreground tracking-tight">
            {invoice.companyName}
          </h1>
          <p className="text-sm text-muted-foreground">{displaySubtitle}</p>
        </div>
        {statusBadge && <div className="ml-auto">{statusBadge}</div>}
      </div>
    </div>
  );
}
