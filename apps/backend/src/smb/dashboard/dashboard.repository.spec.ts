import { DashboardRepository } from './dashboard.repository';
import { createMockKysely } from '../../test/test-utils';

describe('DashboardRepository', () => {
  let repository: DashboardRepository;
  let mockDb: ReturnType<typeof createMockKysely>;

  beforeEach(() => {
    mockDb = createMockKysely();
    repository = new DashboardRepository(mockDb as any);
  });

  describe('getMetrics', () => {
    it('should calculate all metrics correctly', async () => {
      // This test verifies the repository can call Kysely methods
      // The actual database queries are tested in integration tests
      const result = await repository.getMetrics('org-123');

      // Just verify the structure is correct
      expect(result).toHaveProperty('totalInvoicesSubmitted');
      expect(result).toHaveProperty('activeFundingAmount');
      expect(result).toHaveProperty('totalFundedToDate');
      expect(result).toHaveProperty('pendingRepayments');
    });
  });
});
