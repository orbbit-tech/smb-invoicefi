// Invoice types based on PRD Section 6.7 - Invoice Lifecycle State Machine

export enum InvoiceStatus {
  CREATED = 'CREATED',
  LISTED = 'LISTED',
  PARTIALLY_FUNDED = 'PARTIALLY_FUNDED',
  FULLY_FUNDED = 'FULLY_FUNDED',
  DISBURSED = 'DISBURSED',
  PENDING_REPAYMENT = 'PENDING_REPAYMENT',
  REPAID = 'REPAID',
  OVERDUE = 'OVERDUE',
  UNDER_COLLECTION = 'UNDER_COLLECTION',
  DEFAULTED = 'DEFAULTED',
}

export enum RiskScore {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
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
  };
  riskScore: RiskScore;
  status: InvoiceStatus;
  fundingProgress: number; // 0-100 percentage
  fundedAmount: number; // Amount funded so far in USD
  apy: number; // Annual Percentage Yield
  daysUntilDue: number;
  disbursedDate?: Date;
  repaidDate?: Date;
  description?: string;
}

export interface InvoiceMetrics {
  totalInvoicesSubmitted: number;
  activeFundingAmount: number;
  totalFundedToDate: number;
  pendingRepayments: number;
}
