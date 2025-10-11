import { cn } from '@ui';

type RiskLevel = 'Low' | 'Medium' | 'High';

interface RiskBadgeProps {
  risk: RiskLevel;
  className?: string;
}

export function RiskBadge({ risk, className }: RiskBadgeProps) {
  const styles = {
    Low: 'bg-success/10  border-success/20',
    Medium: 'bg-warning/10 text-warning border-warning/20',
    High: 'bg-destructive/10 text-destructive border-destructive/20',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors',
        styles[risk],
        className
      )}
    >
      {risk} Risk
    </span>
  );
}
