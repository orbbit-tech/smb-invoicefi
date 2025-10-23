import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { PayersService } from './payers.service';
import { PayerCompanyDto } from './payers.dto';

@ApiTags('SMB - Payers')
@Controller('smb/payers')
export class PayersController {
  constructor(private readonly payersService: PayersService) {}

  @Get()
  @ApiOperation({
    summary: 'List payer companies',
    description: 'Get list of available payer companies for invoice creation',
  })
  @ApiQuery({ name: 'search', required: false, description: 'Search by name' })
  @ApiQuery({ name: 'industry', required: false, description: 'Filter by industry' })
  @ApiResponse({
    status: 200,
    description: 'Payer companies retrieved successfully',
    type: [PayerCompanyDto],
  })
  async list(
    @Query('search') search?: string,
    @Query('industry') industry?: string
  ): Promise<PayerCompanyDto[]> {
    return await this.payersService.list(search, industry);
  }
}
