'use client';

import { Card, cn } from '@ui';
import {
  FileText,
  TrendingUp,
  DollarSign,
  Clock,
  type LucideIcon,
} from 'lucide-react';

/**
 * Icon mapping for MetricCard component.
 * Add new icons here as needed.
 */
const ICON_MAP: Record<string, LucideIcon> = {
  'file-text': FileText,
  'trending-up': TrendingUp,
  'dollar-sign': DollarSign,
  clock: Clock,
};

export type IconType = keyof typeof ICON_MAP;

interface MetricCardProps {
  title: string;
  value: string;
  description?: string;
  iconType: IconType;
  className?: string;
  /** Makes the card interactive with hover effects */
  interactive?: boolean;
}

/**
 * MetricCard - Display key metrics with an icon.
 *
 * Clean Dashboard Design principles:
 * - Consistent 24px (p-6) padding
 * - Clear typography hierarchy
 * - Subtle primary color accent for icons
 * - Optional hover effects for interactive cards
 *
 * @example
 * ```tsx
 * <MetricCard
 *   title="Total Invoices"
 *   value="42"
 *   description="All time submitted"
 *   iconType="file-text"
 * />
 * ```
 */
export function MetricCard({
  title,
  value,
  description,
  iconType,
  className,
  interactive = false,
}: MetricCardProps) {
  const Icon = ICON_MAP[iconType];

  return (
    <Card
      className={cn(
        'transition-all duration-200',
        interactive && 'hover:shadow-md hover:scale-[1.02] cursor-pointer',
        className
      )}
    >
      <div className="flex items-start justify-between gap-4 p-6">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-muted-foreground mb-2">
            {title}
          </p>
          <p className="text-2xl font-bold text-foreground leading-tight">
            {value}
          </p>
          {description && (
            <p className="text-xs text-muted-foreground mt-2">{description}</p>
          )}
        </div>
        <div className="flex-shrink-0 p-3 bg-primary/10 rounded-lg">
          <Icon className="h-5 w-5 " />
        </div>
      </div>
    </Card>
  );
}
