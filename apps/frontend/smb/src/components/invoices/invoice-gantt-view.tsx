'use client';

import { useRouter } from 'next/navigation';
import { Invoice, InvoiceStatus } from '@/types/invoice';
import {
  GanttProvider,
  GanttTimeline,
  GanttHeader,
  GanttFeatureList,
  GanttFeatureItem,
  GanttToday,
  GanttSidebar,
  GanttSidebarHeader,
  GanttContext,
  type GanttFeature,
  type GanttStatus,
  type GanttContextProps,
  type Range,
  Badge,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  cn,
} from '@ui';
import { useMemo, useState, useContext, useEffect, useRef } from 'react';

interface InvoiceGanttViewProps {
  invoices: Invoice[];
}

type ViewOption = 'daily' | 'monthly' | 'quarterly';

// Helper component to scroll timeline to today when view range changes
function ScrollToTodayEffect({ viewRange }: { viewRange: Range }) {
  const gantt = useContext(GanttContext) as GanttContextProps;
  const prevViewRangeRef = useRef<Range | null>(null);

  useEffect(() => {
    // Skip on initial mount - only run when viewRange actually changes
    if (prevViewRangeRef.current === null) {
      prevViewRangeRef.current = viewRange;
      return;
    }

    // Only scroll if viewRange actually changed
    if (prevViewRangeRef.current === viewRange) {
      return;
    }

    prevViewRangeRef.current = viewRange;

    // Wait for next tick to ensure GanttProvider has updated
    const timer = setTimeout(() => {
      const scrollElement = gantt.ref?.current;
      if (!scrollElement) return;

      // Calculate today's position in the timeline
      const today = new Date();
      const timelineStartDate = new Date(gantt.timelineData[0]?.year ?? 0, 0, 1);

      // Get offset calculation helpers based on range
      const getDifferenceIn = (range: Range) => {
        if (range === 'daily') {
          return (date1: Date, date2: Date) => {
            return Math.floor(
              (date1.getTime() - date2.getTime()) / (1000 * 60 * 60 * 24)
            );
          };
        }
        // For monthly/quarterly
        return (date1: Date, date2: Date) => {
          return (
            (date1.getFullYear() - date2.getFullYear()) * 12 +
            (date1.getMonth() - date2.getMonth())
          );
        };
      };

      const parsedColumnWidth = (gantt.columnWidth * gantt.zoom) / 100;
      const differenceIn = getDifferenceIn(gantt.range);

      // Calculate offset for today
      let offset = 0;
      if (gantt.range === 'daily') {
        const daysDiff = differenceIn(today, timelineStartDate);
        offset = parsedColumnWidth * daysDiff;
      } else {
        // Monthly/Quarterly
        const monthsDiff = differenceIn(today, timelineStartDate);
        const daysInMonth = new Date(
          today.getFullYear(),
          today.getMonth() + 1,
          0
        ).getDate();
        const pixelsPerDay = parsedColumnWidth / daysInMonth;
        const dayOfMonth = today.getDate();
        offset = monthsDiff * parsedColumnWidth + dayOfMonth * pixelsPerDay;
      }

      // Center today in the viewport
      const targetScrollLeft = Math.max(
        0,
        offset - scrollElement.clientWidth / 2
      );

      scrollElement.scrollTo({
        left: targetScrollLeft,
        behavior: 'smooth',
      });
    }, 100);

    return () => clearTimeout(timer);
  }, [viewRange]); // Only depend on viewRange, not gantt!

  return null;
}

export function InvoiceGanttView({ invoices }: InvoiceGanttViewProps) {
  const [viewRange, setViewRange] = useState<Range>('monthly');
  const router = useRouter();

  // Handler for clicking timeline bars
  const handleBarClick = (e: React.MouseEvent, invoiceId: string) => {
    e.stopPropagation(); // Prevent triggering drag handlers
    router.push(`/invoices/${invoiceId}`);
  };

  // Transform invoices into Gantt features
  const features: GanttFeature[] = useMemo(() => {
    return invoices.map((invoice) => {
      const status: GanttStatus = getGanttStatus(invoice.status);

      return {
        id: invoice.id,
        name: invoice.payer.name,
        startAt: invoice.createdDate,
        endAt: invoice.dueDate,
        status,
      };
    });
  }, [invoices]);

  // Create a map for quick invoice lookup
  const invoiceMap = useMemo(() => {
    const map = new Map<string, Invoice>();
    invoices.forEach((inv) => map.set(inv.id, inv));
    return map;
  }, [invoices]);

  if (invoices.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>No invoices to display</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <style>{`
        /* Custom gantt bar styling - make bars smaller while keeping row height */
        .gantt-row-custom .pointer-events-auto.absolute {
          height: 28px !important;
          top: 50% !important;
          transform: translateY(-50%);
        }
      `}</style>
      {/* View Range Selector */}
      <div className="flex justify-end">
        <Select
          value={viewRange}
          onValueChange={(value) => setViewRange(value as Range)}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select view" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="daily">Week</SelectItem>
            <SelectItem value="monthly">Month</SelectItem>
            <SelectItem value="quarterly">Quarter</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <GanttProvider
        zoom={viewRange === 'daily' ? 200 : viewRange === 'monthly' ? 150 : 100}
        range={viewRange}
        rowHeight={64}
        className="border rounded-lg h-[600px]"
      >
        {/* Auto-scroll to today when view range changes */}
        <ScrollToTodayEffect viewRange={viewRange} />
        <GanttSidebar showHeader={false} className="!overflow-visible">
          <div>
            <GanttSidebarHeader leftText="Invoices" rightText={null} />
            {/* Custom Sidebar Items - No spacing, just dividers */}
            <div className="divide-y divide-border/50">
              {features.map((feature) => {
                const invoice = invoiceMap.get(feature.id);
                if (!invoice) return null;

                return (
                  <InvoiceGanttSidebarItem
                    key={feature.id}
                    feature={feature}
                    invoice={invoice}
                  />
                );
              })}
            </div>
          </div>
        </GanttSidebar>
        <GanttTimeline>
          <GanttHeader />
          <GanttFeatureList className="space-y-0">
            {features.map((feature) => (
              <div
                key={feature.id}
                className="relative border-b border-border/50 flex items-center gantt-row-custom"
                style={{ height: 'var(--gantt-row-height)' }}
              >
                <GanttFeatureItem {...feature}>
                  <div
                    onClick={(e) => handleBarClick(e, feature.id)}
                    className="flex-1 truncate text-xs cursor-pointer hover:opacity-80 transition-opacity"
                    title={`Click to view ${feature.name} invoice details`}
                  >
                    {feature.name}
                  </div>
                </GanttFeatureItem>
              </div>
            ))}
          </GanttFeatureList>
          <GanttToday className="bg-slate-300 shadow-sm" />
        </GanttTimeline>
      </GanttProvider>
    </div>
  );
}

