/**
 * Shared TypeScript types for Invoice Detail components
 * Used across SMB and Investor applications
 */

export interface InvoiceDetailData {
  // Core invoice information
  id: string | number;
  invoiceNumber?: string;
  amount: number;
  dueDate: string | Date;
  createdDate?: string | Date;

  // Company information
  companyName: string;
  companyLogoUrl?: string;

  // Payer information
  payerName: string;
  payerLogoUrl?: string;
  payerIndustry?: string;

  // Financial details
  apr: number;
  discountRate: number;
  daysUntilDue: number;
  expectedReturn?: number;

  // Risk & Category
  riskScore?: 'Low' | 'Medium' | 'High';
  category?: string;
  industry?: string;

  // Status & Dates
  status?: string;
  disbursedDate?: string | Date;
  repaidDate?: string | Date;
  fundingDate?: string | Date;
  settlementDate?: string | Date;

  // Blockchain/NFT fields (optional)
  tokenId?: string;
  contractAddress?: string;
  blockchainTxHash?: string;

  // Additional fields
  description?: string;
  funded?: number;
  actualReturn?: number;
  paymentsMade?: Array<{
    date: string;
    amount: number;
  }>;
}

export interface PayerHistoryData {
  paymentHistory?: string;
  totalInvoicesPaid?: number;
  averagePaymentTime?: number;
}

export interface RiskFactors {
  factors?: string[];
}
