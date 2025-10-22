'use client';

import { Invoice, InvoiceStatus } from '@/types/invoice';
import { Card, CardHeader, CardContent, Badge } from '@ui';
import { InvoiceStatusBadge } from './invoice-status-badge';
import { Calendar, DollarSign } from 'lucide-react';
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
  { id: InvoiceStatus.CREATED, title: 'Created' },
  { id: InvoiceStatus.LISTED, title: 'Listed' },
  { id: InvoiceStatus.FULLY_FUNDED, title: 'Fully Funded' },
  { id: InvoiceStatus.DISBURSED, title: 'Disbursed' },
  { id: InvoiceStatus.PENDING_REPAYMENT, title: 'Pending Repayment' },
  { id: InvoiceStatus.REPAID, title: 'Repaid' },
  { id: InvoiceStatus.OVERDUE, title: 'Overdue' },
  { id: InvoiceStatus.UNDER_COLLECTION, title: 'Under Collection' },
  { id: InvoiceStatus.DEFAULTED, title: 'Defaulted' },
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

  const getRiskColor = (riskScore: string) => {
    switch (riskScore) {
      case 'LOW':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'HIGH':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  return (
    <Link href={`/invoices/${invoice.id}`}>
      <Card className="mb-3 hover:shadow-md transition-shadow cursor-pointer">
        <CardHeader className="p-4 pb-2">
          <div className="flex items-start justify-between gap-2">
            <div className="space-y-1 flex-1 min-w-0">
              <p className="text-xs text-muted-foreground">
                {invoice.invoiceNumber}
              </p>
              <h4 className="font-semibold text-sm truncate">
                {invoice.payer.name}
              </h4>
            </div>
            <Badge className={getRiskColor(invoice.riskScore)} variant="secondary">
              {invoice.riskScore}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-4 pt-2 space-y-2">
          <div className="flex items-center gap-1 text-lg font-bold">
            <DollarSign className="h-4 w-4" />
            <span>{formatCurrency(invoice.amount)}</span>
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
      [InvoiceStatus.CREATED]: [],
      [InvoiceStatus.LISTED]: [],
      [InvoiceStatus.FULLY_FUNDED]: [],
      [InvoiceStatus.DISBURSED]: [],
      [InvoiceStatus.PENDING_REPAYMENT]: [],
      [InvoiceStatus.REPAID]: [],
      [InvoiceStatus.OVERDUE]: [],
      [InvoiceStatus.UNDER_COLLECTION]: [],
      [InvoiceStatus.DEFAULTED]: [],
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
                <h3 className="font-semibold text-sm mb-1">{column.title}</h3>
                <p className="text-xs text-muted-foreground">
                  {columnInvoices.length}{' '}
                  {columnInvoices.length === 1 ? 'invoice' : 'invoices'}
                </p>
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
