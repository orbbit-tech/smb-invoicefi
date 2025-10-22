/**
 * Test utilities and mocks
 */

import { Kysely } from 'kysely';
import type Database from '../../../../src/types/db/Database';

/**
 * Create a mock Kysely instance for testing
 */
export function createMockKysely(): jest.Mocked<Kysely<Database>> {
  const mockQuery = {
    selectFrom: jest.fn().mockReturnThis(),
    innerJoin: jest.fn().mockReturnThis(),
    leftJoin: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    selectAll: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    offset: jest.fn().mockReturnThis(),
    execute: jest.fn(),
    executeTakeFirst: jest.fn(),
    executeTakeFirstOrThrow: jest.fn(),
    insertInto: jest.fn().mockReturnThis(),
    values: jest.fn().mockReturnThis(),
    returningAll: jest.fn().mockReturnThis(),
    updateTable: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
    deleteFrom: jest.fn().mockReturnThis(),
    transaction: jest.fn().mockReturnThis(),
  };

  return mockQuery as any;
}

/**
 * Mock invoice data for testing
 */
export const mockInvoice = {
  id: 'invoice-123',
  organizationId: 'org-123',
  payerCompanyId: 'payer-123',
  amountCents: '1000000',
  aprBps: '3650',
  discountRateBps: '500',
  invoiceNumber: 'INV-001',
  invoiceDate: '1704067200',
  dueAt: '9999999999', // Far future date for testing
  lifecycleStatus: 'DRAFT',
  onChainStatus: null,
  riskScore: 'LOW',
  description: 'Test invoice',
  metadataUri: null,
  createdAt: new Date('2024-01-01'),
  updatedAt: null,
  deletedAt: null,
};

/**
 * Mock payer data for testing
 */
export const mockPayer = {
  id: 'payer-123',
  name: 'Acme Corp',
  legalName: 'Acme Corporation',
  industry: 'Technology',
  creditScore: 'A',
  paymentTermsDays: 30,
  createdAt: new Date('2024-01-01'),
  updatedAt: null,
  deletedAt: null,
};

/**
 * Mock organization data for testing
 */
export const mockOrganization = {
  id: 'org-123',
  name: 'Test SMB',
  legalName: 'Test SMB Inc',
  taxId: '12-3456789',
  walletAddress: '0x1234567890abcdef',
  timezone: 'America/Los_Angeles',
  email: 'test@testsmb.com',
  phone: '+1234567890',
  addressLine1: '123 Main St',
  addressLine2: null,
  city: 'San Francisco',
  state: 'CA',
  postalCode: '94105',
  country: 'US',
  countryCode: 'US',
  addressCity: 'San Francisco',
  addressState: 'CA',
  addressPostalCode: '94105',
  addressCountry: 'US',
  kybStatus: 'APPROVED',
  kybCompletedAt: '1704067200',
  isWhitelisted: true,
  whitelistedAt: '1704067200',
  createdAt: new Date('2024-01-01'),
  updatedAt: null,
  deletedAt: null,
};

/**
 * Mock user data for testing
 */
export const mockUser = {
  id: 'user-123',
  email: 'investor@test.com',
  walletAddress: '0xabcdef1234567890',
  firstName: 'John',
  lastName: 'Investor',
  kycStatus: 'APPROVED',
  isWhitelisted: true,
  isAccreditedInvestor: true,
  createdAt: new Date('2024-01-01'),
  updatedAt: null,
  deletedAt: null,
};

/**
 * Mock NFT data for testing
 */
export const mockNft = {
  id: 'nft-123',
  invoiceId: 'invoice-123',
  tokenId: '42',
  contractAddress: '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512',
  ownerAddress: '0xabcdef1234567890',
  mintedAt: '1704067200',
  mintedTxHash: '0x123abc',
  chainId: 84532,
  createdAt: new Date('2024-01-01'),
  updatedAt: null,
  deletedAt: null,
};

/**
 * Mock investor position data for testing
 */
export const mockInvestorPosition = {
  id: 'position-123',
  userId: 'user-123',
  invoiceId: 'invoice-123',
  nftId: 'nft-123',
  principalAmountCents: '1000000',
  expectedReturnCents: '50000',
  aprBps: '3650',
  fundedAt: '1704067200',
  maturityDate: '1706659200',
  positionStatus: 'ACTIVE',
  createdAt: new Date('2024-01-01'),
  updatedAt: null,
  deletedAt: null,
};
