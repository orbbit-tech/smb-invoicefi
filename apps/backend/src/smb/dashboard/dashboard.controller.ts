import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { DashboardMetricsDto } from './dashboard.dto';

@ApiTags('SMB - Dashboard')
@Controller('api/smb/dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('metrics')
  @ApiOperation({
    summary: 'Get dashboard metrics',
    description: 'Retrieve aggregate metrics for SMB dashboard homepage',
  })
  @ApiQuery({
    name: 'organizationId',
    description: 'Organization ID (in production, this would come from JWT)',
    required: true,
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Dashboard metrics retrieved successfully',
    type: DashboardMetricsDto,
  })
  async getMetrics(
    @Query('organizationId') organizationId: string
  ): Promise<DashboardMetricsDto> {
    // TODO: In production, extract organizationId from JWT token
    // const organizationId = req.user.organizationId;
    return await this.dashboardService.getMetrics(organizationId);
  }
}
