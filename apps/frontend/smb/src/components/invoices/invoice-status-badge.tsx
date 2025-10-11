'use client';

import { Badge } from '@ui';
import { InvoiceStatus } from '@/types/invoice';

interface InvoiceStatusBadgeProps {
  status: InvoiceStatus;
  className?: string;
}

export function InvoiceStatusBadge({
  status,
  className,
}: InvoiceStatusBadgeProps) {
  return (
    <Badge variant="outline" className="bg-muted">
      {status}
    </Badge>
  );
}
