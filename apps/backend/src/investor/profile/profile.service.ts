import { Injectable, NotFoundException } from '@nestjs/common';
import { ProfileRepository } from './profile.repository';
import { UserProfileDto } from './profile.dto';

@Injectable()
export class ProfileService {
  constructor(private readonly profileRepository: ProfileRepository) {}

  /**
   * Get user profile by ID
   */
  async getProfile(userId: string): Promise<UserProfileDto> {
    const user = await this.profileRepository.findById(userId);

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    return {
      id: user.id,
      email: user.email,
      walletAddress: user.walletAddress,
      firstName: user.firstName,
      lastName: user.lastName,
      kycStatus: user.kycStatus as 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED',
      isWhitelisted: user.isWhitelisted,
      isAccreditedInvestor: user.isAccreditedInvestor,
      createdAt: new Date(user.createdAt).toISOString(),
    };
  }
}
