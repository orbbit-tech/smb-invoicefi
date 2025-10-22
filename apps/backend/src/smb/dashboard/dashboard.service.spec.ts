import { DashboardService } from './dashboard.service';
import { DashboardRepository } from './dashboard.repository';

describe('DashboardService', () => {
  let service: DashboardService;
  let repository: jest.Mocked<DashboardRepository>;

  beforeEach(() => {
    repository = {
      getMetrics: jest.fn(),
    } as any;

    service = new DashboardService(repository);
  });

  describe('getMetrics', () => {
    it('should return dashboard metrics for an organization', async () => {
      const mockMetrics = {
        totalInvoicesSubmitted: 42,
        activeFundingAmount: 5000000,
        totalFundedToDate: 25000000,
        pendingRepayments: 3500000,
      };

      repository.getMetrics.mockResolvedValue(mockMetrics);

      const result = await service.getMetrics('org-123');

      expect(result).toEqual(mockMetrics);
      expect(repository.getMetrics).toHaveBeenCalledWith('org-123');
      expect(repository.getMetrics).toHaveBeenCalledTimes(1);
    });

    it('should handle zero metrics', async () => {
      const mockMetrics = {
        totalInvoicesSubmitted: 0,
        activeFundingAmount: 0,
        totalFundedToDate: 0,
        pendingRepayments: 0,
      };

      repository.getMetrics.mockResolvedValue(mockMetrics);

      const result = await service.getMetrics('org-new');

      expect(result.totalInvoicesSubmitted).toBe(0);
      expect(result.activeFundingAmount).toBe(0);
    });
  });
});
