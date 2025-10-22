import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiParam } from '@nestjs/swagger';
import { MarketplaceService } from './marketplace.service';
import { MarketplaceListResponseDto, MarketplaceDetailDto } from './marketplace.dto';

@ApiTags('Investor - Marketplace')
@Controller('api/investor/marketplace')
export class MarketplaceController {
  constructor(private readonly marketplaceService: MarketplaceService) {}

  @Get('invoices')
  @ApiOperation({
    summary: 'List marketplace invoices',
    description: 'Get paginated list of available invoices for funding with filtering',
  })
  @ApiQuery({ name: 'riskScore', required: false })
  @ApiQuery({ name: 'minApr', required: false, type: Number })
  @ApiQuery({ name: 'maxApr', required: false, type: Number })
  @ApiQuery({ name: 'minAmount', required: false, type: Number })
  @ApiQuery({ name: 'maxAmount', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'sortBy', required: false })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'] })
  @ApiResponse({
    status: 200,
    description: 'Marketplace invoices retrieved successfully',
    type: MarketplaceListResponseDto,
  })
  async listInvoices(
    @Query('riskScore') riskScore?: string,
    @Query('minApr') minApr?: number,
    @Query('maxApr') maxApr?: number,
    @Query('minAmount') minAmount?: number,
    @Query('maxAmount') maxAmount?: number,
    @Query('search') search?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc'
  ): Promise<MarketplaceListResponseDto> {
    return await this.marketplaceService.listInvoices(
      riskScore,
      minApr,
      maxApr,
      minAmount,
      maxAmount,
      search,
      page,
      limit,
      sortBy,
      sortOrder
    );
  }

  @Get('invoices/:id')
  @ApiOperation({
    summary: 'Get marketplace invoice detail',
    description: 'Retrieve detailed information about a specific marketplace invoice',
  })
  @ApiParam({ name: 'id', description: 'Invoice ID' })
  @ApiResponse({
    status: 200,
    description: 'Invoice detail retrieved successfully',
    type: MarketplaceDetailDto,
  })
  @ApiResponse({ status: 404, description: 'Invoice not found or not available in marketplace' })
  async getInvoiceDetail(@Param('id') id: string): Promise<MarketplaceDetailDto> {
    return await this.marketplaceService.getInvoiceDetail(id);
  }
}
