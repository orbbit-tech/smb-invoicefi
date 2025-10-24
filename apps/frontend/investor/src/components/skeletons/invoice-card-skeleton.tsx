import { Card, Skeleton } from '@ui';

/**
 * InvoiceCardSkeleton - Loading state for InvoiceCard
 * Matches the layout of the actual InvoiceCard component
 */
export function InvoiceCardSkeleton() {
  return (
    <Card className="p-5 space-y-3">
      {/* Header with Avatar and Company Info */}
      <div className="flex items-start gap-3">
        <Skeleton className="h-9 w-9 rounded-full flex-shrink-0" />
        <div className="flex flex-col gap-2 min-w-0 flex-1">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>

      {/* Funding Amount Section */}
      <div className="bg-neutral-100/80 p-3 space-y-2 rounded-md">
        <div className="flex items-center justify-between">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-3 w-16" />
        </div>
        <div className="flex items-center justify-between">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-12" />
        </div>
        <div className="my-1 h-px bg-neutral-200" />
        <div className="flex items-center justify-between">
          <Skeleton className="h-3 w-28" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>

      {/* Face Value Section */}
      <div className="bg-neutral-100/80 p-3 space-y-2 rounded-md">
        <div className="flex items-center justify-between">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-3 w-16" />
        </div>
        <div className="flex items-center justify-between">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-3 w-12" />
        </div>
        <div className="flex items-center justify-between">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-3 w-12" />
        </div>
      </div>

      {/* Payer Section */}
      <div className="bg-neutral-100/80 p-3 space-y-2 rounded-md">
        <div className="flex items-center justify-between">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-3 w-20" />
        </div>
        <div className="flex items-center justify-between">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-20" />
        </div>
      </div>
    </Card>
  );
}
