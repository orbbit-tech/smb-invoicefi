import { NotFoundException } from '@nestjs/common';
import { PortfolioService } from './portfolio.service';
import { PortfolioRepository } from './portfolio.repository';
import { mockInvestorPosition, mockInvoice, mockNft, mockPayer } from '../../test/test-utils';

describe('PortfolioService', () => {
  let service: PortfolioService;
  let repository: jest.Mocked<PortfolioRepository>;

  beforeEach(() => {
    repository = {
      getSummary: jest.fn(),
      getPositions: jest.fn(),
      getPositionById: jest.fn(),
    } as any;

    service = new PortfolioService(repository);
  });

  describe('getSummary', () => {
    it('should return portfolio summary with calculated gains', async () => {
      const mockPositions = [
        {
          positionStatus: 'ACTIVE',
          fundedAmount: '1000000',
          expectedRepayment: '1050000',
          investorYield: null,
          settledAt: null,
        },
        {
          positionStatus: 'SETTLED',
          fundedAmount: '2000000',
          expectedRepayment: '2100000',
          investorYield: '110000',
          settledAt: '1706659200',
        },
      ];

      repository.getSummary.mockResolvedValue(mockPositions as any);

      const result = await service.getSummary('0x123');

      expect(result.totalInvested).toBe(3000000);
      expect(result.activePositionsCount).toBe(1);
      expect(result.settledPositionsCount).toBe(1);
      expect(result.totalRealizedGains).toBe(110000);
      expect(result.averageApy).toBeGreaterThan(0);
    });

    it('should handle zero investments', async () => {
      repository.getSummary.mockResolvedValue([]);

      const result = await service.getSummary('0x456');

      expect(result.totalInvested).toBe(0);
      expect(result.activePositionsCount).toBe(0);
      expect(result.totalRealizedGains).toBe(0);
      expect(result.averageApy).toBe(0);
    });
  });

  describe('getPositions', () => {
    it('should return paginated positions with correct DTO transformation', async () => {
      const mockPosition = {
        id: 'position-123',
        userId: 'user-123',
        nftId: 'nft-123',
        principalAmountCents: '1000000',
        expectedReturnCents: '50000',
        actualReturnCents: null,
        aprBps: '500',
        positionStatus: 'ACTIVE',
        createdAt: new Date('2024-01-01'),
        invoiceId: 'invoice-123',
        invoiceNumber: 'INV-001',
        amount: '1000000',
        dueAt: '1706659200',
        lifecycleStatus: 'FULLY_FUNDED',
        riskScore: 'LOW',
        tokenId: '42',
        contractAddress: '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512',
        ownerAddress: '0xabcdef1234567890',
        metadataUri: null,
        fundedAmount: '1000000',
        fundedAt: '1704067200',
        fundingTxHash: '0x123abc',
        expectedRepayment: '1050000',
        expectedReturnBps: '500',
        investorYield: null,
        settledAt: null,
        payerId: 'payer-123',
        payerName: 'Acme Corp',
        payerCreditScore: 'A',
        payerIndustry: 'Technology',
        issuerId: 'org-123',
        issuerName: 'Test SMB',
      } as any;

      repository.getPositions.mockResolvedValue({
        positions: [mockPosition],
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
      });

      const result = await service.getPositions('0x123');

      expect(result.data).toHaveLength(1);
      expect(result.data[0].id).toBe('position-123');
      expect(result.data[0].investment.fundedAmount).toBe(1000000);
      expect(result.data[0].nft.tokenId).toBe('42');
      expect(result.meta.total).toBe(1);
    });

    it('should filter positions by status', async () => {
      repository.getPositions.mockResolvedValue({
        positions: [],
        total: 0,
        page: 1,
        limit: 20,
        totalPages: 0,
      });

      await service.getPositions('0x123', 'ACTIVE', 1, 50);

      expect(repository.getPositions).toHaveBeenCalledWith({
        investorAddress: '0x123',
        status: 'ACTIVE',
        page: 1,
        limit: 50,
      });
    });

    it('should handle multiple positions correctly', async () => {
      const activePosition = {
        id: 'position-123',
        userId: 'user-123',
        nftId: 'nft-123',
        principalAmountCents: '1000000',
        expectedReturnCents: '50000',
        actualReturnCents: null,
        aprBps: '500',
        positionStatus: 'ACTIVE',
        createdAt: new Date('2024-01-01'),
        invoiceId: 'invoice-1',
        invoiceNumber: 'INV-001',
        amount: '1000000',
        dueAt: '1706659200',
        lifecycleStatus: 'FULLY_FUNDED',
        riskScore: 'LOW',
        tokenId: '1',
        contractAddress: '0x123',
        ownerAddress: '0xabc',
        metadataUri: null,
        fundedAmount: '1000000',
        fundedAt: '1704067200',
        fundingTxHash: '0xabc',
        expectedRepayment: '1050000',
        expectedReturnBps: '500',
        investorYield: null,
        settledAt: null,
        payerId: 'payer-1',
        payerName: 'Payer',
        payerCreditScore: 'A',
        payerIndustry: 'Tech',
        issuerId: 'org-1',
        issuerName: 'Company',
      } as any;

      const settledPosition = {
        id: 'position-456',
        userId: 'user-123',
        nftId: 'nft-456',
        principalAmountCents: '2000000',
        expectedReturnCents: '100000',
        actualReturnCents: '110000',
        aprBps: '500',
        positionStatus: 'SETTLED',
        createdAt: new Date('2024-01-01'),
        invoiceId: 'invoice-2',
        invoiceNumber: 'INV-002',
        amount: '2000000',
        dueAt: '1706659200',
        lifecycleStatus: 'REPAID',
        riskScore: 'MEDIUM',
        tokenId: '2',
        contractAddress: '0x456',
        ownerAddress: '0xdef',
        metadataUri: null,
        fundedAmount: '2000000',
        fundedAt: '1704067200',
        fundingTxHash: '0xdef',
        expectedRepayment: '2100000',
        expectedReturnBps: '500',
        investorYield: '110000',
        settledAt: '1706659200',
        payerId: 'payer-2',
        payerName: 'Payer2',
        payerCreditScore: 'B',
        payerIndustry: 'Finance',
        issuerId: 'org-2',
        issuerName: 'Company2',
      } as any;

      repository.getPositions.mockResolvedValue({
        positions: [activePosition, settledPosition],
        total: 2,
        page: 1,
        limit: 20,
        totalPages: 1,
      });

      const result = await service.getPositions('0x123');

      expect(result.data).toHaveLength(2);
      expect(result.data[0].positionStatus).toBe('ACTIVE');
      expect(result.data[1].positionStatus).toBe('SETTLED');
      expect(result.meta.total).toBe(2);
    });
  });

  describe('getPositionById', () => {
    it('should return detailed position', async () => {
      const mockPosition = {
        id: 'position-123',
        userId: 'user-123',
        nftId: 'nft-123',
        principalAmountCents: '1000000',
        expectedReturnCents: '50000',
        actualReturnCents: null,
        aprBps: '500',
        positionStatus: 'ACTIVE',
        createdAt: new Date('2024-01-01'),
        invoiceId: 'invoice-123',
        invoiceNumber: 'INV-001',
        amount: '1000000',
        dueAt: '1706659200',
        lifecycleStatus: 'FULLY_FUNDED',
        riskScore: 'LOW',
        tokenId: '42',
        contractAddress: '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512',
        ownerAddress: '0xabcdef1234567890',
        metadataUri: null,
        fundedAmount: '1000000',
        fundedAt: '1704067200',
        fundingTxHash: '0x123abc',
        expectedRepayment: '1050000',
        expectedReturnBps: '500',
        investorYield: null,
        settledAt: null,
        payerId: 'payer-123',
        payerName: 'Acme Corp',
        payerCreditScore: 'A',
        payerIndustry: 'Technology',
        issuerId: 'org-123',
        issuerName: 'Test SMB',
      } as any;

      repository.getPositionById.mockResolvedValue(mockPosition);

      const result = await service.getPositionById('position-123', '0x123');

      expect(result.id).toBe('position-123');
      expect(result.investment.fundedAmount).toBe(1000000);
      expect(result.investment.expectedRepayment).toBe(1050000);
      expect(result.nft.tokenId).toBe('42');
      expect(result.positionStatus).toBe('ACTIVE');
    });

    it('should throw NotFoundException when position not found', async () => {
      repository.getPositionById.mockResolvedValue(null);

      await expect(
        service.getPositionById('invalid', '0x123')
      ).rejects.toThrow(NotFoundException);
    });
  });
});
