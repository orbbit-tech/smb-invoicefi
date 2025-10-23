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
  ApiBearerAuth,
} from '@nestjs/swagger';
import { InvoicesService } from './invoices.service';
import {
  InvoiceListResponseDto,
  InvoiceDetailDto,
  CreateInvoiceDto,
  UpdateInvoiceDto,
  InvoiceStatusHistoryDto,
} from './invoices.dto';
import { OrgId } from '../../shared/auth/org-id.decorator';
import { Public } from '../../shared/auth/public.decorator';

@ApiTags('SMB - Invoices')
@ApiBearerAuth()
@Public() // TODO: Remove once authentication is implemented
@Controller('smb/invoices')
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Get()
  @ApiOperation({
    summary: 'List invoices',
    description: 'Get paginated list of invoices with filtering and sorting. Organization ID is extracted from JWT token or query parameter (dev mode).',
  })
  @ApiQuery({
    name: 'organizationId',
    required: false,
    description: 'Organization ID (optional during development when using @Public())',
    example: 'org_01tech',
  })
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
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing JWT token',
  })
  async list(
    @OrgId() organizationId: string,
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
    description: 'Retrieve detailed invoice information including documents and status history. Organization ID is extracted from JWT token or query parameter (dev mode).',
  })
  @ApiParam({ name: 'id', description: 'Invoice ID' })
  @ApiQuery({
    name: 'organizationId',
    required: false,
    description: 'Organization ID (optional during development when using @Public())',
    example: 'org_01tech',
  })
  @ApiResponse({
    status: 200,
    description: 'Invoice retrieved successfully',
    type: InvoiceDetailDto,
  })
  @ApiResponse({ status: 404, description: 'Invoice not found' })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing JWT token',
  })
  async getById(
    @Param('id') id: string,
    @OrgId() organizationId: string
  ): Promise<InvoiceDetailDto> {
    return await this.invoicesService.getById(id, organizationId);
  }

  @Post()
  @ApiOperation({
    summary: 'Create invoice',
    description: 'Create a new invoice in DRAFT status. Organization ID is extracted from JWT token.',
  })
  @ApiResponse({
    status: 201,
    description: 'Invoice created successfully',
    type: InvoiceDetailDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing JWT token',
  })
  async create(
    @OrgId() organizationId: string,
    @Body() dto: CreateInvoiceDto
  ): Promise<InvoiceDetailDto> {
    return await this.invoicesService.create(organizationId, dto);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update invoice',
    description: 'Update invoice details (only DRAFT status invoices can be updated). Organization ID is extracted from JWT token.',
  })
  @ApiParam({ name: 'id', description: 'Invoice ID' })
  @ApiResponse({
    status: 200,
    description: 'Invoice updated successfully',
    type: InvoiceDetailDto,
  })
  @ApiResponse({ status: 400, description: 'Invoice cannot be updated (not in DRAFT status)' })
  @ApiResponse({ status: 404, description: 'Invoice not found' })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing JWT token',
  })
  async update(
    @Param('id') id: string,
    @OrgId() organizationId: string,
    @Body() dto: UpdateInvoiceDto
  ): Promise<InvoiceDetailDto> {
    return await this.invoicesService.update(id, organizationId, dto);
  }

  @Get(':id/status-history')
  @ApiOperation({
    summary: 'Get invoice status history',
    description: 'Retrieve complete status transition history for an invoice. Organization ID is extracted from JWT token or query parameter (dev mode).',
  })
  @ApiParam({ name: 'id', description: 'Invoice ID' })
  @ApiQuery({
    name: 'organizationId',
    required: false,
    description: 'Organization ID (optional during development when using @Public())',
    example: 'org_01tech',
  })
  @ApiResponse({
    status: 200,
    description: 'Status history retrieved successfully',
    type: [InvoiceStatusHistoryDto],
  })
  @ApiResponse({ status: 404, description: 'Invoice not found' })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing JWT token',
  })
  async getStatusHistory(
    @Param('id') id: string,
    @OrgId() organizationId: string
  ): Promise<InvoiceStatusHistoryDto[]> {
    return await this.invoicesService.getStatusHistory(id, organizationId);
  }
}
