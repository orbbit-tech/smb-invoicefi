'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@ui';
import { Button } from '@ui';
import { Invoice } from '@/types/invoice';
import { InvoiceStatusBadge } from './invoice-status-badge';
import { CopyableText } from '../ui/copyable-text';
import { ArrowUpDown } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface InvoiceTableViewProps {
  invoices: Invoice[];
}

type SortField = 'invoiceNumber' | 'amount' | 'dueDate' | 'status';
type SortDirection = 'asc' | 'desc';

export function InvoiceTableView({ invoices }: InvoiceTableViewProps) {
  const router = useRouter();
  const [sortField, setSortField] = useState<SortField>('dueDate');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

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
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(date);
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
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
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedInvoices.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={5}
                className="text-center text-muted-foreground"
              >
                No invoices found
              </TableCell>
            </TableRow>
          ) : (
            sortedInvoices.map((invoice) => (
              <TableRow
                key={invoice.id}
                onClick={() => router.push(`/invoices/${invoice.id}`)}
                className="cursor-pointer hover:bg-muted/50 transition-colors"
              >
                <TableCell>
                  <div>
                    <div className="font-medium">{invoice.payer.name}</div>
                    {invoice.payer.industry && (
                      <div className="text-xs text-muted-foreground">
                        {invoice.payer.industry}
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell className="font-semibold">
                  {formatCurrency(invoice.amount)}
                </TableCell>
                <TableCell>
                  <div>
                    <div>{formatDate(invoice.dueDate)}</div>
                    {!['SETTLED', 'REPAID', 'FULLY_PAID', 'DEFAULTED'].includes(
                      invoice.status
                    ) && (
                      <div className="text-xs text-muted-foreground">
                        {invoice.daysUntilDue} days
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <InvoiceStatusBadge status={invoice.status} />
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end">
                    <CopyableText text={invoice.invoiceNumber} />
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
