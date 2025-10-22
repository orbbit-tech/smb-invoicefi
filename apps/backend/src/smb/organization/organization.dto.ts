import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class OrganizationAddressDto {
  @ApiProperty()
  line1: string;

  @ApiPropertyOptional()
  line2?: string;

  @ApiProperty()
  city: string;

  @ApiProperty()
  state: string;

  @ApiProperty()
  postalCode: string;

  @ApiProperty()
  country: string;
}

export class OrganizationProfileDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  legalName: string;

  @ApiProperty()
  taxId: string;

  @ApiProperty()
  walletAddress: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  phone: string;

  @ApiProperty({ type: OrganizationAddressDto })
  address: OrganizationAddressDto;

  @ApiProperty({ enum: ['PENDING', 'APPROVED', 'REJECTED', 'EXPIRED'] })
  kybStatus: string;

  @ApiProperty()
  isWhitelisted: boolean;

  @ApiPropertyOptional({ description: 'Unix timestamp' })
  whitelistedAt?: number | null;
}
