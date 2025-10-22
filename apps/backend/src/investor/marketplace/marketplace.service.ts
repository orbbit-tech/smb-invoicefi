import { Injectable, NotFoundException } from '@nestjs/common';
import { MarketplaceRepository } from './marketplace.repository';
import {
  MarketplaceListResponseDto,
  MarketplaceInvoiceDto,
  MarketplaceDetailDto,
  IssuerDto,
  PayerCompanyDto,
  UnderwritingDto,
  DocumentDto,
} from './marketplace.dto';

@Injectable()
export class MarketplaceService {
  constructor(private readonly marketplaceRepository: MarketplaceRepository) {}

  /**
   * Calculate APY from APR and days until due
   */
  private calculateApy(aprBps: number, daysUntilDue: number): number {
    if (daysUntilDue <= 0) return 0;
    const aprDecimal = aprBps / 10000;
    const daysInYear = 365;
    const apy = (aprDecimal * daysInYear) / daysUntilDue;
    return Math.round(apy * 10000) / 100; // Return as percentage with 2 decimals
  }

  /**
   * Calculate days until due date
   */
  private calculateDaysUntilDue(dueAt: number): number {
    const now = Math.floor(Date.now() / 1000);
    const secondsUntilDue = dueAt - now;
    return Math.max(0, Math.ceil(secondsUntilDue / 86400));
  }

  /**
   * Calculate expected return based on amount and discount rate
   */
  private calculateExpectedReturn(amountCents: number, discountRateBps: number): number {
    const discountDecimal = discountRateBps / 10000;
    return Math.round(amountCents * discountDecimal);
  }

  /**
   * Calculate funding amount (amount - discount)
   */
  private calculateFundingAmount(amountCents: number, discountRateBps: number): number {
    return amountCents - this.calculateExpectedReturn(amountCents, discountRateBps);
  }

  /**
   * Get paginated list of marketplace invoices
   */
  async listInvoices(
    riskScore?: string,
    minApr?: number,
    maxApr?: number,
    minAmount?: number,
    maxAmount?: number,
    search?: string,
    page?: number,
    limit?: number,
    sortBy?: string,
    sortOrder?: 'asc' | 'desc'
  ): Promise<MarketplaceListResponseDto> {
    const result = await this.marketplaceRepository.list({
      riskScore,
      minApr,
      maxApr,
      minAmount,
      maxAmount,
      search,
      page,
      limit,
      sortBy,
      sortOrder,
    });

    const data: MarketplaceInvoiceDto[] = result.invoices.map((inv: any) => {
      const amountCents = Number(inv.amountCents);
      const aprBps = Number(inv.aprBps || 0);
      const discountRateBps = Number(inv.discountRateBps || 0);
      const dueAt = Number(inv.dueAt);
      const daysUntilDue = this.calculateDaysUntilDue(dueAt);

      return {
        id: inv.id,
        invoiceNumber: inv.invoiceNumber,
        amount: amountCents,
        aprBps,
        discountRateBps,
        invoiceDate: Number(inv.invoiceDate),
        dueAt,
        daysUntilDue,
        apy: this.calculateApy(aprBps, daysUntilDue),
        expectedReturn: this.calculateExpectedReturn(amountCents, discountRateBps),
        lifecycleStatus: inv.lifecycleStatus,
        riskScore: inv.riskScore || 'UNKNOWN',
        issuer: {
          id: inv.issuerId,
          name: inv.issuerName,
          legalName: inv.issuerLegalName || undefined,
        },
        payer: {
          id: inv.payerId,
          name: inv.payerName,
          creditScore: inv.payerCreditScore || undefined,
          industry: inv.payerIndustry || undefined,
          paymentTermsDays: inv.payerPaymentTermsDays || undefined,
        },
        createdAt: new Date(inv.createdAt).toISOString(),
      };
    });

    return {
      data,
      meta: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      },
    };
  }

  /**
   * Get detailed marketplace invoice by ID
   */
  async getInvoiceDetail(id: string): Promise<MarketplaceDetailDto> {
    const result = await this.marketplaceRepository.findById(id);

    if (!result || !result.invoice) {
      throw new NotFoundException(`Invoice with ID ${id} not found or not available in marketplace`);
    }

    const { invoice: inv, underwriting, documents } = result;

    const amountCents = Number(inv.amountCents);
    const aprBps = Number(inv.aprBps || 0);
    const discountRateBps = Number(inv.discountRateBps || 0);
    const dueAt = Number(inv.dueAt);
    const daysUntilDue = this.calculateDaysUntilDue(dueAt);

    return {
      id: inv.id,
      invoiceNumber: inv.invoiceNumber,
      amount: amountCents,
      aprBps,
      discountRateBps,
      invoiceDate: Number(inv.invoiceDate),
      dueAt,
      daysUntilDue,
      apy: this.calculateApy(aprBps, daysUntilDue),
      expectedReturn: this.calculateExpectedReturn(amountCents, discountRateBps),
      lifecycleStatus: inv.lifecycleStatus,
      riskScore: inv.riskScore || 'UNKNOWN',
      description: inv.description || undefined,
      metadataUri: inv.metadataUri || undefined,
      issuer: {
        id: inv.issuerId,
        name: inv.issuerName,
        legalName: inv.issuerLegalName || undefined,
      },
      payer: {
        id: inv.payerId,
        name: inv.payerName,
        creditScore: inv.payerCreditScore || undefined,
        industry: inv.payerIndustry || undefined,
        paymentTermsDays: inv.payerPaymentTermsDays || undefined,
      },
      underwriting: underwriting
        ? {
            decision: underwriting.decision,
            decisionReason: underwriting.decisionReason || undefined,
            assessedRiskScore: underwriting.assessedRiskScore,
            fraudCheckStatus: underwriting.fraudCheckStatus,
            payerVerificationStatus: underwriting.payerVerificationStatus,
            completedAt: Number(underwriting.completedAt),
          }
        : ({} as UnderwritingDto),
      documents: documents.map((doc: any) => ({
        id: doc.id,
        documentType: doc.documentType,
        fileName: doc.fileName,
        fileUrl: doc.fileUrl,
        fileSizeBytes: Number(doc.fileSizeBytes),
      })),
      fundingAmount: this.calculateFundingAmount(amountCents, discountRateBps),
      expectedRepayment: amountCents,
      nftTokenId: inv.nftTokenId || undefined,
      createdAt: new Date(inv.createdAt).toISOString(),
    };
  }
}
