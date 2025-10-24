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
   * Calculate APR from APR and days until due
   * @param apr - APR in 6-decimal format (e.g., 365,000 = 36.5%)
   */
  private calculateApy(apr: number, daysUntilDue: number): number {
    if (daysUntilDue <= 0) return 0;
    const aprDecimal = apr / 1000000;
    const daysInYear = 365;
    const calculatedApr = (aprDecimal * daysInYear) / daysUntilDue;
    return Math.round(calculatedApr * 1000000); // Return in 6-decimal format
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
   * @param amount - Amount in 6-decimal format (e.g., 10,000,000,000 = $10,000)
   * @param discountRate - Discount rate in 6-decimal format (e.g., 60,000 = 6%)
   */
  private calculateExpectedReturn(
    amount: number,
    discountRate: number
  ): number {
    const discountDecimal = discountRate / 1000000;
    return Math.round(amount * discountDecimal);
  }

  /**
   * Calculate funding amount (amount - discount)
   * @param amount - Amount in 6-decimal format
   * @param discountRate - Discount rate in 6-decimal format
   */
  private calculateFundingAmount(
    amount: number,
    discountRate: number
  ): number {
    return (
      amount - this.calculateExpectedReturn(amount, discountRate)
    );
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
      const amount = Number(inv.amount);
      const apr = Number(inv.apr || 0);
      const discountRate = Number(inv.discountRate || 0);
      const dueAt = Number(inv.dueAt);
      const daysUntilDue = this.calculateDaysUntilDue(dueAt);

      return {
        id: inv.id,
        invoiceNumber: inv.invoiceNumber,
        amount,
        apr,
        discountRate,
        invoiceDate: Number(inv.invoiceDate),
        dueAt,
        daysUntilDue,
        expectedReturn: this.calculateExpectedReturn(
          amount,
          discountRate
        ),
        lifecycleStatus: inv.lifecycleStatus,
        riskScore: inv.riskScore || 'UNKNOWN',
        issuer: {
          id: inv.issuerId,
          name: inv.issuerName,
          legalName: inv.issuerLegalName || undefined,
          logoUrl: inv.issuerLogoUrl || undefined,
        },
        payer: {
          id: inv.payerId,
          name: inv.payerName,
          creditScore: inv.payerCreditScore || undefined,
          industry: inv.payerIndustry || undefined,
          paymentTermsDays: inv.payerPaymentTermsDays || undefined,
          logoUrl: inv.payerLogoUrl || undefined,
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
      throw new NotFoundException(
        `Invoice with ID ${id} not found or not available in marketplace`
      );
    }

    const { invoice: inv, underwriting, documents } = result;

    const amount = Number(inv.amount);
    const apr = Number(inv.apr || 0);
    const discountRate = Number(inv.discountRate || 0);
    const dueAt = Number(inv.dueAt);
    const daysUntilDue = this.calculateDaysUntilDue(dueAt);

    return {
      id: inv.id,
      invoiceNumber: inv.invoiceNumber,
      amount,
      apr,
      discountRate,
      invoiceDate: Number(inv.invoiceDate),
      dueAt,
      daysUntilDue,
      expectedReturn: this.calculateExpectedReturn(
        amount,
        discountRate
      ),
      lifecycleStatus: inv.lifecycleStatus,
      riskScore: inv.riskScore || 'UNKNOWN',
      description: inv.description || undefined,
      metadataUri: inv.metadataUri || undefined,
      issuer: {
        id: inv.issuerId,
        name: inv.issuerName,
        legalName: inv.issuerLegalName || undefined,
        logoUrl: inv.issuerLogoUrl || undefined,
      },
      payer: {
        id: inv.payerId,
        name: inv.payerName,
        creditScore: inv.payerCreditScore || undefined,
        industry: inv.payerIndustry || undefined,
        paymentTermsDays: inv.payerPaymentTermsDays || undefined,
        logoUrl: inv.payerLogoUrl || undefined,
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
      fundingAmount: this.calculateFundingAmount(amount, discountRate),
      expectedRepayment: amount,
      nftTokenId: inv.nftTokenId || undefined,
      createdAt: new Date(inv.createdAt).toISOString(),
    };
  }
}
