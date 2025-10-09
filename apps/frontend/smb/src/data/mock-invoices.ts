import { Invoice, InvoiceStatus, RiskScore, InvoiceMetrics } from '@/types/invoice';

// Helper function to calculate days until due
const getDaysUntilDue = (dueDate: Date): number => {
  const today = new Date();
  const diffTime = dueDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

// Mock invoices with various states from PRD
export const mockInvoices: Invoice[] = [
  {
    id: 'inv-001',
    invoiceNumber: 'INV-2024-001',
    amount: 50000,
    dueDate: new Date('2025-12-15'),
    createdDate: new Date('2025-10-01'),
    payer: {
      name: 'Microsoft Corporation',
      industry: 'Technology',
    },
    riskScore: RiskScore.LOW,
    status: InvoiceStatus.REPAID,
    fundingProgress: 100,
    fundedAmount: 50000,
    apy: 12.5,
    daysUntilDue: getDaysUntilDue(new Date('2025-12-15')),
    disbursedDate: new Date('2025-10-03'),
    repaidDate: new Date('2025-12-14'),
    description: 'Software consulting services - Q4 2024',
  },
  {
    id: 'inv-002',
    invoiceNumber: 'INV-2024-002',
    amount: 35000,
    dueDate: new Date('2025-11-30'),
    createdDate: new Date('2025-10-05'),
    payer: {
      name: 'Salesforce Inc',
      industry: 'SaaS',
    },
    riskScore: RiskScore.LOW,
    status: InvoiceStatus.PENDING_REPAYMENT,
    fundingProgress: 100,
    fundedAmount: 35000,
    apy: 10.2,
    daysUntilDue: getDaysUntilDue(new Date('2025-11-30')),
    disbursedDate: new Date('2025-10-06'),
    description: 'Implementation and training services',
  },
  {
    id: 'inv-003',
    invoiceNumber: 'INV-2024-003',
    amount: 25000,
    dueDate: new Date('2025-11-15'),
    createdDate: new Date('2025-10-06'),
    payer: {
      name: 'Adobe Systems',
      industry: 'Software',
    },
    riskScore: RiskScore.LOW,
    status: InvoiceStatus.FULLY_FUNDED,
    fundingProgress: 100,
    fundedAmount: 25000,
    apy: 11.0,
    daysUntilDue: getDaysUntilDue(new Date('2025-11-15')),
    description: 'Creative services for marketing campaign',
  },
  {
    id: 'inv-004',
    invoiceNumber: 'INV-2024-004',
    amount: 42000,
    dueDate: new Date('2025-12-01'),
    createdDate: new Date('2025-10-07'),
    payer: {
      name: 'Shopify Inc',
      industry: 'E-commerce',
    },
    riskScore: RiskScore.MEDIUM,
    status: InvoiceStatus.PARTIALLY_FUNDED,
    fundingProgress: 65,
    fundedAmount: 27300,
    apy: 13.5,
    daysUntilDue: getDaysUntilDue(new Date('2025-12-01')),
    description: 'E-commerce platform integration',
  },
  {
    id: 'inv-005',
    invoiceNumber: 'INV-2024-005',
    amount: 18000,
    dueDate: new Date('2025-11-20'),
    createdDate: new Date('2025-10-08'),
    payer: {
      name: 'Stripe Inc',
      industry: 'FinTech',
    },
    riskScore: RiskScore.LOW,
    status: InvoiceStatus.LISTED,
    fundingProgress: 25,
    fundedAmount: 4500,
    apy: 9.8,
    daysUntilDue: getDaysUntilDue(new Date('2025-11-20')),
    description: 'Payment gateway integration services',
  },
  {
    id: 'inv-006',
    invoiceNumber: 'INV-2024-006',
    amount: 62000,
    dueDate: new Date('2025-12-20'),
    createdDate: new Date('2025-10-08'),
    payer: {
      name: 'Oracle Corporation',
      industry: 'Enterprise Software',
    },
    riskScore: RiskScore.MEDIUM,
    status: InvoiceStatus.LISTED,
    fundingProgress: 0,
    fundedAmount: 0,
    apy: 14.2,
    daysUntilDue: getDaysUntilDue(new Date('2025-12-20')),
    description: 'Database migration and optimization',
  },
  {
    id: 'inv-007',
    invoiceNumber: 'INV-2024-007',
    amount: 28500,
    dueDate: new Date('2025-11-10'),
    createdDate: new Date('2025-09-25'),
    payer: {
      name: 'HubSpot Inc',
      industry: 'Marketing Automation',
    },
    riskScore: RiskScore.LOW,
    status: InvoiceStatus.DISBURSED,
    fundingProgress: 100,
    fundedAmount: 28500,
    apy: 10.5,
    daysUntilDue: getDaysUntilDue(new Date('2025-11-10')),
    disbursedDate: new Date('2025-09-27'),
    description: 'CRM customization and support',
  },
  {
    id: 'inv-008',
    invoiceNumber: 'INV-2024-008',
    amount: 15000,
    dueDate: new Date('2025-11-05'),
    createdDate: new Date('2025-10-01'),
    payer: {
      name: 'Twilio Inc',
      industry: 'Communications',
    },
    riskScore: RiskScore.LOW,
    status: InvoiceStatus.CREATED,
    fundingProgress: 0,
    fundedAmount: 0,
    apy: 11.8,
    daysUntilDue: getDaysUntilDue(new Date('2025-11-05')),
    description: 'SMS and voice API integration',
  },
];

// Calculate metrics from mock data
export const getMockMetrics = (): InvoiceMetrics => {
  const totalInvoicesSubmitted = mockInvoices.length;

  const activeFundingAmount = mockInvoices
    .filter(inv =>
      [InvoiceStatus.LISTED, InvoiceStatus.PARTIALLY_FUNDED, InvoiceStatus.FULLY_FUNDED].includes(inv.status)
    )
    .reduce((sum, inv) => sum + inv.amount, 0);

  const totalFundedToDate = mockInvoices
    .filter(inv => inv.fundedAmount > 0)
    .reduce((sum, inv) => sum + inv.fundedAmount, 0);

  const pendingRepayments = mockInvoices
    .filter(inv =>
      [InvoiceStatus.PENDING_REPAYMENT, InvoiceStatus.DISBURSED].includes(inv.status)
    )
    .reduce((sum, inv) => sum + inv.amount, 0);

  return {
    totalInvoicesSubmitted,
    activeFundingAmount,
    totalFundedToDate,
    pendingRepayments,
  };
};

// Helper functions for filtering and sorting
export const getInvoicesByStatus = (status: InvoiceStatus): Invoice[] => {
  return mockInvoices.filter(inv => inv.status === status);
};

export const getRecentInvoices = (limit: number = 5): Invoice[] => {
  return [...mockInvoices]
    .sort((a, b) => b.createdDate.getTime() - a.createdDate.getTime())
    .slice(0, limit);
};

export const getInvoiceById = (id: string): Invoice | undefined => {
  return mockInvoices.find(inv => inv.id === id);
};
