/**
 * Invoice data mappers
 *
 * Converts API DTOs and blockchain data to frontend types
 */

import {
  MarketplaceInvoiceDto,
  MarketplaceDetailDto,
  InvestorPositionDto
} from '@api-client';

/**
 * Convert 6-decimal USDC to dollars
 */
export function usdcToDollars(usdc: number): number {
  return usdc / 1_000_000;
}

/**
 * Convert 6-decimal format to percentage (e.g., 365,000 → 36.5%)
 */
export function decimalToPercentage(decimal: number): number {
  return decimal / 10_000;
}

/**
 * Convert unix timestamp to Date
 */
export function timestampToDate(timestamp: number): Date {
  return new Date(timestamp * 1000);
}

/**
 * Map marketplace invoice DTO to frontend format
 */
export function mapMarketplaceInvoice(dto: MarketplaceInvoiceDto) {
  return {
    id: dto.id,
    invoiceNumber: dto.invoiceNumber,
    amount: usdcToDollars(dto.amount),
    apr: decimalToPercentage(dto.apr),
    discountRate: decimalToPercentage(dto.discountRate),
    dueDate: timestampToDate(dto.dueAt),
    createdDate: new Date(dto.createdAt),
    daysUntilDue: dto.daysUntilDue,
    expectedReturn: usdcToDollars(dto.expectedReturn),
    lifecycleStatus: dto.lifecycleStatus,
    riskScore: dto.riskScore,
    issuer: {
      id: dto.issuer.id,
      name: dto.issuer.name,
      industry: dto.issuer.industry,
    },
    payer: {
      id: dto.payer.id,
      name: dto.payer.name,
      creditScore: dto.payer.creditScore,
      industry: dto.payer.industry,
    },
  };
}

/**
 * Map marketplace detail DTO to frontend format
 */
export function mapMarketplaceDetail(dto: MarketplaceDetailDto) {
  return {
    ...mapMarketplaceInvoice(dto),
    description: dto.description,
    metadataUri: dto.metadataUri,
    fundingAmount: usdcToDollars(dto.fundingAmount),
    expectedRepayment: usdcToDollars(dto.expectedRepayment),
    nftTokenId: dto.nftTokenId,
    underwriting: {
      decision: dto.underwriting.decision,
      decisionReason: dto.underwriting.decisionReason,
      assessedRiskScore: dto.underwriting.assessedRiskScore,
      fraudCheckStatus: dto.underwriting.fraudCheckStatus,
      payerVerificationStatus: dto.underwriting.payerVerificationStatus,
      completedAt: timestampToDate(dto.underwriting.completedAt),
    },
    documents: dto.documents.map((doc) => ({
      id: doc.id,
      documentType: doc.documentType,
      fileName: doc.fileName,
      fileUrl: doc.fileUrl,
      fileSizeBytes: doc.fileSizeBytes,
    })),
  };
}

/**
 * Map portfolio position DTO to frontend format
 */
export function mapPortfolioPosition(dto: InvestorPositionDto) {
  return {
    id: dto.id,
    positionStatus: dto.positionStatus,
    currentValue: usdcToDollars(dto.currentValue),
    realizedGains: usdcToDollars(dto.realizedGains),
    unrealizedGains: usdcToDollars(dto.unrealizedGains),
    returnPct: dto.returnPct,
    actualRepayment: dto.actualRepayment ? usdcToDollars(dto.actualRepayment) : undefined,
    settledAt: dto.settledAt ? timestampToDate(dto.settledAt) : undefined,
    createdAt: new Date(dto.createdAt),
    invoice: {
      id: dto.invoice.id,
      invoiceNumber: dto.invoice.invoiceNumber,
      amount: usdcToDollars(dto.invoice.amount),
      dueAt: timestampToDate(dto.invoice.dueAt),
      lifecycleStatus: dto.invoice.lifecycleStatus,
      riskScore: dto.invoice.riskScore,
    },
    nft: {
      tokenId: dto.nft.tokenId,
      contractAddress: dto.nft.contractAddress,
      ownerAddress: dto.nft.ownerAddress,
      metadataUri: dto.nft.metadataUri,
    },
    investment: {
      fundedAmount: usdcToDollars(dto.investment.fundedAmount),
      fundedAt: timestampToDate(dto.investment.fundedAt),
      fundingTxHash: dto.investment.fundingTxHash,
      expectedRepayment: usdcToDollars(dto.investment.expectedRepayment),
      expectedReturn: decimalToPercentage(dto.investment.expectedReturn),
    },
    payer: {
      id: dto.payer.id,
      name: dto.payer.name,
      creditScore: dto.payer.creditScore,
      industry: dto.payer.industry,
    },
    issuer: {
      id: dto.issuer.id,
      name: dto.issuer.name,
    },
  };
}

/**
 * Calculate funding amount from invoice amount and discount rate
 * Both inputs are in 6-decimal format
 */
export function calculateFundingAmount(amount: number, discountRate: number): number {
  const discountPercentage = discountRate / 1_000_000; // Convert 6-decimal to decimal
  return amount * (1 - discountPercentage);
}

/**
 * Calculate expected repayment (payout) from funding amount
 * Both inputs/outputs are in 6-decimal format
 */
export function calculateExpectedRepayment(fundingAmount: number, discountRate: number): number {
  const discountPercentage = discountRate / 1_000_000; // Convert 6-decimal to decimal
  return fundingAmount / (1 - discountPercentage);
}

/**
 * Calculate days until due date
 */
export function calculateDaysUntilDue(dueDate: Date): number {
  const now = new Date();
  const diffTime = dueDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
}
