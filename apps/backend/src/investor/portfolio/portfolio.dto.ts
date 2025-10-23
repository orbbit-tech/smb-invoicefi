import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Portfolio summary metrics
 */
export class PortfolioSummaryDto {
  @ApiProperty({ description: 'Total invested amount in 6-decimal format' })
  totalInvested: number;

  @ApiProperty({ description: 'Total current value in 6-decimal format' })
  totalCurrentValue: number;

  @ApiProperty({ description: 'Total realized gains in 6-decimal format' })
  totalRealizedGains: number;

  @ApiProperty({ description: 'Total unrealized gains in 6-decimal format' })
  totalUnrealizedGains: number;

  @ApiProperty({ description: 'Overall return percentage' })
  totalReturnPct: number;

  @ApiProperty({ description: 'Number of active positions' })
  activePositionsCount: number;

  @ApiProperty({ description: 'Number of settled positions' })
  settledPositionsCount: number;

  @ApiProperty({ description: 'Number of defaulted positions' })
  defaultedPositionsCount: number;

  @ApiProperty({ description: 'Average APR across all positions' })
  averageApy: number;
}

/**
 * Invoice summary (nested in position)
 */
export class PositionInvoiceDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  invoiceNumber: string;

  @ApiProperty({ description: 'Amount in 6-decimal format' })
  amount: number;

  @ApiProperty({ description: 'Unix timestamp' })
  dueAt: number;

  @ApiProperty()
  lifecycleStatus: string;

  @ApiProperty()
  riskScore: string;
}

/**
 * NFT details (nested in position)
 */
export class PositionNftDto {
  @ApiProperty()
  tokenId: string;

  @ApiProperty()
  contractAddress: string;

  @ApiProperty()
  ownerAddress: string;

  @ApiPropertyOptional()
  metadataUri?: string;
}

/**
 * Investment details (nested in position)
 */
export class InvestmentDetailDto {
  @ApiProperty({ description: 'Funded amount in 6-decimal format' })
  fundedAmount: number;

  @ApiProperty({ description: 'Unix timestamp' })
  fundedAt: number;

  @ApiProperty()
  fundingTxHash: string;

  @ApiProperty({ description: 'Expected repayment in 6-decimal format' })
  expectedRepayment: number;

  @ApiProperty({ description: 'Expected return in 6-decimal format' })
  expectedReturn: number;
}

/**
 * Payer details (nested in position)
 */
export class PositionPayerDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiPropertyOptional()
  creditScore?: string;

  @ApiPropertyOptional()
  industry?: string;
}

/**
 * Issuer details (nested in position)
 */
export class PositionIssuerDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;
}

/**
 * Investor position (portfolio item)
 */
export class InvestorPositionDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  positionStatus: string;

  @ApiProperty({ description: 'Current value in 6-decimal format' })
  currentValue: number;

  @ApiProperty({ description: 'Realized gains in 6-decimal format (if settled)' })
  realizedGains: number;

  @ApiProperty({ description: 'Unrealized gains in 6-decimal format (if active)' })
  unrealizedGains: number;

  @ApiProperty({ description: 'Return percentage' })
  returnPct: number;

  @ApiPropertyOptional({
    description: 'Actual repayment in 6-decimal format (if settled)',
  })
  actualRepayment?: number;

  @ApiPropertyOptional({ description: 'Unix timestamp (if settled)' })
  settledAt?: number;

  @ApiProperty({ type: PositionInvoiceDto })
  invoice: PositionInvoiceDto;

  @ApiProperty({ type: PositionNftDto })
  nft: PositionNftDto;

  @ApiProperty({ type: InvestmentDetailDto })
  investment: InvestmentDetailDto;

  @ApiProperty({ type: PositionPayerDto })
  payer: PositionPayerDto;

  @ApiProperty({ type: PositionIssuerDto })
  issuer: PositionIssuerDto;

  @ApiProperty({ description: 'ISO 8601 date string' })
  createdAt: string;
}

/**
 * Paginated positions response
 */
export class PositionsListResponseDto {
  @ApiProperty({ type: [InvestorPositionDto] })
  data: InvestorPositionDto[];

  @ApiProperty()
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
