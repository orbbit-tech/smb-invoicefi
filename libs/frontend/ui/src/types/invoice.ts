// Invoice types based on on-chain smart contract states and application workflow
// Primary blockchain statuses: LISTED, FULLY_FUNDED, FULLY_PAID, DEFAULTED, SETTLED
// Application workflow statuses: SUBMITTED, OVERDUE (computed from due date + grace period)

// SMB App Display Statuses (7):
// 1. SUBMITTED - Invoice submitted, pending approval
// 2. LISTED - Approved and visible in marketplace
// 3. FULLY_FUNDED (displayed as "FUNDED") - Investor deposited USDC, SMB received payment
// 4. OVERDUE - Past due date + grace period (computed state)
// 5. FULLY_PAID - Payer has paid the invoice
// 6. SETTLED - Final settlement completed
// 7. DEFAULTED - Invoice defaulted

// Investor App Display Statuses (5):
// 1. FULLY_FUNDED (displayed as "FUNDED") - Investment is active
// 2. OVERDUE - Invoice past due (risk indicator)
// 3. FULLY_PAID - Payer paid the invoice
// 4. SETTLED - Yield distributed, position closed
// 5. DEFAULTED - Invoice defaulted

export enum InvoiceStatus {
  SUBMITTED = 'SUBMITTED',
  LISTED = 'LISTED',
  FULLY_FUNDED = 'FULLY_FUNDED',
  OVERDUE = 'OVERDUE',
  FULLY_PAID = 'FULLY_PAID',
  SETTLED = 'SETTLED',
  DEFAULTED = 'DEFAULTED',
  // Legacy statuses (deprecated - for backwards compatibility)
  CREATED = 'CREATED',
  DISBURSED = 'DISBURSED',
  PENDING_REPAYMENT = 'PENDING_REPAYMENT',
  REPAID = 'REPAID',
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
  availableStatuses: InvoiceStatus[]; // Required: Which statuses to show in filter dropdown and Kanban columns
}
