import { Card } from '@ui';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string;
  description?: string;
  icon?: LucideIcon;
  trend?: {
    value: string;
    isPositive: boolean;
  };
}

export function MetricCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
}: MetricCardProps) {
  return (
    <Card className="p-6">
      <div className="flex flex-row items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-muted-foreground">
          {title}
        </h3>
        {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
      </div>
      <div className="text-xl font-bold tracking-tight">{value}</div>
      {trend && (
        <div className="flex items-center gap-1 text-sm mt-2">
          <span
            className={trend.isPositive ? 'text-success' : 'text-destructive'}
          >
            {trend.isPositive ? '↑' : '↓'} {trend.value}
          </span>
          <span className="text-muted-foreground text-xs">
            vs last period
          </span>
        </div>
      )}
    </Card>
  );
}
