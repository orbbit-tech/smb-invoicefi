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
  const remaining = total - funded;

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex justify-between">
        {showLabel && (
          <div className="flex flex-col items-start">
            <span className="text-muted-foreground text-xs">Funded</span>
            <span className="font-semibold">${funded.toLocaleString()}</span>
          </div>
        )}
        {showLabel && (
          <div className="flex flex-col items-end">
            <span className="text-muted-foreground text-xs">Left to fund</span>
            <span className="font-semibold">${remaining.toLocaleString()}</span>
          </div>
        )}
      </div>
      <div className="relative w-full bg-white rounded-full h-1.5 overflow-hidden">
        <div
          className={cn(
            'h-full rounded-full transition-all duration-500',
            isFullyFunded ? 'bg-primary' : 'bg-primary'
          )}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
    </div>
  );
}
