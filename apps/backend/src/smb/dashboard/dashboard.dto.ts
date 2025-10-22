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
    description: 'Total amount currently in active funding process (in cents)',
    example: 5000000,
  })
  activeFundingAmount: number;

  @ApiProperty({
    description: 'Total amount funded to date (in cents)',
    example: 25000000,
  })
  totalFundedToDate: number;

  @ApiProperty({
    description: 'Total pending repayment amount (in cents)',
    example: 3500000,
  })
  pendingRepayments: number;
}
