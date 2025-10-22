import { NotFoundException } from '@nestjs/common';
import { MarketplaceService } from './marketplace.service';
import { MarketplaceRepository } from './marketplace.repository';
import { mockInvoice, mockOrganization, mockPayer } from '../../test/test-utils';

describe('MarketplaceService', () => {
  let service: MarketplaceService;
  let repository: jest.Mocked<MarketplaceRepository>;

  beforeEach(() => {
    repository = {
      list: jest.fn(),
      findById: jest.fn(),
    } as any;

    service = new MarketplaceService(repository);
  });

  describe('list', () => {
    it('should return marketplace invoices with calculated APY', async () => {
      const mockResult = {
        invoices: [
          {
            ...mockInvoice,
            lifecycleStatus: 'LISTED',
            issuerId: mockOrganization.id,
            issuerName: mockOrganization.name,
            issuerLegalName: mockOrganization.legalName,
            payerId: mockPayer.id,
            payerName: mockPayer.name,
            payerCreditScore: mockPayer.creditScore,
            payerIndustry: mockPayer.industry,
            payerPaymentTermsDays: mockPayer.paymentTermsDays,
            nftTokenId: null,
          },
        ],
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
      };

      repository.list.mockResolvedValue(mockResult);

      const result = await service.listInvoices();

      expect(result.data).toHaveLength(1);
      expect(result.data[0].amount).toBe(1000000);

      // Check APY calculation (36.5% APR, 30 days period)
      expect(result.data[0].apy).toBeGreaterThan(0);

      // Check discount rate (500 bps = 5%)
      expect(result.data[0].discountRateBps).toBe(500);

      // Check expected return (5% of 1M = 50000)
      expect(result.data[0].expectedReturn).toBe(50000);

      expect(result.meta.total).toBe(1);
    });

    it('should handle filters correctly', async () => {
      repository.list.mockResolvedValue({
        invoices: [],
        total: 0,
        page: 1,
        limit: 20,
        totalPages: 0,
      });

      await service.listInvoices(
        'LOW',      // riskScore
        1000,       // minApr
        5000,       // maxApr
        undefined,  // minAmount
        undefined,  // maxAmount
        'Acme',     // search
        2,          // page
        50          // limit
      );

      expect(repository.list).toHaveBeenCalledWith({
        riskScore: 'LOW',
        minApr: 1000,
        maxApr: 5000,
        minAmount: undefined,
        maxAmount: undefined,
        search: 'Acme',
        page: 2,
        limit: 50,
        sortBy: undefined,
        sortOrder: undefined,
      });
    });

    it('should calculate correct discount rate from basis points', async () => {
      const invoiceWith10PercentDiscount = {
        ...mockInvoice,
        discountRateBps: '1000', // 10%
        lifecycleStatus: 'LISTED',
        issuerId: 'org-123',
        issuerName: 'Test',
        issuerLegalName: 'Test Inc',
        payerId: 'payer-123',
        payerName: 'Payer',
        payerCreditScore: 'A',
        payerIndustry: 'Tech',
        payerPaymentTermsDays: 30,
        nftTokenId: null,
      };

      repository.list.mockResolvedValue({
        invoices: [invoiceWith10PercentDiscount],
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
      });

      const result = await service.listInvoices();

      expect(result.data[0].discountRateBps).toBe(1000); // 10% = 1000 bps
      expect(result.data[0].expectedReturn).toBe(100000); // $100k
    });
  });

  describe('getById', () => {
    it('should return detailed marketplace invoice', async () => {
      const mockDetail = {
        invoice: {
          ...mockInvoice,
          lifecycleStatus: 'LISTED',
          issuerId: mockOrganization.id,
          issuerName: mockOrganization.name,
          issuerLegalName: mockOrganization.legalName,
          payerId: mockPayer.id,
          payerName: mockPayer.name,
          payerCreditScore: mockPayer.creditScore,
          payerIndustry: mockPayer.industry,
          payerPaymentTermsDays: mockPayer.paymentTermsDays,
          nftTokenId: null,
        },
        documents: [],
        underwriting: {
          id: 'underwriting-123',
          invoiceId: 'invoice-123',
          underwriterId: 'underwriter-1',
          decision: 'APPROVED',
          decisionReason: 'Low risk profile',
          assessedRiskScore: 'LOW',
          fraudCheckStatus: 'PASSED',
          payerVerificationStatus: 'VERIFIED',
          approvedAmountCents: '1000000',
          approvedAprBps: '3650',
          notes: null,
          completedAt: '1704067200',
          createdAt: new Date('2024-01-01'),
          updatedAt: null,
          deletedAt: null,
        },
      };

      repository.findById.mockResolvedValue(mockDetail);

      const result = await service.getInvoiceDetail('invoice-123');

      expect(result.id).toBe('invoice-123');
      expect(result.issuer.name).toBe('Test SMB');
      expect(result.payer.name).toBe('Acme Corp');
      expect(result.underwriting).toBeDefined();
    });

    it('should throw NotFoundException when invoice not found', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(service.getInvoiceDetail('invalid')).rejects.toThrow(
        NotFoundException
      );
    });

    it('should handle invoice without underwriting', async () => {
      const mockDetail = {
        invoice: {
          ...mockInvoice,
          lifecycleStatus: 'LISTED',
          issuerId: 'org-123',
          issuerName: 'Company',
          issuerLegalName: 'Company Inc',
          payerId: 'payer-123',
          payerName: 'Payer',
          payerCreditScore: 'B',
          payerIndustry: 'Finance',
          payerPaymentTermsDays: 45,
          nftTokenId: null,
        },
        documents: [],
        underwriting: null,
      };

      repository.findById.mockResolvedValue(mockDetail);

      const result = await service.getInvoiceDetail('invoice-123');

      expect(result.id).toBe('invoice-123');
      expect(result.underwriting).toEqual({});
    });
  });
});
