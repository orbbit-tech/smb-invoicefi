import { cn } from '@ui';

interface FundingProgressProps {
  funded: number;
  total: number;
  showLabel?: boolean;
  className?: string;
}

export function FundingProgress({
  funded,
  total,
  showLabel = true,
  className,
}: FundingProgressProps) {
  const percentage = total > 0 ? (funded / total) * 100 : 0;
  const isFullyFunded = percentage >= 100;

  return (
    <div className={cn('space-y-2', className)}>
      {showLabel && (
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Funding Progress</span>
          <span className="font-semibold">
            ${funded.toLocaleString()} / ${total.toLocaleString()}
          </span>
        </div>
      )}
      <div className="relative w-full bg-muted rounded-full h-2 overflow-hidden">
        <div
          className={cn(
            'h-full rounded-full transition-all duration-500',
            isFullyFunded ? 'bg-success' : 'bg-primary'
          )}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
      {showLabel && (
        <p className="text-xs text-muted-foreground">
          {percentage.toFixed(1)}% funded
          {isFullyFunded && ' ✓'}
        </p>
      )}
    </div>
  );
}
