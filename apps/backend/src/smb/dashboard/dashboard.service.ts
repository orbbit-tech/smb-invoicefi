import { Injectable } from '@nestjs/common';
import { DashboardRepository } from './dashboard.repository';
import { DashboardMetricsDto } from './dashboard.dto';

@Injectable()
export class DashboardService {
  constructor(private readonly dashboardRepository: DashboardRepository) {}

  /**
   * Get dashboard metrics for an organization
   */
  async getMetrics(organizationId: string): Promise<DashboardMetricsDto> {
    const metrics = await this.dashboardRepository.getMetrics(organizationId);
    return metrics;
  }
}
