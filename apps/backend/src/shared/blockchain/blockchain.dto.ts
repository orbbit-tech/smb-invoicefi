import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Transaction details
 */
export class TransactionDto {
  @ApiProperty()
  txHash: string;

  @ApiProperty({
    enum: ['MINT', 'FUNDING', 'REPAYMENT', 'SETTLEMENT', 'TRANSFER', 'DISTRIBUTION'],
  })
  txType: string;

  @ApiProperty()
  fromAddress: string;

  @ApiProperty()
  toAddress: string;

  @ApiProperty({ description: 'Amount in cents' })
  amount: number;

  @ApiProperty({ description: 'Block number' })
  blockNumber: number;

  @ApiProperty({ description: 'Unix timestamp' })
  blockTimestamp: number;

  @ApiProperty({ description: 'Gas used' })
  gasUsed: number;

  @ApiProperty({ description: 'Gas price in wei' })
  gasPriceWei: string;

  @ApiProperty()
  status: string;

  @ApiProperty({ description: 'ISO 8601 date string' })
  createdAt: string;
}

/**
 * Invoice information (nested in NFT data)
 */
export class NftInvoiceDto {
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

  @ApiPropertyOptional()
  onChainStatus?: string;

  @ApiProperty()
  organizationId: string;

  @ApiProperty()
  payerCompanyId: string;
}

/**
 * NFT data response
 */
export class NftDataDto {
  @ApiProperty()
  tokenId: string;

  @ApiProperty()
  contractAddress: string;

  @ApiProperty({ description: 'Blockchain network ID' })
  chainId: number;

  @ApiProperty()
  ownerAddress: string;

  @ApiPropertyOptional()
  metadataUri?: string;

  @ApiProperty({ description: 'Unix timestamp' })
  mintedAt: number;

  @ApiProperty()
  mintedTxHash: string;

  @ApiProperty({ type: NftInvoiceDto })
  invoice: NftInvoiceDto;

  @ApiProperty({ type: [TransactionDto] })
  transactions: TransactionDto[];

  @ApiProperty({ description: 'ISO 8601 date string' })
  createdAt: string;
}
