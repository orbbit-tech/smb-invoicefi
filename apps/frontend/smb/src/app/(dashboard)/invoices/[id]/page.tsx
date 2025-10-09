import { notFound } from 'next/navigation';
import { getInvoiceById } from '@/data/mock-invoices';
import { InvoiceDetailClient } from '@/components/invoices/invoice-detail-client';

export default async function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const invoice = getInvoiceById(id);

  if (!invoice) {
    notFound();
  }

  return <InvoiceDetailClient invoice={invoice} />;
}