// Custom Sidebar Item Component with Click-to-Scroll
interface InvoiceGanttSidebarItemProps {
  feature: GanttFeature;
  invoice: Invoice;
}

function InvoiceGanttSidebarItem({
  feature,
  invoice,
}: InvoiceGanttSidebarItemProps) {
  const gantt = useContext(GanttContext) as GanttContextProps;

  const handleClick = () => {
    // Scroll to the feature in the timeline
    gantt.scrollToFeature?.(feature);
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      gantt.scrollToFeature?.(feature);
    }
  };

  return (
    <div
      className="relative flex flex-col justify-center gap-1 p-2.5 hover:bg-secondary cursor-pointer"
      style={{ height: 'var(--gantt-row-height)' }}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
    >
      <div className="flex items-center gap-2">
        <p className="flex-1 truncate text-left font-medium text-sm">
          {invoice.payer.name}
        </p>
        <Badge className={cn(getStatusBadgeColor(invoice.status), 'text-xs')}>
          {getStatusDisplayName(invoice.status)}
        </Badge>
      </div>
      <p className="text-muted-foreground text-xs">
        {formatCurrency(invoice.amount)}
      </p>
    </div>
  );
}

// Helper function to map InvoiceStatus to GanttStatus
function getGanttStatus(status: InvoiceStatus): GanttStatus {
  switch (status) {
    case InvoiceStatus.REPAID:
      return {
        id: 'repaid',
        name: 'Repaid',
        color: 'hsl(142, 76%, 36%)', // green
      };
    case InvoiceStatus.OVERDUE:
    case InvoiceStatus.DEFAULTED:
    case InvoiceStatus.UNDER_COLLECTION:
      return {
        id: 'overdue',
        name: 'Overdue',
        color: 'hsl(0, 84%, 60%)', // red
      };
    case InvoiceStatus.DISBURSED:
    case InvoiceStatus.PENDING_REPAYMENT:
      return {
        id: 'pending',
        name: 'Pending',
        color: 'hsl(217, 91%, 60%)', // blue
      };
    case InvoiceStatus.FULLY_FUNDED:
      return {
        id: 'funded',
        name: 'Funded',
        color: 'hsl(271, 91%, 65%)', // purple
      };
    case InvoiceStatus.LISTED:
      return {
        id: 'listed',
        name: 'Listed',
        color: 'hsl(43, 96%, 56%)', // amber
      };
    default:
      return {
        id: 'default',
        name: 'Unknown',
        color: 'hsl(0, 0%, 63%)', // gray
      };
  }
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
  }).format(amount);
}

function getStatusBadgeColor(status: InvoiceStatus): string {
  switch (status) {
    case InvoiceStatus.REPAID:
      return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300';
    case InvoiceStatus.OVERDUE:
    case InvoiceStatus.DEFAULTED:
    case InvoiceStatus.UNDER_COLLECTION:
      return 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300';
    case InvoiceStatus.DISBURSED:
    case InvoiceStatus.PENDING_REPAYMENT:
      return 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300';
    case InvoiceStatus.FULLY_FUNDED:
      return 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300';
    case InvoiceStatus.LISTED:
      return 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300';
    default:
      return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
  }
}

function getStatusDisplayName(status: InvoiceStatus): string {
  switch (status) {
    case InvoiceStatus.PENDING_REPAYMENT:
      return 'PENDING';
    case InvoiceStatus.UNDER_COLLECTION:
      return 'COLLECTION';
    case InvoiceStatus.FULLY_FUNDED:
      return 'FUNDED';
    default:
      return status;
  }
}
