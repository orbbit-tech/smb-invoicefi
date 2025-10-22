import { Injectable, NotFoundException } from '@nestjs/common';
import { OrganizationRepository } from './organization.repository';
import { OrganizationProfileDto } from './organization.dto';

@Injectable()
export class OrganizationService {
  constructor(private readonly organizationRepository: OrganizationRepository) {}

  async getProfile(organizationId: string): Promise<OrganizationProfileDto> {
    const org = await this.organizationRepository.findById(organizationId);

    if (!org) {
      throw new NotFoundException(`Organization with ID ${organizationId} not found`);
    }

    return {
      id: org.id,
      name: org.name,
      legalName: org.legalName,
      taxId: org.taxId,
      walletAddress: org.walletAddress,
      email: org.email,
      phone: org.phone,
      address: {
        line1: org.addressLine1,
        line2: org.addressLine2 || undefined,
        city: org.city,
        state: org.state,
        postalCode: org.postalCode,
        country: org.country,
      },
      kybStatus: org.kybStatus || 'PENDING',
      isWhitelisted: org.isWhitelisted,
      whitelistedAt: org.whitelistedAt ? Number(org.whitelistedAt) : null,
    };
  }
}
