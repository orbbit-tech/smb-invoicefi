import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiParam } from '@nestjs/swagger';
import { PortfolioService } from './portfolio.service';
import {
  PortfolioSummaryDto,
  InvestorPositionDto,
  PositionsListResponseDto,
} from './portfolio.dto';

@ApiTags('Investor - Portfolio')
@Controller('investor/portfolio')
export class PortfolioController {
  constructor(private readonly portfolioService: PortfolioService) {}

  @Get('summary')
  @ApiOperation({
    summary: 'Get portfolio summary',
    description: 'Retrieve aggregated portfolio metrics including total invested, returns, and position counts',
  })
  @ApiQuery({ name: 'investorAddress', required: true })
  @ApiResponse({
    status: 200,
    description: 'Portfolio summary retrieved successfully',
    type: PortfolioSummaryDto,
  })
  async getSummary(@Query('investorAddress') investorAddress: string): Promise<PortfolioSummaryDto> {
    return await this.portfolioService.getSummary(investorAddress);
  }

  @Get('positions')
  @ApiOperation({
    summary: 'List investor positions',
    description: 'Get paginated list of all investment positions with detailed information',
  })
  @ApiQuery({ name: 'investorAddress', required: true })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'sortBy', required: false })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'] })
  @ApiResponse({
    status: 200,
    description: 'Positions retrieved successfully',
    type: PositionsListResponseDto,
  })
  async getPositions(
    @Query('investorAddress') investorAddress: string,
    @Query('status') status?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc'
  ): Promise<PositionsListResponseDto> {
    return await this.portfolioService.getPositions(
      investorAddress,
      status,
      page,
      limit,
      sortBy,
      sortOrder
    );
  }

  @Get('positions/:id')
  @ApiOperation({
    summary: 'Get position detail',
    description: 'Retrieve detailed information about a specific investment position',
  })
  @ApiParam({ name: 'id', description: 'Position ID' })
  @ApiQuery({ name: 'investorAddress', required: true })
  @ApiResponse({
    status: 200,
    description: 'Position detail retrieved successfully',
    type: InvestorPositionDto,
  })
  @ApiResponse({ status: 404, description: 'Position not found' })
  async getPositionById(
    @Param('id') id: string,
    @Query('investorAddress') investorAddress: string
  ): Promise<InvestorPositionDto> {
    return await this.portfolioService.getPositionById(id, investorAddress);
  }
}
