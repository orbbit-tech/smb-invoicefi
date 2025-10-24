import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Pagination metadata
 */
export class PaginationMetaDto {
  @ApiProperty({ example: 100 })
  total: number;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 20 })
  limit: number;

  @ApiProperty({ example: 5 })
  totalPages: number;
}

/**
 * Payer information (nested in invoice)
 */
export class PayerDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiPropertyOptional()
  creditScore?: string;

  @ApiPropertyOptional()
  industry?: string;

  @ApiPropertyOptional()
  logoUrl?: string;
}

/**
 * Invoice list item
 */
export class InvoiceDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  invoiceNumber: string;

  @ApiProperty({ description: 'Amount in 6-decimal format (e.g., for USDC: 1,000,000 = $1)' })
  amount: number;

  @ApiProperty({ description: 'APR with 6 decimals (e.g., 365,000 = 36.5%, where 1,000,000 = 100%)' })
  apr: number;

  @ApiProperty({ description: 'Discount rate with 6 decimals (e.g., 60,000 = 6%)' })
  discountRate: number;

  @ApiProperty({ description: 'Unix timestamp' })
  invoiceDate: number;

  @ApiProperty({ description: 'Unix timestamp' })
  dueAt: number;

  @ApiProperty()
  lifecycleStatus: string;

  @ApiPropertyOptional()
  onChainStatus?: string | null;

  @ApiPropertyOptional()
  riskScore?: string | null;

  @ApiProperty({ type: PayerDto })
  payer: PayerDto;

  @ApiProperty({ description: 'ISO 8601 date string' })
  createdAt: string;
}

/**
 * Paginated invoice list response
 */
export class InvoiceListResponseDto {
  @ApiProperty({ type: [InvoiceDto] })
  data: InvoiceDto[];

  @ApiProperty({ type: PaginationMetaDto })
  meta: PaginationMetaDto;
}

/**
 * Document attached to invoice
 */
export class InvoiceDocumentDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  documentType: string;

  @ApiProperty()
  fileUrl: string;

  @ApiProperty()
  fileName: string;

  @ApiProperty()
  fileSizeBytes: number;
}

/**
 * Invoice status history entry
 */
export class InvoiceStatusHistoryDto {
  @ApiProperty()
  fromStatus: string;

  @ApiProperty()
  toStatus: string;

  @ApiProperty({ description: 'Unix timestamp' })
  changedAt: number;

  @ApiPropertyOptional()
  changedBy?: string;

  @ApiPropertyOptional()
  reason?: string;
}

/**
 * NFT details (if minted)
 */
export class InvoiceNftDto {
  @ApiProperty()
  tokenId: string;

  @ApiProperty()
  contractAddress: string;

  @ApiProperty()
  ownerAddress: string;

  @ApiProperty({ description: 'Unix timestamp' })
  mintedAt: number;

  @ApiProperty()
  mintedTxHash: string;
}

/**
 * Detailed invoice response
 */
export class InvoiceDetailDto extends InvoiceDto {
  @ApiPropertyOptional()
  description?: string;

  @ApiPropertyOptional()
  metadataUri?: string | null;

  @ApiPropertyOptional({ type: InvoiceNftDto })
  nft?: InvoiceNftDto | null;

  @ApiProperty({ type: [InvoiceDocumentDto] })
  documents: InvoiceDocumentDto[];

  @ApiProperty({ type: [InvoiceStatusHistoryDto] })
  statusHistory: InvoiceStatusHistoryDto[];
}

/**
 * Create invoice request
 */
export class CreateInvoiceDto {
  @ApiProperty()
  payerCompanyId: string;

  @ApiProperty({ description: 'Amount in 6-decimal format (e.g., for USDC: 1,000,000 = $1)' })
  amount: number;

  @ApiProperty()
  invoiceNumber: string;

  @ApiProperty({ description: 'Unix timestamp' })
  invoiceDate: number;

  @ApiProperty({ description: 'Unix timestamp' })
  dueAt: number;

  @ApiPropertyOptional()
  description?: string;

  @ApiPropertyOptional({ type: [Object] })
  documents?: Array<{
    documentType: string;
    fileUrl: string;
    fileName: string;
    fileSizeBytes: number;
    mimeType: string;
  }>;
}

/**
 * Update invoice request
 */
export class UpdateInvoiceDto {
  @ApiPropertyOptional()
  payerCompanyId?: string;

  @ApiPropertyOptional({ description: 'Amount in 6-decimal format (e.g., for USDC: 1,000,000 = $1)' })
  amount?: number;

  @ApiPropertyOptional()
  invoiceNumber?: string;

  @ApiPropertyOptional({ description: 'Unix timestamp' })
  invoiceDate?: number;

  @ApiPropertyOptional({ description: 'Unix timestamp' })
  dueAt?: number;

  @ApiPropertyOptional()
  description?: string;

  @ApiPropertyOptional()
  lifecycleStatus?: string;
}
