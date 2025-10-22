import { NotFoundException } from '@nestjs/common';
import { OrganizationService } from './organization.service';
import { OrganizationRepository } from './organization.repository';
import { mockOrganization } from '../../test/test-utils';

describe('OrganizationService', () => {
  let service: OrganizationService;
  let repository: jest.Mocked<OrganizationRepository>;

  beforeEach(() => {
    repository = {
      findById: jest.fn(),
    } as any;

    service = new OrganizationService(repository);
  });

  describe('getProfile', () => {
    it('should return organization profile with correct DTO transformation', async () => {
      repository.findById.mockResolvedValue(mockOrganization);

      const result = await service.getProfile('org-123');

      expect(result.id).toBe('org-123');
      expect(result.name).toBe('Test SMB');
      expect(result.legalName).toBe('Test SMB Inc');
      expect(result.walletAddress).toBe('0x1234567890abcdef');
      expect(result.address.line1).toBe('123 Main St');
      expect(result.address.city).toBe('San Francisco');
      expect(result.kybStatus).toBe('APPROVED');
      expect(result.isWhitelisted).toBe(true);
      expect(result.whitelistedAt).toBe(1704067200);
    });

    it('should throw NotFoundException when organization not found', async () => {
      repository.findById.mockResolvedValue(undefined);

      await expect(service.getProfile('invalid')).rejects.toThrow(
        NotFoundException
      );
    });

    it('should handle optional address line2', async () => {
      repository.findById.mockResolvedValue(mockOrganization);

      const result = await service.getProfile('org-123');

      expect(result.address.line2).toBeUndefined();
    });
  });
});
