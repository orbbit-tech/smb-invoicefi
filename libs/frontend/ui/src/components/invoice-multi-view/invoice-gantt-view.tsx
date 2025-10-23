'use client';

import { useRouter } from 'next/navigation';
import { Invoice, InvoiceStatus, InvoiceMultiViewConfig } from '../../types';
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
  cn,
} from '../kibo';
import { useMemo, useState, useContext, useEffect, useRef } from 'react';
import { InvoiceStatusBadge } from './invoice-status-badge';
import { EntityInfo } from './entity-info';

interface InvoiceGanttViewProps {
  invoices: Invoice[];
  config?: InvoiceMultiViewConfig;
}

type ViewOption = 'daily' | 'monthly' | 'quarterly';

// Helper component to scroll timeline to today on mount and when view range changes
function ScrollToTodayEffect({ viewRange }: { viewRange: Range }) {
  const gantt = useContext(GanttContext) as GanttContextProps;
  const prevViewRangeRef = useRef<Range | null>(null);
  const hasScrolledRef = useRef(false);

  useEffect(() => {
    const isInitialMount = prevViewRangeRef.current === null;
    const viewRangeChanged = prevViewRangeRef.current !== viewRange;

    // Check if timeline data is ready
    const isTimelineReady = gantt.timelineData && gantt.timelineData.length > 0;

    // Only scroll if:
    // 1. This is initial mount and timeline is ready, OR
    // 2. viewRange actually changed
    if (!isTimelineReady) {
      return;
    }

    if (!isInitialMount && !viewRangeChanged) {
      return;
    }

    // Update the ref to track current viewRange
    prevViewRangeRef.current = viewRange;

    // Wait for next tick to ensure GanttProvider has fully updated the DOM
    const timer = setTimeout(() => {
      const scrollElement = gantt.ref?.current;
      if (!scrollElement) return;

      // Calculate today's position in the timeline
      const today = new Date();
      const timelineStartDate = new Date(
        gantt.timelineData[0]?.year ?? 0,
        0,
        1
      );

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

      hasScrolledRef.current = true;
    }, 150);

    return () => clearTimeout(timer);
  }, [viewRange, gantt.timelineData, gantt.ref]);

  return null;
}

export function InvoiceGanttView({ invoices, config }: InvoiceGanttViewProps) {
  const [viewRange, setViewRange] = useState<Range>('monthly');
  const router = useRouter();
  const showSmbInfo = config?.showSmbColumn ?? false;

  // Handler for range changes from the toolbar
  const handleRangeChange = (newRange: Range) => {
    setViewRange(newRange);
  };

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
        name: showSmbInfo ? invoice.payer.name : invoice.payer.name,
        startAt: invoice.createdDate,
        endAt: invoice.dueDate,
        status,
      };
    });
  }, [invoices, showSmbInfo]);

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

  // Calculate dynamic height based on invoice count
  // rowHeight (64px) * invoice count + header (~80px) + toolbar (~60px) + padding
  const ROW_HEIGHT = 64;
  const HEADER_HEIGHT = 80;
  const TOOLBAR_HEIGHT = 60;
  const MIN_HEIGHT = 300;
  const MAX_HEIGHT = 600;

  const calculatedHeight = (invoices.length * ROW_HEIGHT) + HEADER_HEIGHT + TOOLBAR_HEIGHT;
  const dynamicHeight = Math.min(Math.max(calculatedHeight, MIN_HEIGHT), MAX_HEIGHT);

  return (
    <div>
      <style>{`
        /* Custom gantt bar styling - make bars smaller while keeping row height */
        .gantt-row-custom .pointer-events-auto.absolute {
          height: 28px !important;
          top: 50% !important;
          transform: translateY(-50%);
        }
      `}</style>

      <GanttProvider
        zoom={viewRange === 'daily' ? 200 : viewRange === 'monthly' ? 150 : 100}
        range={viewRange}
        rowHeight={64}
        className="shadow-md rounded-lg"
        style={{ height: `${dynamicHeight}px` }}
        showToolbar={true}
        onRangeChange={handleRangeChange}
      >
        {/* Auto-scroll to today when view range changes */}
        <ScrollToTodayEffect viewRange={viewRange} />
        <GanttSidebar showHeader={false} className="!overflow-visible">
          <div>
            {/* Custom Sidebar Header */}
            <div
              className="sticky top-0 z-10 flex shrink-0 items-end justify-between gap-2.5 border-border/50 border-b bg-backdrop/90 p-2.5 font-medium text-muted-foreground text-xs backdrop-blur-sm"
              style={{ height: 'var(--gantt-header-height)' }}
            >
              <p className="flex-1 truncate text-left">Invoices</p>
              <p className="shrink-0">Amount</p>
            </div>
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
                    showSmbInfo={showSmbInfo}
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
  showSmbInfo?: boolean;
}

function InvoiceGanttSidebarItem({
  feature,
  invoice,
  showSmbInfo = false,
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
      className="relative flex items-center justify-between gap-2 p-2.5 hover:bg-secondary cursor-pointer"
      style={{ height: 'var(--gantt-row-height)' }}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
    >
      <div className="flex-1 min-w-0">
        {showSmbInfo && invoice.smb ? (
          <EntityInfo
            name={invoice.smb.name}
            logoUrl={invoice.smb.logoUrl}
            size="sm"
          />
        ) : (
          <EntityInfo
            name={invoice.payer.name}
            logoUrl={invoice.payer.logoUrl}
            size="sm"
          />
        )}
      </div>
      {showSmbInfo ? (
        <p className="text-muted-foreground text-xs shrink-0">
          {formatCurrency(invoice.amount)}
        </p>
      ) : (
        <div className="flex flex-col items-end gap-1 shrink-0">
          <InvoiceStatusBadge status={invoice.status} size="sm" />
          <p className="text-muted-foreground text-xs">
            {formatCurrency(invoice.amount)}
          </p>
        </div>
      )}
    </div>
  );
}

// Helper function to map InvoiceStatus to GanttStatus
function getGanttStatus(status: InvoiceStatus): GanttStatus {
  switch (status) {
    case InvoiceStatus.LISTED:
      return {
        id: 'listed',
        name: 'Listed',
        color: 'hsl(43, 96%, 56%)', // amber
      };
    case InvoiceStatus.FULLY_FUNDED:
      return {
        id: 'funded',
        name: 'Funded',
        color: 'hsl(271, 91%, 65%)', // purple
      };
    case InvoiceStatus.FULLY_PAID:
      return {
        id: 'paid',
        name: 'Paid',
        color: 'hsl(142, 76%, 36%)', // green
      };
    case InvoiceStatus.DEFAULTED:
      return {
        id: 'defaulted',
        name: 'Defaulted',
        color: 'hsl(0, 84%, 60%)', // red
      };
    case InvoiceStatus.SETTLED:
      return {
        id: 'settled',
        name: 'Settled',
        color: 'hsl(0, 0%, 63%)', // gray
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
