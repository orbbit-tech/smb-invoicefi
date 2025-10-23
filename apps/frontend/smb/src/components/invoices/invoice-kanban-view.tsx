'use client';

import { Invoice, InvoiceStatus } from '@/types/invoice';
import { Card, CardHeader, CardContent, Badge } from '@ui';
import { InvoiceStatusBadge } from './invoice-status-badge';
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
}

const statusColumns = [
  { id: InvoiceStatus.LISTED, title: 'Listed' },
  { id: InvoiceStatus.FULLY_FUNDED, title: 'Funded' },
  { id: InvoiceStatus.FULLY_PAID, title: 'Paid' },
  { id: InvoiceStatus.DEFAULTED, title: 'Defaulted' },
  { id: InvoiceStatus.SETTLED, title: 'Settled' },
];

function InvoiceCard({ invoice }: { invoice: Invoice }) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
    }).format(date);
  };

  return (
    <Link href={`/invoices/${invoice.id}`}>
      <Card className="mb-3 hover:shadow-md transition-shadow cursor-pointer">
        <CardHeader className="p-4 pb-2">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">
              {invoice.invoiceNumber}
            </p>
            <h4 className="font-semibold text-sm truncate">
              {invoice.payer.name}
            </h4>
          </div>
        </CardHeader>
        <CardContent className="p-4 pt-2 space-y-2">
          <div className="text-lg font-bold">
            {formatCurrency(invoice.amount)}
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3" />
            <span>Due: {formatDate(invoice.dueDate)}</span>
            <span className="ml-1">({invoice.daysUntilDue}d)</span>
          </div>
          {invoice.payer.industry && (
            <p className="text-xs text-muted-foreground truncate">
              {invoice.payer.industry}
            </p>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}

export function InvoiceKanbanView({ invoices }: InvoiceKanbanViewProps) {
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const groupedInvoices = useMemo(() => {
    const groups: Record<InvoiceStatus, Invoice[]> = {
      [InvoiceStatus.LISTED]: [],
      [InvoiceStatus.FULLY_FUNDED]: [],
      [InvoiceStatus.FULLY_PAID]: [],
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
                    <InvoiceCard key={invoice.id} invoice={invoice} />
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
        {activeInvoice ? <InvoiceCard invoice={activeInvoice} /> : null}
      </DragOverlay>
    </DndContext>
  );
}
