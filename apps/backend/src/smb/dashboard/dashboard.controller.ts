import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { DashboardMetricsDto } from './dashboard.dto';
import { OrgId } from '../../shared/auth/org-id.decorator';
import { Public } from '../../shared/auth/public.decorator';

@ApiTags('SMB - Dashboard')
@ApiBearerAuth()
@Public() // TODO: Remove once authentication is implemented
@Controller('smb/dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('metrics')
  @ApiOperation({
    summary: 'Get dashboard metrics',
    description: 'Retrieve aggregate metrics for SMB dashboard homepage. Organization ID is extracted from JWT token or query parameter (dev mode).',
  })
  @ApiQuery({
    name: 'organizationId',
    required: false,
    description: 'Organization ID (optional during development when using @Public())',
    example: 'org_01tech',
  })
  @ApiResponse({
    status: 200,
    description: 'Dashboard metrics retrieved successfully',
    type: DashboardMetricsDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing JWT token',
  })
  async getMetrics(
    @OrgId() organizationId: string
  ): Promise<DashboardMetricsDto> {
    return await this.dashboardService.getMetrics(organizationId);
  }
}
