import { ApiProperty } from '@nestjs/swagger';

/**
 * User profile response
 */
export class UserProfileDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  walletAddress: string;

  @ApiProperty()
  firstName: string;

  @ApiProperty()
  lastName: string;

  @ApiProperty({
    enum: ['PENDING', 'APPROVED', 'REJECTED', 'EXPIRED'],
    description: 'KYC verification status',
  })
  kycStatus: 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED';

  @ApiProperty({ description: 'Whether user is whitelisted for platform access' })
  isWhitelisted: boolean;

  @ApiProperty({ description: 'Whether user is accredited investor' })
  isAccreditedInvestor: boolean;

  @ApiProperty({ description: 'ISO 8601 date string' })
  createdAt: string;
}
