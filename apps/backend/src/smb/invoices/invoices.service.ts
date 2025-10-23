import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InvoicesRepository } from './invoices.repository';
import {
  InvoiceListResponseDto,
  InvoiceDto,
  InvoiceDetailDto,
  CreateInvoiceDto,
  UpdateInvoiceDto,
  InvoiceStatusHistoryDto,
  PayerDto,
  InvoiceNftDto,
  PaginationMetaDto,
} from './invoices.dto';

@Injectable()
export class InvoicesService {
  constructor(private readonly invoicesRepository: InvoicesRepository) {}

  /**
   * Get paginated list of invoices
   */
  async list(
    organizationId: string,
    status?: string,
    search?: string,
    page?: number,
    limit?: number,
    sortBy?: string,
    sortOrder?: 'asc' | 'desc'
  ): Promise<InvoiceListResponseDto> {
    const result = await this.invoicesRepository.list({
      organizationId,
      status,
      search,
      page,
      limit,
      sortBy,
      sortOrder,
    });

    const data: InvoiceDto[] = result.invoices.map((inv: any) => ({
      id: inv.id,
      invoiceNumber: inv.invoiceNumber,
      amount: Number(inv.amount),
      apr: Number(inv.apr || 0),
      discountRate: Number(inv.discountRate || 0),
      invoiceDate: Number(inv.invoiceDate),
      dueAt: Number(inv.dueAt),
      lifecycleStatus: inv.lifecycleStatus,
      onChainStatus: inv.onChainStatus,
      riskScore: inv.riskScore,
      payer: {
        id: inv.payerId,
        name: inv.payerName,
        creditScore: inv.payerCreditScore,
        industry: inv.payerIndustry,
      },
      createdAt: new Date(inv.createdAt).toISOString(),
    }));

    const meta: PaginationMetaDto = {
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    };

    return { data, meta };
  }

  /**
   * Get detailed invoice by ID
   */
  async getById(id: string, organizationId: string): Promise<InvoiceDetailDto> {
    const result = await this.invoicesRepository.findById(id, organizationId);

    if (!result) {
      throw new NotFoundException(`Invoice with ID ${id} not found`);
    }

    const { invoice: inv, documents, statusHistory } = result;

    // Build NFT object if exists
    let nft: InvoiceNftDto | null = null;
    if (inv.nftTokenId) {
      nft = {
        tokenId: inv.nftTokenId,
        contractAddress: inv.nftContractAddress!,
        ownerAddress: inv.nftOwnerAddress!,
        mintedAt: Number(inv.nftMintedAt),
        mintedTxHash: inv.nftMintedTxHash!,
      };
    }

    const invoiceDetail: InvoiceDetailDto = {
      id: inv.id,
      invoiceNumber: inv.invoiceNumber,
      amount: Number(inv.amount),
      apr: Number(inv.apr || 0),
      discountRate: Number(inv.discountRate || 0),
      invoiceDate: Number(inv.invoiceDate),
      dueAt: Number(inv.dueAt),
      lifecycleStatus: inv.lifecycleStatus,
      onChainStatus: inv.onChainStatus,
      riskScore: inv.riskScore,
      description: inv.description || undefined,
      metadataUri: inv.metadataUri,
      payer: {
        id: inv.payerId,
        name: inv.payerName,
        creditScore: inv.payerCreditScore,
        industry: inv.payerIndustry,
      },
      createdAt: new Date(inv.createdAt).toISOString(),
      nft,
      documents: documents.map((doc: any) => ({
        id: doc.id,
        documentType: doc.documentType,
        fileUrl: doc.fileUrl,
        fileName: doc.fileName,
        fileSizeBytes: Number(doc.fileSizeBytes),
      })),
      statusHistory: statusHistory.map((hist: any) => ({
        fromStatus: hist.fromStatus,
        toStatus: hist.toStatus,
        changedAt: Number(hist.changedAt),
        changedBy: hist.changedBy || undefined,
        reason: hist.reason || undefined,
      })),
    };

    return invoiceDetail;
  }

  /**
   * Create a new invoice
   */
  async create(organizationId: string, dto: CreateInvoiceDto): Promise<InvoiceDetailDto> {
    const invoice = await this.invoicesRepository.create({
      organizationId,
      payerCompanyId: dto.payerCompanyId,
      amount: dto.amount.toString(),
      invoiceNumber: dto.invoiceNumber,
      invoiceDate: dto.invoiceDate.toString(),
      dueAt: dto.dueAt.toString(),
      description: dto.description,
    });

    // Insert documents if provided
    if (dto.documents && dto.documents.length > 0) {
      await this.invoicesRepository.insertDocuments(invoice.id, dto.documents);
    }

    // Return the created invoice with full details
    return this.getById(invoice.id, organizationId);
  }

  /**
   * Update an invoice
   */
  async update(id: string, organizationId: string, dto: UpdateInvoiceDto): Promise<InvoiceDetailDto> {
    const updateData: any = {};

    if (dto.payerCompanyId) updateData.payerCompanyId = dto.payerCompanyId;
    if (dto.amount) updateData.amount = dto.amount.toString();
    if (dto.invoiceNumber) updateData.invoiceNumber = dto.invoiceNumber;
    if (dto.invoiceDate) updateData.invoiceDate = dto.invoiceDate.toString();
    if (dto.dueAt) updateData.dueAt = dto.dueAt.toString();
    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.lifecycleStatus) updateData.lifecycleStatus = dto.lifecycleStatus;

    const updated = await this.invoicesRepository.update(id, organizationId, updateData);

    if (!updated) {
      throw new BadRequestException(
        'Invoice not found or cannot be updated (only DRAFT invoices can be updated)'
      );
    }

    return this.getById(id, organizationId);
  }

  /**
   * Get status history for an invoice
   */
  async getStatusHistory(id: string, organizationId: string): Promise<InvoiceStatusHistoryDto[]> {
    const history = await this.invoicesRepository.getStatusHistory(id, organizationId);

    if (history === null) {
      throw new NotFoundException(`Invoice with ID ${id} not found`);
    }

    return history.map((hist: any) => ({
      fromStatus: hist.fromStatus,
      toStatus: hist.toStatus,
      changedAt: Number(hist.changedAt),
      changedBy: hist.changedBy || undefined,
      reason: hist.reason || undefined,
    }));
  }
}
