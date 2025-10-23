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
import { Invoice, InvoiceMultiViewConfig } from '../../types';
import { InvoiceStatusBadge } from './invoice-status-badge';
import { CopyableText } from './copyable-text';
import { EntityInfo } from './entity-info';
import { ArrowUpDown } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface InvoiceTableViewProps {
  invoices: Invoice[];
  baseRoute?: string;
  config?: InvoiceMultiViewConfig;
}

type SortField = 'invoiceNumber' | 'amount' | 'dueDate' | 'status';
type SortDirection = 'asc' | 'desc';

export function InvoiceTableView({
  invoices,
  baseRoute = '/invoices',
  config,
}: InvoiceTableViewProps) {
  const router = useRouter();
  const [sortField, setSortField] = useState<SortField>('dueDate');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const showSmbColumn = config?.showSmbColumn ?? false;

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
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedInvoices.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={showSmbColumn ? 6 : 5}
                className="text-center text-muted-foreground"
              >
                No invoices found
              </TableCell>
            </TableRow>
          ) : (
            sortedInvoices.map((invoice) => (
              <TableRow
                key={invoice.id}
                onClick={() => router.push(`${baseRoute}/${invoice.id}`)}
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
