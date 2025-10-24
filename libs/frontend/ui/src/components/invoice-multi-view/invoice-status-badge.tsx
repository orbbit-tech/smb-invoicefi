'use client';

import { Badge } from '../shadcn';
import { cn } from '../../lib/utils';
import { InvoiceStatus } from '../../types';

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
    case InvoiceStatus.CREATED:
      return {
        displayName: 'Draft',
        colorClasses:
          'bg-gray-100 text-gray-700 dark:bg-gray-800/30 dark:text-gray-400 border-transparent',
      };
    case InvoiceStatus.SUBMITTED:
      return {
        displayName: 'Submitted',
        colorClasses:
          'bg-blue-100 text-gray-700 dark:bg-blue-900/30 dark:text-gray-300 border-transparent',
      };
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
    case InvoiceStatus.OVERDUE:
      return {
        displayName: 'Overdue',
        colorClasses:
          'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-900 hover:bg-red-200 hover:text-red-800 dark:hover:bg-red-900/40 dark:hover:text-red-300',
      };
    case InvoiceStatus.DISBURSED:
      return {
        displayName: 'Disbursed',
        colorClasses:
          'bg-indigo-100 text-gray-700 dark:bg-indigo-900/30 dark:text-gray-300 border-transparent',
      };
    case InvoiceStatus.PENDING_REPAYMENT:
      return {
        displayName: 'Pending Repayment',
        colorClasses:
          'bg-yellow-100 text-gray-700 dark:bg-yellow-900/30 dark:text-gray-300 border-transparent',
      };
    case InvoiceStatus.FULLY_PAID:
      return {
        displayName: 'Paid',
        colorClasses:
          'bg-green-100 text-gray-700 dark:bg-green-900/30 dark:text-gray-300 border-transparent',
      };
    case InvoiceStatus.REPAID:
      return {
        displayName: 'Repaid',
        colorClasses:
          'bg-emerald-100 text-gray-700 dark:bg-emerald-900/30 dark:text-gray-300 border-transparent',
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
