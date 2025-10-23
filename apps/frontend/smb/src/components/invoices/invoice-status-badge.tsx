'use client';

import { Badge, cn } from '@ui';
import { InvoiceStatus } from '@/types/invoice';

interface InvoiceStatusBadgeProps {
  status: InvoiceStatus;
  className?: string;
  size?: 'default' | 'sm';
}

export function InvoiceStatusBadge({
  status,
  className,
  size = 'default',
}: InvoiceStatusBadgeProps) {
  const { displayName, colorClasses } = getStatusConfig(status);

  return (
    <Badge
      className={cn(
        colorClasses,
        size === 'sm' && 'text-xs px-2 py-0.5',
        className
      )}
    >
      {displayName}
    </Badge>
  );
}

function getStatusConfig(status: InvoiceStatus): {
  displayName: string;
  colorClasses: string;
} {
  switch (status) {
    case InvoiceStatus.LISTED:
      return {
        displayName: 'Listed',
        colorClasses:
          'bg-amber-100 text-gray-700 dark:bg-amber-900/30 dark:text-gray-300 border-transparent',
      };
    case InvoiceStatus.FULLY_FUNDED:
      return {
        displayName: 'Funded',
        colorClasses:
          'bg-purple-100 text-gray-700 dark:bg-purple-900/30 dark:text-gray-300 border-transparent',
      };
    case InvoiceStatus.FULLY_PAID:
      return {
        displayName: 'Paid',
        colorClasses:
          'bg-green-100 text-gray-700 dark:bg-green-900/30 dark:text-gray-300 border-transparent',
      };
    case InvoiceStatus.DEFAULTED:
      return {
        displayName: 'Defaulted',
        colorClasses:
          'bg-red-100 text-gray-700 dark:bg-red-900/30 dark:text-gray-300 border-transparent',
      };
    case InvoiceStatus.SETTLED:
      return {
        displayName: 'Settled',
        colorClasses:
          'bg-gray-100 text-gray-700 dark:bg-gray-800/30 dark:text-gray-400 border-transparent',
      };
    default:
      return {
        displayName: status,
        colorClasses:
          'bg-gray-100 text-gray-700 dark:bg-gray-800/30 dark:text-gray-400 border-transparent',
      };
  }
}
