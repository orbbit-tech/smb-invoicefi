import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Payment history metrics
 */
export class PaymentMetricsDto {
  @ApiProperty({ description: 'Total number of invoices from this payer' })
  totalInvoicesCount: number;

  @ApiProperty({ description: 'Total value of all invoices in cents' })
  totalInvoicesValue: number;

  @ApiProperty({ description: 'Number of invoices paid on time' })
  paidOnTimeCount: number;

  @ApiProperty({ description: 'Number of late payments' })
  latePaymentCount: number;

  @ApiProperty({ description: 'Number of defaults' })
  defaultCount: number;

  @ApiProperty({ description: 'On-time payment rate percentage' })
  onTimePaymentRate: number;

  @ApiProperty({ description: 'Average days to payment' })
  averagePaymentTime: number;

  @ApiProperty({ description: 'Reliability score (0-100)' })
  reliabilityScore: number;
}

/**
 * Payer detail response
 */
export class PayerDetailDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  legalName: string;

  @ApiPropertyOptional()
  industry?: string;

  @ApiPropertyOptional()
  creditScore?: string;

  @ApiPropertyOptional({ description: 'Default payment terms in days' })
  paymentTermsDays?: number;

  @ApiPropertyOptional()
  website?: string;

  @ApiPropertyOptional()
  address?: string;

  @ApiProperty({ type: PaymentMetricsDto })
  performanceMetrics: PaymentMetricsDto;

  @ApiProperty({ description: 'ISO 8601 date string' })
  createdAt: string;
}
