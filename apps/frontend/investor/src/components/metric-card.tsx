'use client';

import { Card } from '@ui';
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
  description: string;
  iconType: IconType;
  className?: string;
}

/**
 * MetricCard - Display key metrics with an icon.
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
}: MetricCardProps) {
  const Icon = ICON_MAP[iconType];

  return (
    <Card className={className}>
      <div className="flex items-start justify-between p-6">
        <div className="flex-1">
          <p className="text-sm text-muted-foreground mb-1">{title}</p>
          <p className="text-2xl font-bold text-foreground">{value}</p>
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        </div>
        <div className="p-2 bg-primary/10 rounded-lg">
          <Icon className="h-5 w-5 text-primary" />
        </div>
      </div>
    </Card>
  );
}
