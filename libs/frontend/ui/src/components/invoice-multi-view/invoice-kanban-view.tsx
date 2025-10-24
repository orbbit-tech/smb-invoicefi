'use client';

import { Invoice, InvoiceStatus, InvoiceMultiViewConfig } from '../../types';
import { Card, CardHeader, CardContent, Badge } from '../shadcn';
import { InvoiceStatusBadge } from './invoice-status-badge';
import { EntityInfo } from './entity-info';
import { Calendar } from 'lucide-react';
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
}

const statusColumns = [
  { id: InvoiceStatus.CREATED, title: 'Created' },
  { id: InvoiceStatus.LISTED, title: 'Listed' },
  { id: InvoiceStatus.FULLY_FUNDED, title: 'Funded' },
  { id: InvoiceStatus.DISBURSED, title: 'Disbursed' },
  { id: InvoiceStatus.PENDING_REPAYMENT, title: 'Pending Repayment' },
  { id: InvoiceStatus.FULLY_PAID, title: 'Paid' },
  { id: InvoiceStatus.REPAID, title: 'Repaid' },
  { id: InvoiceStatus.DEFAULTED, title: 'Defaulted' },
  { id: InvoiceStatus.SETTLED, title: 'Settled' },
];

function InvoiceCard({
  invoice,
  baseRoute = '/invoices',
  showSmbInfo = false,
}: {
  invoice: Invoice;
  baseRoute?: string;
  showSmbInfo?: boolean;
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

  return (
    <Link href={`${baseRoute}/${invoice.id}`}>
      <Card className="mb-3 hover:shadow-md transition-shadow cursor-pointer">
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
          <div className="font-bold">{formatCurrency(invoice.amount)}</div>
          {showSmbInfo && (
            <p className="text-xs text-muted-foreground">
              {invoice.payer.name}
            </p>
          )}
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <span>{formatDate(invoice.dueDate)}</span>
            {invoice.daysUntilDue > 0 && (
              <span className="ml-1">({invoice.daysUntilDue}d)</span>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export function InvoiceKanbanView({
  invoices,
  baseRoute = '/invoices',
  config,
}: InvoiceKanbanViewProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const showSmbInfo = config?.showSmbColumn ?? false;

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const groupedInvoices = useMemo(() => {
    const groups: Record<InvoiceStatus, Invoice[]> = {
      [InvoiceStatus.CREATED]: [],
      [InvoiceStatus.LISTED]: [],
      [InvoiceStatus.FULLY_FUNDED]: [],
      [InvoiceStatus.DISBURSED]: [],
      [InvoiceStatus.PENDING_REPAYMENT]: [],
      [InvoiceStatus.FULLY_PAID]: [],
      [InvoiceStatus.REPAID]: [],
      [InvoiceStatus.DEFAULTED]: [],
      [InvoiceStatus.SETTLED]: [],
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
        {statusColumns.map((column) => {
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
