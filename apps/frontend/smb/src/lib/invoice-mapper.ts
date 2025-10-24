/**
 * Invoice Mapper
 *
 * Maps between backend API types and frontend Invoice types
 */

import { InvoiceDto } from '@api-client';
import { Invoice, InvoiceStatus } from '@ui';

/**
 * Calculate days until due date from Unix timestamp
 */
function calculateDaysUntilDue(dueAtTimestamp: number): number {
  const dueDate = new Date(dueAtTimestamp * 1000);
  const today = new Date();
  const diffTime = dueDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

/**
 * Map backend lifecycleStatus string to frontend InvoiceStatus enum
 */
function mapLifecycleStatusToInvoiceStatus(lifecycleStatus: string): InvoiceStatus {
  // Backend uses uppercase strings like 'DRAFT', 'SUBMITTED', 'LISTED', etc.
  // Frontend InvoiceStatus enum matches these values
  const statusMap: Record<string, InvoiceStatus> = {
    'DRAFT': InvoiceStatus.CREATED, // Legacy mapping for backwards compatibility
    'SUBMITTED': InvoiceStatus.SUBMITTED,
    'LISTED': InvoiceStatus.LISTED,
    'FUNDED': InvoiceStatus.FULLY_FUNDED, // Map 'FUNDED' to FULLY_FUNDED
    'FULLY_FUNDED': InvoiceStatus.FULLY_FUNDED,
    'OVERDUE': InvoiceStatus.OVERDUE,
    'DISBURSED': InvoiceStatus.DISBURSED,
    'PENDING_REPAYMENT': InvoiceStatus.PENDING_REPAYMENT,
    'FULLY_PAID': InvoiceStatus.FULLY_PAID,
    'REPAID': InvoiceStatus.REPAID,
    'DEFAULTED': InvoiceStatus.DEFAULTED,
    'SETTLED': InvoiceStatus.SETTLED,
    // Legacy statuses
    'CREATED': InvoiceStatus.CREATED,
  };

  return statusMap[lifecycleStatus] || InvoiceStatus.SUBMITTED;
}

/**
 * Map backend InvoiceDto to frontend Invoice type
 */
export function mapApiInvoiceToFrontend(apiInvoice: InvoiceDto): Invoice {
  return {
    id: apiInvoice.id,
    invoiceNumber: apiInvoice.invoiceNumber,
    amount: apiInvoice.amount / 1_000_000, // Convert 6-decimal USDC to dollars
    dueDate: new Date(apiInvoice.dueAt * 1000), // Unix timestamp to Date
    createdDate: new Date(apiInvoice.createdAt), // ISO string to Date
    payer: {
      name: apiInvoice.payer.name,
      industry: apiInvoice.payer.industry,
      logoUrl: apiInvoice.payer.logoUrl,
    },
    status: mapLifecycleStatusToInvoiceStatus(apiInvoice.lifecycleStatus),
    apr: apiInvoice.apr / 10_000, // Convert 6-decimal format to percentage (e.g., 365,000 → 36.5%)
    daysUntilDue: calculateDaysUntilDue(apiInvoice.dueAt),
    description: undefined, // Not in current API response
    // Blockchain/NFT fields - will be populated when invoice is tokenized
    // These would come from InvoiceNftDto if present
  };
}

/**
 * Map array of backend InvoiceDtos to frontend Invoice types
 */
export function mapApiInvoicesToFrontend(apiInvoices: InvoiceDto[]): Invoice[] {
  return apiInvoices.map(mapApiInvoiceToFrontend);
}
