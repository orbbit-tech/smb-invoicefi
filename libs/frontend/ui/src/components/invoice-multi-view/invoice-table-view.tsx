'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../shadcn';
import { Button } from '../shadcn';
import { Invoice, InvoiceMultiViewConfig, InvoiceStatus } from '../../types';
import { InvoiceStatusBadge } from './invoice-status-badge';
import { CopyableText } from './copyable-text';
import { EntityInfo } from './entity-info';
import { UrgencyIndicator, getUrgencyColor } from './urgency-indicator';
import { ArrowUpDown, Wallet } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface InvoiceTableViewProps {
  invoices: Invoice[];
  baseRoute?: string;
  config?: InvoiceMultiViewConfig;
  onRepaymentClick?: (invoice: Invoice) => void;
}

type SortField = 'invoiceNumber' | 'amount' | 'dueDate' | 'status';
type SortDirection = 'asc' | 'desc';

export function InvoiceTableView({
  invoices,
  baseRoute = '/invoices',
  config,
  onRepaymentClick,
}: InvoiceTableViewProps) {
  const router = useRouter();
  const [sortField, setSortField] = useState<SortField>('dueDate');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const showSmbColumn = config?.showSmbColumn ?? false;

  const needsRepaymentAction = (invoice: Invoice) => {
    // Show "Pay Now" for:
    // 1. FULLY_FUNDED status with ≤7 days until due (due soon)
    // 2. OVERDUE status (past due date + grace period)
    const isFundedAndDueSoon =
      invoice.status === InvoiceStatus.FULLY_FUNDED &&
      invoice.daysUntilDue >= 0 &&
      invoice.daysUntilDue <= 7;
    const isOverdue = invoice.status === InvoiceStatus.OVERDUE;

    return isFundedAndDueSoon || isOverdue;
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedInvoices = [...invoices].sort((a, b) => {
    let aValue: any = a[sortField];
    let bValue: any = b[sortField];

    if (sortField === 'dueDate') {
      aValue = a.dueDate.getTime();
      bValue = b.dueDate.getTime();
    }

    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

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
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            {showSmbColumn && <TableHead>SMB</TableHead>}
            <TableHead>Payer</TableHead>
            <TableHead>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleSort('amount')}
                className="flex items-center gap-1"
              >
                Amount
                <ArrowUpDown className="h-3 w-3" />
              </Button>
            </TableHead>
            <TableHead>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleSort('dueDate')}
                className="flex items-center gap-1"
              >
                Due Date
                <ArrowUpDown className="h-3 w-3" />
              </Button>
            </TableHead>
            <TableHead>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleSort('status')}
                className="flex items-center gap-1"
              >
                Status
                <ArrowUpDown className="h-3 w-3" />
              </Button>
            </TableHead>
            <TableHead className="text-right">Invoice ID</TableHead>
            <TableHead className="text-right">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedInvoices.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={showSmbColumn ? 7 : 6}
                className="text-center text-muted-foreground"
              >
                No invoices found
              </TableCell>
            </TableRow>
          ) : (
            sortedInvoices.map((invoice) => {
              const urgencyColor = getUrgencyColor(invoice.daysUntilDue);
              const needsRepayment = needsRepaymentAction(invoice);
              const isOverdue = invoice.daysUntilDue < 0 && needsRepayment;

              return (
              <TableRow
                key={invoice.id}
                className="cursor-pointer hover:bg-muted/50 transition-colors"
              >
                {showSmbColumn && (
                  <TableCell>
                    {invoice.smb ? (
                      <EntityInfo
                        name={invoice.smb.name}
                        logoUrl={invoice.smb.logoUrl}
                        size="sm"
                      />
                    ) : (
                      <span className="text-muted-foreground text-xs">N/A</span>
                    )}
                  </TableCell>
                )}
                <TableCell>
                  <EntityInfo
                    name={invoice.payer.name}
                    logoUrl={invoice.payer.logoUrl}
                    secondaryInfo={invoice.payer.industry}
                    size="sm"
                  />
                </TableCell>
                <TableCell className="font-semibold">
                  {formatCurrency(invoice.amount)}
                </TableCell>
                <TableCell onClick={(e) => {
                  e.stopPropagation();
                  router.push(`${baseRoute}/${invoice.id}`);
                }}>
                  <div className="space-y-1">
                    <div>{formatDate(invoice.dueDate)}</div>
                    {needsRepayment && !isOverdue && (
                      <UrgencyIndicator
                        daysUntilDue={invoice.daysUntilDue}
                        size="sm"
                        showLabel={true}
                      />
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <InvoiceStatusBadge status={invoice.status} />
                </TableCell>
                <TableCell className="text-right" onClick={(e) => {
                  e.stopPropagation();
                  router.push(`${baseRoute}/${invoice.id}`);
                }}>
                  <div className="flex items-center justify-end">
                    <CopyableText text={invoice.invoiceNumber} />
                  </div>
                </TableCell>
                <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                  {needsRepayment && onRepaymentClick ? (
                    <Button
                      size="sm"
                      variant="outline"
                      className={isOverdue ? 'text-xs bg-red-100 text-red-700 border-red-200 hover:bg-red-200 hover:text-red-800 hover:border-red-300 dark:bg-red-900/30 dark:text-red-400 dark:border-red-900 dark:hover:bg-red-900/50 dark:hover:text-red-300' : 'text-xs'}
                      onClick={(e) => {
                        e.stopPropagation();
                        onRepaymentClick(invoice);
                      }}
                    >
                      Pay Now
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-xs"
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`${baseRoute}/${invoice.id}`);
                      }}
                    >
                      View
                    </Button>
                  )}
                </TableCell>
              </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}
