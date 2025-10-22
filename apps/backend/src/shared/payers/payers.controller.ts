import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { PayersService } from './payers.service';
import { PayerDetailDto } from './payers.dto';

@ApiTags('Shared - Payers')
@Controller('api/shared/payers')
export class PayersController {
  constructor(private readonly payersService: PayersService) {}

  @Get(':id')
  @ApiOperation({
    summary: 'Get payer detail',
    description: 'Retrieve detailed payer information including performance metrics and payment history',
  })
  @ApiParam({ name: 'id', description: 'Payer Company ID' })
  @ApiResponse({
    status: 200,
    description: 'Payer detail retrieved successfully',
    type: PayerDetailDto,
  })
  @ApiResponse({ status: 404, description: 'Payer not found' })
  async getPayerById(@Param('id') id: string): Promise<PayerDetailDto> {
    return await this.payersService.getPayerById(id);
  }
}
