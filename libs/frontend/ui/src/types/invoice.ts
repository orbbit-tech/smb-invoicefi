// Invoice types based on on-chain smart contract states and application workflow
// Primary blockchain statuses: LISTED, FULLY_FUNDED, FULLY_PAID, DEFAULTED, SETTLED
// Application workflow statuses: CREATED, DISBURSED, PENDING_REPAYMENT, REPAID

export enum InvoiceStatus {
  CREATED = 'CREATED',
  LISTED = 'LISTED',
  FULLY_FUNDED = 'FULLY_FUNDED',
  DISBURSED = 'DISBURSED',
  PENDING_REPAYMENT = 'PENDING_REPAYMENT',
  FULLY_PAID = 'FULLY_PAID',
  REPAID = 'REPAID',
  DEFAULTED = 'DEFAULTED',
  SETTLED = 'SETTLED',
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  amount: number; // in USD
  dueDate: Date;
  createdDate: Date;
  payer: {
    name: string;
    industry?: string;
    logoUrl?: string;
  };
  // SMB information (optional - only present in investor views)
  smb?: {
    name: string;
    logoUrl?: string;
  };
  status: InvoiceStatus;
  apr: number;
  daysUntilDue: number;
  disbursedDate?: Date;
  repaidDate?: Date;
  description?: string;
  // Blockchain/NFT fields (optional - only present when invoice is tokenized)
  tokenId?: string;
  contractAddress?: string;
  blockchainTxHash?: string;
}

export interface InvoiceMetrics {
  totalInvoicesSubmitted: number;
  activeFundingAmount: number;
  totalFundedToDate: number;
  pendingRepayments: number;
}

export type ViewType = 'table' | 'kanban' | 'gantt' | 'gallery';

export interface InvoiceMultiViewConfig {
  showSmbColumn?: boolean; // Whether to show SMB name/logo column
  availableStatuses?: InvoiceStatus[]; // Which statuses to show in filter dropdown
}
