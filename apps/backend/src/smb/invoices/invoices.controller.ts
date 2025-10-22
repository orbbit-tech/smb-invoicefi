import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Query,
  Body,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { InvoicesService } from './invoices.service';
import {
  InvoiceListResponseDto,
  InvoiceDetailDto,
  CreateInvoiceDto,
  UpdateInvoiceDto,
  InvoiceStatusHistoryDto,
} from './invoices.dto';

@ApiTags('SMB - Invoices')
@Controller('api/smb/invoices')
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Get()
  @ApiOperation({
    summary: 'List invoices',
    description: 'Get paginated list of invoices with filtering and sorting',
  })
  @ApiQuery({ name: 'organizationId', required: true })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'sortBy', required: false })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'] })
  @ApiResponse({
    status: 200,
    description: 'Invoices retrieved successfully',
    type: InvoiceListResponseDto,
  })
  async list(
    @Query('organizationId') organizationId: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc'
  ): Promise<InvoiceListResponseDto> {
    return await this.invoicesService.list(
      organizationId,
      status,
      search,
      page,
      limit,
      sortBy,
      sortOrder
    );
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get invoice by ID',
    description: 'Retrieve detailed invoice information including documents and status history',
  })
  @ApiParam({ name: 'id', description: 'Invoice ID' })
  @ApiQuery({ name: 'organizationId', required: true })
  @ApiResponse({
    status: 200,
    description: 'Invoice retrieved successfully',
    type: InvoiceDetailDto,
  })
  @ApiResponse({ status: 404, description: 'Invoice not found' })
  async getById(
    @Param('id') id: string,
    @Query('organizationId') organizationId: string
  ): Promise<InvoiceDetailDto> {
    return await this.invoicesService.getById(id, organizationId);
  }

  @Post()
  @ApiOperation({
    summary: 'Create invoice',
    description: 'Create a new invoice in DRAFT status',
  })
  @ApiQuery({ name: 'organizationId', required: true })
  @ApiResponse({
    status: 201,
    description: 'Invoice created successfully',
    type: InvoiceDetailDto,
  })
  async create(
    @Query('organizationId') organizationId: string,
    @Body() dto: CreateInvoiceDto
  ): Promise<InvoiceDetailDto> {
    return await this.invoicesService.create(organizationId, dto);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update invoice',
    description: 'Update invoice details (only DRAFT status invoices can be updated)',
  })
  @ApiParam({ name: 'id', description: 'Invoice ID' })
  @ApiQuery({ name: 'organizationId', required: true })
  @ApiResponse({
    status: 200,
    description: 'Invoice updated successfully',
    type: InvoiceDetailDto,
  })
  @ApiResponse({ status: 400, description: 'Invoice cannot be updated (not in DRAFT status)' })
  @ApiResponse({ status: 404, description: 'Invoice not found' })
  async update(
    @Param('id') id: string,
    @Query('organizationId') organizationId: string,
    @Body() dto: UpdateInvoiceDto
  ): Promise<InvoiceDetailDto> {
    return await this.invoicesService.update(id, organizationId, dto);
  }

  @Get(':id/status-history')
  @ApiOperation({
    summary: 'Get invoice status history',
    description: 'Retrieve complete status transition history for an invoice',
  })
  @ApiParam({ name: 'id', description: 'Invoice ID' })
  @ApiQuery({ name: 'organizationId', required: true })
  @ApiResponse({
    status: 200,
    description: 'Status history retrieved successfully',
    type: [InvoiceStatusHistoryDto],
  })
  @ApiResponse({ status: 404, description: 'Invoice not found' })
  async getStatusHistory(
    @Param('id') id: string,
    @Query('organizationId') organizationId: string
  ): Promise<InvoiceStatusHistoryDto[]> {
    return await this.invoicesService.getStatusHistory(id, organizationId);
  }
}
