import { NotFoundException } from '@nestjs/common';
import { ProfileService } from './profile.service';
import { ProfileRepository } from './profile.repository';
import { mockUser } from '../../test/test-utils';

describe('ProfileService', () => {
  let service: ProfileService;
  let repository: jest.Mocked<ProfileRepository>;

  beforeEach(() => {
    repository = {
      findById: jest.fn(),
    } as any;

    service = new ProfileService(repository);
  });

  describe('getProfile', () => {
    it('should return user profile with correct DTO transformation', async () => {
      repository.findById.mockResolvedValue(mockUser);

      const result = await service.getProfile('user-123');

      expect(result.id).toBe('user-123');
      expect(result.email).toBe('investor@test.com');
      expect(result.walletAddress).toBe('0xabcdef1234567890');
      expect(result.firstName).toBe('John');
      expect(result.lastName).toBe('Investor');
      expect(result.kycStatus).toBe('APPROVED');
      expect(result.isWhitelisted).toBe(true);
      expect(result.isAccreditedInvestor).toBe(true);
    });

    it('should throw NotFoundException when user not found', async () => {
      repository.findById.mockResolvedValue(undefined);

      await expect(service.getProfile('invalid')).rejects.toThrow(
        NotFoundException
      );
    });
  });
});
