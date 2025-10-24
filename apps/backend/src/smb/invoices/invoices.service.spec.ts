import { NotFoundException, BadRequestException } from '@nestjs/common';
import { InvoicesService } from './invoices.service';
import { InvoicesRepository } from './invoices.repository';
import { mockInvoice, mockPayer } from '../../test/test-utils';

describe('InvoicesService', () => {
  let service: InvoicesService;
  let repository: jest.Mocked<InvoicesRepository>;

  beforeEach(() => {
    repository = {
      list: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      getStatusHistory: jest.fn(),
      insertDocuments: jest.fn(),
    } as any;

    service = new InvoicesService(repository);
  });

  describe('list', () => {
    it('should return paginated invoices with correct DTO transformation', async () => {
      const mockResult = {
        invoices: [
          {
            ...mockInvoice,
            payerId: mockPayer.id,
            payerName: mockPayer.name,
            payerCreditScore: mockPayer.creditScore,
            payerIndustry: mockPayer.industry,
            payerLogoUrl: mockPayer.logoUrl,
          },
        ],
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
      };

      repository.list.mockResolvedValue(mockResult);

      const result = await service.list('org-123');

      expect(result.data).toHaveLength(1);
      expect(result.data[0].id).toBe('invoice-123');
      expect(result.data[0].amount).toBe(10000000000);
      expect(result.data[0].payer.name).toBe('Acme Corp');
      expect(result.meta.total).toBe(1);
      expect(result.meta.totalPages).toBe(1);
    });

    it('should pass filters to repository', async () => {
      repository.list.mockResolvedValue({
        invoices: [],
        total: 0,
        page: 1,
        limit: 20,
        totalPages: 0,
      });

      await service.list('org-123', 'LISTED', 'INV', 2, 50, 'createdAt', 'asc');

      expect(repository.list).toHaveBeenCalledWith({
        organizationId: 'org-123',
        status: 'LISTED',
        search: 'INV',
        page: 2,
        limit: 50,
        sortBy: 'createdAt',
        sortOrder: 'asc',
      });
    });
  });

  describe('getById', () => {
    it('should return detailed invoice with all nested data', async () => {
      const mockResult = {
        invoice: {
          ...mockInvoice,
          payerId: mockPayer.id,
          payerName: mockPayer.name,
          payerCreditScore: mockPayer.creditScore,
          payerIndustry: mockPayer.industry,
          payerLogoUrl: mockPayer.logoUrl,
          nftTokenId: '42',
          nftContractAddress: '0x123',
          nftOwnerAddress: '0xabc',
          nftMintedAt: '1704067200',
          nftMintedTxHash: '0x456',
        },
        documents: [],
        statusHistory: [
          {
            id: 'history-1',
            invoiceId: 'invoice-123',
            fromStatus: '',
            toStatus: 'DRAFT',
            changedBy: 'system',
            changedAt: '1704067200',
            reason: 'Created',
            metadata: null,
            createdAt: new Date('2024-01-01'),
          },
        ],
      };

      repository.findById.mockResolvedValue(mockResult);

      const result = await service.getById('invoice-123', 'org-123');

      expect(result.id).toBe('invoice-123');
      expect(result.nft).toBeDefined();
      expect(result.nft?.tokenId).toBe('42');
      expect(result.documents).toEqual([]);
      expect(result.statusHistory).toHaveLength(1);
      expect(repository.findById).toHaveBeenCalledWith('invoice-123', 'org-123');
    });

    it('should throw NotFoundException when invoice not found', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(service.getById('invalid', 'org-123')).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe('create', () => {
    it('should create invoice and return full details', async () => {
      const createDto = {
        payerCompanyId: 'payer-123',
        amount: 10000000000,
        invoiceNumber: 'INV-001',
        invoiceDate: 1704067200,
        dueAt: 1706659200,
        description: 'Test invoice',
      };

      repository.create.mockResolvedValue(mockInvoice);
      repository.findById.mockResolvedValue({
        invoice: {
          ...mockInvoice,
          payerId: 'payer-123',
          payerName: 'Acme Corp',
          payerCreditScore: 'A',
          payerIndustry: 'Technology',
          payerLogoUrl: null,
          nftTokenId: null,
          nftContractAddress: null,
          nftOwnerAddress: null,
          nftMintedAt: null,
          nftMintedTxHash: null,
        },
        documents: [],
        statusHistory: [],
      });

      const result = await service.create('org-123', createDto);

      expect(result.id).toBe('invoice-123');
      expect(repository.create).toHaveBeenCalledWith({
        organizationId: 'org-123',
        payerCompanyId: 'payer-123',
        amount: '10000000000',
        invoiceNumber: 'INV-001',
        invoiceDate: '1704067200',
        dueAt: '1706659200',
        description: 'Test invoice',
      });
    });

    it('should insert documents when provided', async () => {
      const createDto = {
        payerCompanyId: 'payer-123',
        amount: 1000000,
        invoiceNumber: 'INV-001',
        invoiceDate: 1704067200,
        dueAt: 1706659200,
        documents: [
          {
            documentType: 'INVOICE_PDF',
            fileUrl: 'https://example.com/doc.pdf',
            fileName: 'invoice.pdf',
            fileSizeBytes: 12345,
            mimeType: 'application/pdf',
          },
        ],
      };

      repository.create.mockResolvedValue(mockInvoice);
      repository.insertDocuments.mockResolvedValue([]);
      repository.findById.mockResolvedValue({
        invoice: {
          ...mockInvoice,
          payerId: 'payer-123',
          payerName: 'Acme Corp',
          payerCreditScore: 'A',
          payerIndustry: 'Technology',
          payerLogoUrl: null,
          nftTokenId: null,
          nftContractAddress: null,
          nftOwnerAddress: null,
          nftMintedAt: null,
          nftMintedTxHash: null,
        },
        documents: [],
        statusHistory: [],
      });

      await service.create('org-123', createDto);

      expect(repository.insertDocuments).toHaveBeenCalledWith(
        'invoice-123',
        createDto.documents
      );
    });
  });

  describe('update', () => {
    it('should update invoice and return updated details', async () => {
      const updateDto = {
        amount: 20000000000,
        description: 'Updated',
      };

      repository.update.mockResolvedValue(mockInvoice);
      repository.findById.mockResolvedValue({
        invoice: {
          ...mockInvoice,
          amount: '20000000000',
          payerId: 'payer-123',
          payerName: 'Acme Corp',
          payerCreditScore: 'A',
          payerIndustry: 'Technology',
          payerLogoUrl: null,
          nftTokenId: null,
          nftContractAddress: null,
          nftOwnerAddress: null,
          nftMintedAt: null,
          nftMintedTxHash: null,
        },
        documents: [],
        statusHistory: [],
      });

      const result = await service.update('invoice-123', 'org-123', updateDto);

      expect(repository.update).toHaveBeenCalledWith('invoice-123', 'org-123', {
        amount: '20000000000',
        description: 'Updated',
      });
    });

    it('should throw BadRequestException when update fails', async () => {
      repository.update.mockResolvedValue(null);

      await expect(
        service.update('invoice-123', 'org-123', { amount: 1000 })
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getStatusHistory', () => {
    it('should return status history', async () => {
      const mockHistory = [
        {
          id: 'history-1',
          invoiceId: 'invoice-123',
          fromStatus: 'DRAFT',
          toStatus: 'SUBMITTED',
          changedAt: '1704067200',
          changedBy: 'user-123',
          reason: 'Submitted for review',
          metadata: null,
          createdAt: new Date('2024-01-01'),
        },
      ];

      repository.getStatusHistory.mockResolvedValue(mockHistory);

      const result = await service.getStatusHistory('invoice-123', 'org-123');

      expect(result).toHaveLength(1);
      expect(result[0].toStatus).toBe('SUBMITTED');
      expect(result[0].changedAt).toBe(1704067200);
    });

    it('should throw NotFoundException when invoice not found', async () => {
      repository.getStatusHistory.mockResolvedValue(null);

      await expect(
        service.getStatusHistory('invalid', 'org-123')
      ).rejects.toThrow(NotFoundException);
    });
  });
});
