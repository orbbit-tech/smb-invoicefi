import { type InvoiceData } from '@/components/invoices';

/**
 * Mock invoice data - Single source of truth
 * In production, this would come from smart contracts/API
 */
export const MOCK_INVOICES: InvoiceData[] = [
  {
    id: 1,
    companyName: 'Gallivant Ice Cream',
    companyLogoUrl: '/gallivant-ice-cream-logo.png',
    category: 'CPG',
    amount: 5000,
    funded: 2000,
    payerName: 'Walmart',
    payerLogoUrl: '/wallmart-logo.png',
    daysUntilDue: 30,
    apy: 10.5,
    return: 250,
    riskScore: 'Low',
    status: 'active',
    dueDate: '2025-11-01',
    discountRate: 0.05,
  },
  {
    id: 2,
    companyName: 'FreshMart Distributors',
    companyLogoUrl: '/fast-distributor-logo.png',
    category: 'Shipping',
    amount: 8000,
    funded: 2000,
    payerName: 'Amazon',
    payerLogoUrl: '/amazon-logo.png',
    daysUntilDue: 60,
    apy: 10.5,
    return: 400,
    riskScore: 'Low',
    status: 'active',
    dueDate: '2025-12-15',
    discountRate: 0.05,
  },
  {
    id: 3,
    companyName: 'Coastal Beverage Co',
    companyLogoUrl: '/coastal-beverage-co-logo.png',
    category: 'Food & Beverage',
    amount: 15000,
    funded: 8500,
    payerName: 'Costco',
    payerLogoUrl: '/costco-logo.png',
    daysUntilDue: 45,
    apy: 12.8,
    return: 450,
    riskScore: 'Low',
    status: 'active',
    dueDate: '2025-11-24',
    discountRate: 0.03,
  },
  {
    id: 4,
    companyName: 'Urban Apparel Supply',
    companyLogoUrl: '/urban-apparel-logo.png',
    category: 'Retail',
    amount: 22000,
    funded: 15000,
    payerName: 'Target',
    payerLogoUrl: '/target-logo.png',
    daysUntilDue: 60,
    apy: 15.2,
    return: 1540,
    riskScore: 'Medium',
    status: 'active',
    dueDate: '2025-12-19',
    discountRate: 0.07,
  },
  {
    id: 5,
    companyName: 'MediSupply Plus',
    companyLogoUrl: '/medi-supply-logo.png',
    category: 'Healthcare',
    amount: 18500,
    funded: 12000,
    payerName: 'CVS',
    payerLogoUrl: '/cvs-logo.png',
    daysUntilDue: 30,
    apy: 18.3,
    return: 740,
    riskScore: 'Low',
    status: 'active',
    dueDate: '2025-11-09',
    discountRate: 0.04,
  },
  {
    id: 6,
    companyName: 'BuildRight Materials',
    companyLogoUrl: '/build-right-materials-logo.png',
    category: 'Construction',
    amount: 32000,
    funded: 18000,
    payerName: 'Home Depot',
    payerLogoUrl: '/home-depot-logo.png',
    daysUntilDue: 75,
    apy: 13.5,
    return: 1920,
    riskScore: 'Medium',
    status: 'active',
    dueDate: '2026-01-23',
    discountRate: 0.06,
  },
  {
    id: 7,
    companyName: 'Organic Harvest Foods',
    companyLogoUrl: '/organic-harvest-logo.png',
    category: 'Food & Beverage',
    amount: 12500,
    funded: 9000,
    payerName: 'Whole Foods',
    payerLogoUrl: '/whole-foods-logo.png',
    daysUntilDue: 45,
    apy: 11.7,
    return: 375,
    riskScore: 'Low',
    status: 'active',
    dueDate: '2025-11-24',
    discountRate: 0.03,
  },
  {
    id: 8,
    companyName: 'TechGear Wholesale',
    companyLogoUrl: '/tech-gear-wholesale-logo.png',
    category: 'Electronics',
    amount: 28000,
    funded: 5000,
    payerName: 'Best Buy',
    payerLogoUrl: '/best-buy-logo.png',
    daysUntilDue: 60,
    apy: 21.9,
    return: 2240,
    riskScore: 'High',
    status: 'active',
    dueDate: '2025-12-19',
    discountRate: 0.08,
  },
];

/**
 * Helper function to get invoice by ID
 * Useful for detail pages that need to look up a single invoice
 */
export function getInvoiceById(id: string | number): InvoiceData | undefined {
  return MOCK_INVOICES.find(
    (invoice) => invoice.id.toString() === id.toString()
  );
}

/**
 * Helper function to convert invoice array to Record for O(1) lookup
 * Useful when you need frequent lookups by ID
 */
export function getInvoicesAsRecord(): Record<string, InvoiceData> {
  return MOCK_INVOICES.reduce((acc, invoice) => {
    acc[invoice.id.toString()] = invoice;
    return acc;
  }, {} as Record<string, InvoiceData>);
}
