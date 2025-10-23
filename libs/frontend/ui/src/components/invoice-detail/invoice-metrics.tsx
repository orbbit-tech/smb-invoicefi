'use client';

import { Card, Separator } from '../../';
import { TrendingUp } from 'lucide-react';
import { InvoiceDetailData } from './types';

interface MetricItem {
  label: string;
  value: string | number;
  subtitle?: string;
}

interface InvoiceMetricsProps {
  invoice: InvoiceDetailData;
  metrics: MetricItem[];
  title?: string;
  icon?: React.ReactNode;
}

/**
 * Invoice Metrics Component
 *
 * Displays key metrics in a grid layout
 * Flexible to accommodate different metric configurations
 */
export function InvoiceMetrics({
  invoice,
  metrics,
  title = 'Investment Overview',
  icon,
}: InvoiceMetricsProps) {
  const Icon = icon || <TrendingUp className="h-4 w-4 text-muted-foreground" />;

  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-center gap-2">
        {Icon}
        <h2 className="text-base font-semibold">{title}</h2>
      </div>
      <Separator />
      <div className={`grid gap-4 ${metrics.length === 4 ? 'grid-cols-2 md:grid-cols-4' : metrics.length === 3 ? 'grid-cols-3' : 'grid-cols-2'}`}>
        {metrics.map((metric, index) => (
          <div key={index} className="space-y-1">
            <p className="text-sm text-muted-foreground">{metric.label}</p>
            <p className="text-xl font-bold tracking-tight">{metric.value}</p>
            {metric.subtitle && (
              <p className="text-xs text-muted-foreground">{metric.subtitle}</p>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
}
