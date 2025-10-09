'use client';

import { Badge } from '@ui';
import { InvoiceStatus } from '@/types/invoice';

interface InvoiceStatusBadgeProps {
  status: InvoiceStatus;
  className?: string;
}

const statusConfig: Record<
  InvoiceStatus,
  {
    label: string;
    variant: 'default' | 'secondary' | 'destructive' | 'outline';
  }
> = {
  [InvoiceStatus.CREATED]: {
    label: 'Created',
    variant: 'outline',
  },
  [InvoiceStatus.LISTED]: {
    label: 'Listed',
    variant: 'secondary',
  },
  [InvoiceStatus.PARTIALLY_FUNDED]: {
    label: 'Partially Funded',
    variant: 'default',
  },
  [InvoiceStatus.FULLY_FUNDED]: {
    label: 'Fully Funded',
    variant: 'default',
  },
  [InvoiceStatus.DISBURSED]: {
    label: 'Disbursed',
    variant: 'default',
  },
  [InvoiceStatus.PENDING_REPAYMENT]: {
    label: 'Pending Repayment',
    variant: 'secondary',
  },
  [InvoiceStatus.REPAID]: {
    label: 'Repaid',
    variant: 'default',
  },
  [InvoiceStatus.OVERDUE]: {
    label: 'Overdue',
    variant: 'destructive',
  },
  [InvoiceStatus.UNDER_COLLECTION]: {
    label: 'Under Collection',
    variant: 'destructive',
  },
  [InvoiceStatus.DEFAULTED]: {
    label: 'Defaulted',
    variant: 'destructive',
  },
};

export function InvoiceStatusBadge({
  status,
  className,
}: InvoiceStatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <Badge variant={config.variant} className={className}>
      {config.label}
    </Badge>
  );
}
