import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Portfolio summary metrics
 */
export class PortfolioSummaryDto {
  @ApiProperty({ description: 'Total invested amount in cents' })
  totalInvested: number;

  @ApiProperty({ description: 'Total current value in cents' })
  totalCurrentValue: number;

  @ApiProperty({ description: 'Total realized gains in cents' })
  totalRealizedGains: number;

  @ApiProperty({ description: 'Total unrealized gains in cents' })
  totalUnrealizedGains: number;

  @ApiProperty({ description: 'Overall return percentage' })
  totalReturnPct: number;

  @ApiProperty({ description: 'Number of active positions' })
  activePositionsCount: number;

  @ApiProperty({ description: 'Number of settled positions' })
  settledPositionsCount: number;

  @ApiProperty({ description: 'Number of defaulted positions' })
  defaultedPositionsCount: number;

  @ApiProperty({ description: 'Average APY across all positions' })
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

  @ApiProperty({ description: 'Amount in cents' })
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
  @ApiProperty({ description: 'Funded amount in cents' })
  fundedAmount: number;

  @ApiProperty({ description: 'Unix timestamp' })
  fundedAt: number;

  @ApiProperty()
  fundingTxHash: string;

  @ApiProperty({ description: 'Expected repayment in cents' })
  expectedRepayment: number;

  @ApiProperty({ description: 'Expected return in basis points' })
  expectedReturnBps: number;
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

  @ApiProperty({ description: 'Current value in cents' })
  currentValue: number;

  @ApiProperty({ description: 'Realized gains in cents (if settled)' })
  realizedGains: number;

  @ApiProperty({ description: 'Unrealized gains in cents (if active)' })
  unrealizedGains: number;

  @ApiProperty({ description: 'Return percentage' })
  returnPct: number;

  @ApiPropertyOptional({ description: 'Actual repayment in cents (if settled)' })
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
