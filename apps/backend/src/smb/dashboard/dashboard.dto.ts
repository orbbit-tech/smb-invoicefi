import { ApiProperty } from '@nestjs/swagger';

/**
 * Response DTO for SMB dashboard metrics
 */
export class DashboardMetricsDto {
  @ApiProperty({
    description: 'Total number of invoices submitted by the organization',
    example: 42,
  })
  totalInvoicesSubmitted: number;

  @ApiProperty({
    description: 'Total amount currently in active funding process (6-decimal format)',
    example: 50000000000,
  })
  activeFundingAmount: number;

  @ApiProperty({
    description: 'Total amount funded to date (6-decimal format)',
    example: 250000000000,
  })
  totalFundedToDate: number;

  @ApiProperty({
    description: 'Total pending repayment amount (6-decimal format)',
    example: 35000000000,
  })
  pendingRepayments: number;
}
