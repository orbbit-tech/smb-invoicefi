import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { OrganizationService } from './organization.service';
import { OrganizationProfileDto } from './organization.dto';

@ApiTags('SMB - Organization')
@Controller('smb/organization')
export class OrganizationController {
  constructor(private readonly organizationService: OrganizationService) {}

  @Get('profile')
  @ApiOperation({
    summary: 'Get organization profile',
    description: 'Retrieve authenticated SMB organization details',
  })
  @ApiQuery({ name: 'organizationId', required: true })
  @ApiResponse({
    status: 200,
    description: 'Organization profile retrieved successfully',
    type: OrganizationProfileDto,
  })
  @ApiResponse({ status: 404, description: 'Organization not found' })
  async getProfile(
    @Query('organizationId') organizationId: string
  ): Promise<OrganizationProfileDto> {
    return await this.organizationService.getProfile(organizationId);
  }
}
