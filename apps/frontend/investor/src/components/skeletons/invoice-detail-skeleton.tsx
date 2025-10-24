import { Card, Skeleton } from '@ui';

/**
 * InvoiceDetailHeaderSkeleton - Loading state for InvoiceDetailHeader
 */
export function InvoiceDetailHeaderSkeleton() {
  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-start gap-4">
        <Skeleton className="h-12 w-12 rounded-full flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>

      <div className="flex gap-4 pt-2">
        <div className="flex-1 space-y-1">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-5 w-24" />
        </div>
        <div className="flex-1 space-y-1">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-5 w-20" />
        </div>
        <div className="flex-1 space-y-1">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-5 w-28" />
        </div>
      </div>
    </Card>
  );
}

/**
 * CardSectionSkeleton - Generic loading state for card sections
 */
export function CardSectionSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <Card className="p-6 space-y-4">
      <Skeleton className="h-5 w-40" />
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex justify-between items-center">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-24" />
          </div>
        ))}
      </div>
    </Card>
  );
}
