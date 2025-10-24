'use client';

import { use } from 'react';
import { useInvoice } from '@/hooks/api';
import { InvoiceDetailClient } from '@/components/invoices/invoice-detail-client';
import { mapApiInvoiceToFrontend } from '@/lib/invoice-mapper';
import { Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@ui';

// TODO: Replace with actual organizationId from auth context
const TEMP_ORGANIZATION_ID = 'org_gallivant';

export default function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const { data: apiInvoice, isLoading, error } = useInvoice(id, TEMP_ORGANIZATION_ID);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-2">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Loading invoice details...</p>
        </div>
      </div>
    );
  }

  if (error || !apiInvoice) {
    return (
      <div className="max-w-4xl mx-auto py-8">
        <Alert variant="destructive">
          <AlertDescription>
            Failed to load invoice details. Please try again or return to the invoices list.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const invoice = mapApiInvoiceToFrontend(apiInvoice);

  return <InvoiceDetailClient invoice={invoice} />;
}
