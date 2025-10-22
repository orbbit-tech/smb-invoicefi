import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Organization information (issuer)
 */
export class IssuerDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiPropertyOptional()
  legalName?: string;

  @ApiPropertyOptional()
  industry?: string;
}

/**
 * Payer company information
 */
export class PayerCompanyDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiPropertyOptional()
  creditScore?: string;

  @ApiPropertyOptional()
  industry?: string;

  @ApiPropertyOptional()
  paymentTermsDays?: number;
}

/**
 * Underwriting details
 */
export class UnderwritingDto {
  @ApiProperty()
  decision: string;

  @ApiPropertyOptional()
  decisionReason?: string;

  @ApiProperty()
  assessedRiskScore: string;

  @ApiProperty()
  fraudCheckStatus: string;

  @ApiProperty()
  payerVerificationStatus: string;

  @ApiProperty({ description: 'Unix timestamp' })
  completedAt: number;
}

/**
 * Invoice document
 */
export class DocumentDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  documentType: string;

  @ApiProperty()
  fileName: string;

  @ApiProperty()
  fileUrl: string;

  @ApiProperty()
  fileSizeBytes: number;
}

/**
 * Marketplace invoice list item
 */
export class MarketplaceInvoiceDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  invoiceNumber: string;

  @ApiProperty({ description: 'Amount in cents' })
  amount: number;

  @ApiProperty({ description: 'APR in basis points' })
  aprBps: number;

  @ApiProperty({ description: 'Discount rate in basis points' })
  discountRateBps: number;

  @ApiProperty({ description: 'Unix timestamp' })
  invoiceDate: number;

  @ApiProperty({ description: 'Unix timestamp' })
  dueAt: number;

  @ApiProperty({ description: 'Days until due date' })
  daysUntilDue: number;

  @ApiProperty({ description: 'Calculated APY percentage' })
  apy: number;

  @ApiProperty({ description: 'Expected return in cents' })
  expectedReturn: number;

  @ApiProperty()
  lifecycleStatus: string;

  @ApiProperty()
  riskScore: string;

  @ApiProperty({ type: IssuerDto })
  issuer: IssuerDto;

  @ApiProperty({ type: PayerCompanyDto })
  payer: PayerCompanyDto;

  @ApiProperty({ description: 'ISO 8601 date string' })
  createdAt: string;
}

/**
 * Paginated marketplace response
 */
export class MarketplaceListResponseDto {
  @ApiProperty({ type: [MarketplaceInvoiceDto] })
  data: MarketplaceInvoiceDto[];

  @ApiProperty()
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

/**
 * Detailed marketplace invoice
 */
export class MarketplaceDetailDto extends MarketplaceInvoiceDto {
  @ApiPropertyOptional()
  description?: string;

  @ApiPropertyOptional()
  metadataUri?: string;

  @ApiProperty({ type: UnderwritingDto })
  underwriting: UnderwritingDto;

  @ApiProperty({ type: [DocumentDto] })
  documents: DocumentDto[];

  @ApiProperty({ description: 'Funding amount in cents (after discount)' })
  fundingAmount: number;

  @ApiProperty({ description: 'Expected repayment in cents' })
  expectedRepayment: number;

  @ApiProperty({ description: 'Token ID if NFT is minted' })
  nftTokenId?: string;
}
