'use client';

import { Invoice, InvoiceStatus, InvoiceMultiViewConfig } from '../../types';
import { Card, CardHeader, CardContent, Badge, Button } from '../shadcn';
import { InvoiceStatusBadge } from './invoice-status-badge';
import { EntityInfo } from './entity-info';
import { UrgencyIndicator, getUrgencyColor } from './urgency-indicator';
import { Calendar, Wallet } from 'lucide-react';
import Link from 'next/link';
import { useMemo } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragOverEvent,
} from '@dnd-kit/core';
import { useState } from 'react';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';

interface InvoiceKanbanViewProps {
  invoices: Invoice[];
  baseRoute?: string;
  config?: InvoiceMultiViewConfig;
  onRepaymentClick?: (invoice: Invoice) => void;
}

const statusColumns = [
  { id: InvoiceStatus.SUBMITTED, title: 'Submitted' },
  { id: InvoiceStatus.LISTED, title: 'Listed' },
  { id: InvoiceStatus.FULLY_FUNDED, title: 'Funded' },
  { id: InvoiceStatus.OVERDUE, title: 'Overdue' },
  { id: InvoiceStatus.FULLY_PAID, title: 'Fully Paid' },
  { id: InvoiceStatus.SETTLED, title: 'Settled' },
  { id: InvoiceStatus.DEFAULTED, title: 'Defaulted' },
  // Legacy statuses (for backwards compatibility)
  { id: InvoiceStatus.CREATED, title: 'Draft' },
  { id: InvoiceStatus.DISBURSED, title: 'Disbursed' },
  { id: InvoiceStatus.PENDING_REPAYMENT, title: 'Pending Repayment' },
  { id: InvoiceStatus.REPAID, title: 'Repaid' },
];

function InvoiceCard({
  invoice,
  baseRoute = '/invoices',
  showSmbInfo = false,
  onRepaymentClick,
}: {
  invoice: Invoice;
  baseRoute?: string;
  showSmbInfo?: boolean;
  onRepaymentClick?: (invoice: Invoice) => void;
}) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'numeric',
      year: 'numeric',
      day: 'numeric',
    }).format(date);
  };

  // Show "Pay Now" for:
  // 1. FULLY_FUNDED status with ≤7 days until due (due soon)
  // 2. OVERDUE status (past due date + grace period)
  const isFundedAndDueSoon =
    invoice.status === InvoiceStatus.FULLY_FUNDED &&
    invoice.daysUntilDue >= 0 &&
    invoice.daysUntilDue <= 7;
  const isOverdue = invoice.status === InvoiceStatus.OVERDUE;
  const needsRepayment = isFundedAndDueSoon || isOverdue;
  const urgencyColor = getUrgencyColor(invoice.daysUntilDue);

  return (
    <div>
      <Link href={`${baseRoute}/${invoice.id}`}>
        <Card
          className={`mb-3 hover:shadow-md transition-shadow cursor-pointer ${
            isOverdue ? 'border-l-4 border-l-red-300 dark:border-l-red-800' : ''
          }`}
        >
          <CardHeader className="p-4 pb-2">
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">
                {invoice.invoiceNumber}
              </p>
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
                  secondaryInfo={invoice.payer.industry}
                  size="sm"
                />
              )}
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-2 space-y-2">
            <div className="flex items-center justify-between">
              <div className="font-bold">{formatCurrency(invoice.amount)}</div>
              {needsRepayment && onRepaymentClick && (
                <Button
                  size="sm"
                  variant="outline"
                  className={isOverdue ? 'text-xs bg-red-100 text-red-700 border-red-200 hover:bg-red-200 hover:text-red-800 hover:border-red-300 dark:bg-red-900/30 dark:text-red-400 dark:border-red-900 dark:hover:bg-red-900/50 dark:hover:text-red-300' : 'text-xs'}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onRepaymentClick(invoice);
                  }}
                >
                  Pay Now
                </Button>
              )}
            </div>
            {showSmbInfo && (
              <p className="text-xs text-muted-foreground">
                {invoice.payer.name}
              </p>
            )}
            <div className="flex items-center gap-1 text-xs">
              <span className="text-muted-foreground">
                {formatDate(invoice.dueDate)}
              </span>
            </div>
          </CardContent>
        </Card>
      </Link>
    </div>
  );
}

export function InvoiceKanbanView({
  invoices,
  baseRoute = '/invoices',
  config,
  onRepaymentClick,
}: InvoiceKanbanViewProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const showSmbInfo = config?.showSmbColumn ?? false;

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Filter columns based on config.availableStatuses
  const visibleColumns = useMemo(() => {
    if (!config?.availableStatuses) {
      return []; // No columns if not configured
    }

    return config.availableStatuses
      .map((status) => statusColumns.find((col) => col.id === status))
      .filter(
        (col): col is (typeof statusColumns)[number] => col !== undefined
      );
  }, [config?.availableStatuses]);

  const groupedInvoices = useMemo(() => {
    const groups: Record<InvoiceStatus, Invoice[]> = {
      [InvoiceStatus.SUBMITTED]: [],
      [InvoiceStatus.LISTED]: [],
      [InvoiceStatus.FULLY_FUNDED]: [],
      [InvoiceStatus.OVERDUE]: [],
      [InvoiceStatus.FULLY_PAID]: [],
      [InvoiceStatus.SETTLED]: [],
      [InvoiceStatus.DEFAULTED]: [],
      // Legacy statuses (for backwards compatibility)
      [InvoiceStatus.CREATED]: [],
      [InvoiceStatus.DISBURSED]: [],
      [InvoiceStatus.PENDING_REPAYMENT]: [],
      [InvoiceStatus.REPAID]: [],
    };

    invoices.forEach((invoice) => {
      if (groups[invoice.status]) {
        groups[invoice.status].push(invoice);
      }
    });

    return groups;
  }, [invoices]);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = () => {
    setActiveId(null);
    // Note: In a real implementation, you would update the invoice status here
    // For now, this is visual-only
  };

  const activeInvoice = activeId
    ? invoices.find((inv) => inv.id === activeId)
    : null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4">
        {visibleColumns.map((column) => {
          const columnInvoices = groupedInvoices[column.id] || [];
          const hasInvoices = columnInvoices.length > 0;

          return (
            <div
              key={column.id}
              className="flex-shrink-0 w-80 bg-muted/30 rounded-lg p-4"
            >
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-1">
                  <InvoiceStatusBadge status={column.id} size="sm" />
                  <p className="text-xs text-muted-foreground">
                    {columnInvoices.length}{' '}
                    {columnInvoices.length === 1 ? 'invoice' : 'invoices'}
                  </p>
                </div>
              </div>
              <div className="space-y-2 min-h-[200px]">
                {hasInvoices ? (
                  columnInvoices.map((invoice) => (
                    <InvoiceCard
                      key={invoice.id}
                      invoice={invoice}
                      baseRoute={baseRoute}
                      showSmbInfo={showSmbInfo}
                      onRepaymentClick={onRepaymentClick}
                    />
                  ))
                ) : (
                  <div className="text-center text-sm text-muted-foreground py-8">
                    No invoices
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <DragOverlay>
        {activeInvoice ? (
          <InvoiceCard
            invoice={activeInvoice}
            baseRoute={baseRoute}
            showSmbInfo={showSmbInfo}
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
