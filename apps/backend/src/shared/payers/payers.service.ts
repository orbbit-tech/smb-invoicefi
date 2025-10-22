import { Injectable, NotFoundException } from '@nestjs/common';
import { PayersRepository } from './payers.repository';
import { PayerDetailDto, PaymentMetricsDto } from './payers.dto';

@Injectable()
export class PayersService {
  constructor(private readonly payersRepository: PayersRepository) {}

  /**
   * Calculate on-time payment rate
   */
  private calculateOnTimePaymentRate(paidOnTime: number, total: number): number {
    if (total === 0) return 0;
    return Math.round((paidOnTime / total) * 10000) / 100; // Percentage with 2 decimals
  }

  /**
   * Calculate average payment time
   * Note: This is a simplified calculation. In production, you'd aggregate actual payment dates
   */
  private calculateAveragePaymentTime(
    paidOnTime: number,
    latePayments: number,
    paymentTermsDays: number
  ): number {
    const totalPaid = paidOnTime + latePayments;
    if (totalPaid === 0) return 0;

    // Simplified: assume on-time = payment terms, late = payment terms + 15 days average
    const onTimeTotal = paidOnTime * paymentTermsDays;
    const lateTotal = latePayments * (paymentTermsDays + 15);

    return Math.round((onTimeTotal + lateTotal) / totalPaid);
  }

  /**
   * Get payer detail by ID
   */
  async getPayerById(payerId: string): Promise<PayerDetailDto> {
    const result = await this.payersRepository.findById(payerId);

    if (!result) {
      throw new NotFoundException(`Payer with ID ${payerId} not found`);
    }

    const { payer, relationships } = result;

    // Aggregate metrics across all relationships
    let totalInvoicesCount = 0;
    let totalInvoicesValue = 0;
    let paidOnTimeCount = 0;
    let latePaymentCount = 0;
    let defaultCount = 0;
    let totalReliabilityScore = 0;
    let relationshipCount = 0;

    for (const rel of relationships) {
      totalInvoicesCount += Number(rel.totalInvoicesCount || 0);
      totalInvoicesValue += Number(rel.totalInvoicesValueCents || 0);
      paidOnTimeCount += Number(rel.paidOnTimeCount || 0);
      latePaymentCount += Number(rel.latePaymentCount || 0);
      defaultCount += Number(rel.defaultCount || 0);
      totalReliabilityScore += Number(rel.reliabilityScore || 0);
      relationshipCount++;
    }

    const averageReliabilityScore = relationshipCount > 0
      ? Math.round((totalReliabilityScore / relationshipCount) * 100) / 100
      : 0;

    const onTimePaymentRate = this.calculateOnTimePaymentRate(paidOnTimeCount, totalInvoicesCount);
    const averagePaymentTime = this.calculateAveragePaymentTime(
      paidOnTimeCount,
      latePaymentCount,
      payer.paymentTermsDays || 30
    );

    const performanceMetrics: PaymentMetricsDto = {
      totalInvoicesCount,
      totalInvoicesValue,
      paidOnTimeCount,
      latePaymentCount,
      defaultCount,
      onTimePaymentRate,
      averagePaymentTime,
      reliabilityScore: averageReliabilityScore,
    };

    return {
      id: payer.id,
      name: payer.name,
      legalName: payer.legalName,
      industry: payer.industry || undefined,
      creditScore: payer.creditScore || undefined,
      paymentTermsDays: payer.paymentTermsDays || undefined,
      website: payer.website || undefined,
      address: payer.address || undefined,
      performanceMetrics,
      createdAt: new Date(payer.createdAt).toISOString(),
    };
  }
}
