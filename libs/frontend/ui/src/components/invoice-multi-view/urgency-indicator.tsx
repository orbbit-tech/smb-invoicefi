'use client';

import { AlertCircle, Clock } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface UrgencyIndicatorProps {
  daysUntilDue: number;
  size?: 'sm' | 'default';
  showLabel?: boolean;
  className?: string;
}

export function UrgencyIndicator({
  daysUntilDue,
  size = 'default',
  showLabel = true,
  className,
}: UrgencyIndicatorProps) {
  const isOverdue = daysUntilDue < 0;
  const isDueSoon = daysUntilDue >= 0 && daysUntilDue <= 7;
  const isOnTrack = daysUntilDue > 7;

  // Don't show indicator if on track (optional - can be configured)
  if (isOnTrack && !showLabel) return null;

  const iconSize = size === 'sm' ? 'h-3 w-3' : 'h-4 w-4';
  const textSize = size === 'sm' ? 'text-xs' : 'text-sm';
  const paddingSize = size === 'sm' ? 'px-2 py-0.5' : 'px-2.5 py-1';

  if (isOverdue) {
    return (
      <div
        className={cn(
          'inline-flex items-center gap-1 font-medium rounded-full',
          'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
          'border border-red-200 dark:border-red-900',
          paddingSize,
          textSize,
          className
        )}
      >
        <AlertCircle className={iconSize} />
        {showLabel && (
          <span>
            Overdue {Math.abs(daysUntilDue)} day{Math.abs(daysUntilDue) !== 1 ? 's' : ''}
          </span>
        )}
      </div>
    );
  }

  if (isDueSoon) {
    return (
      <div
        className={cn(
          'inline-flex items-center gap-1 font-medium rounded-full',
          'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
          'border border-amber-200 dark:border-amber-900',
          paddingSize,
          textSize,
          className
        )}
      >
        <Clock className={iconSize} />
        {showLabel && (
          <span>
            Due in {daysUntilDue} day{daysUntilDue !== 1 ? 's' : ''}
          </span>
        )}
      </div>
    );
  }

  if (isOnTrack && showLabel) {
    return (
      <div
        className={cn(
          'inline-flex items-center gap-1 font-medium rounded-full',
          'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
          'border border-green-200 dark:border-green-900',
          paddingSize,
          textSize,
          className
        )}
      >
        <span>
          {daysUntilDue} day{daysUntilDue !== 1 ? 's' : ''}
        </span>
      </div>
    );
  }

  return null;
}

/**
 * Get urgency color for styling other components
 */
export function getUrgencyColor(daysUntilDue: number): {
  color: 'red' | 'amber' | 'green';
  className: string;
  borderClassName: string;
} {
  const isOverdue = daysUntilDue < 0;
  const isDueSoon = daysUntilDue >= 0 && daysUntilDue <= 7;

  if (isOverdue) {
    return {
      color: 'red',
      className: 'text-red-600 dark:text-red-400',
      borderClassName: 'border-red-200 dark:border-red-900',
    };
  }

  if (isDueSoon) {
    return {
      color: 'amber',
      className: 'text-amber-600 dark:text-amber-400',
      borderClassName: 'border-amber-200 dark:border-amber-900',
    };
  }

  return {
    color: 'green',
    className: 'text-green-600 dark:text-green-400',
    borderClassName: 'border-green-200 dark:border-green-900',
  };
}
