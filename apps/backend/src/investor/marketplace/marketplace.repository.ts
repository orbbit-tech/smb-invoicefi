import { Injectable, Inject } from '@nestjs/common';
import { Kysely } from 'kysely';
import type Database from '../../../../../src/types/db/Database';
import { DATABASE_TOKEN } from '../../database/database.constants';

export interface MarketplaceListParams {
  riskScore?: string;
  minApr?: number;
  maxApr?: number;
  minAmount?: number;
  maxAmount?: number;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

@Injectable()
export class MarketplaceRepository {
  constructor(
    @Inject(DATABASE_TOKEN) private readonly db: Kysely<Database>
  ) {}

  /**
   * Get paginated list of marketplace invoices
   * Only shows LISTED invoices that are available for funding
   */
  async list(params: MarketplaceListParams) {
    const {
      riskScore,
      minApr,
      maxApr,
      minAmount,
      maxAmount,
      search,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = params;

    let query = this.db
      .selectFrom('invoice.invoice as i')
      .innerJoin('identity.organization as org', 'i.organizationId', 'org.id')
      .innerJoin('business.payerCompany as pc', 'i.payerCompanyId', 'pc.id')
      .leftJoin('blockchain.invoiceNft as nft', 'i.id', 'nft.invoiceId')
      .select([
        'i.id',
        'i.invoiceNumber',
        'i.amount',
        'i.apr',
        'i.discountRate',
        'i.invoiceDate',
        'i.dueAt',
        'i.lifecycleStatus',
        'i.riskScore',
        'i.createdAt',
        'org.id as issuerId',
        'org.name as issuerName',
        'org.legalName as issuerLegalName',
        'org.logoUrl as issuerLogoUrl',
        'pc.id as payerId',
        'pc.name as payerName',
        'pc.creditScore as payerCreditScore',
        'pc.industry as payerIndustry',
        'pc.paymentTermsDays as payerPaymentTermsDays',
        'pc.logoUrl as payerLogoUrl',
        'nft.tokenId as nftTokenId',
      ])
      .where('i.lifecycleStatus', '=', 'LISTED')
      .where('i.deletedAt', 'is', null);

    // Apply filters
    if (riskScore) {
      query = query.where('i.riskScore', '=', riskScore);
    }

    if (minApr !== undefined) {
      query = query.where('i.apr', '>=', minApr.toString());
    }

    if (maxApr !== undefined) {
      query = query.where('i.apr', '<=', maxApr.toString());
    }

    if (minAmount !== undefined) {
      query = query.where('i.amount', '>=', minAmount.toString());
    }

    if (maxAmount !== undefined) {
      query = query.where('i.amount', '<=', maxAmount.toString());
    }

    if (search) {
      query = query.where((eb) =>
        eb.or([
          eb('i.invoiceNumber', 'ilike', `%${search}%`),
          eb('org.name', 'ilike', `%${search}%`),
          eb('pc.name', 'ilike', `%${search}%`),
        ])
      );
    }

    // Get total count - create a separate count query from the base filtered query
    const countResult = await query
      .clearSelect()
      .select(({ fn }) => [fn.countAll<number>().as('count')])
      .executeTakeFirst();
    const total = Number(countResult?.count || 0);

    // Apply sorting and pagination
    const orderByColumn = sortBy === 'createdAt' ? 'i.createdAt' : `i.${sortBy}`;
    query = query.orderBy(orderByColumn as any, sortOrder).limit(limit).offset((page - 1) * limit);

    const invoices = await query.execute();

    return {
      invoices,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get single marketplace invoice by ID with full details
   */
  async findById(id: string) {
    const invoice = await this.db
      .selectFrom('invoice.invoice as i')
      .innerJoin('identity.organization as org', 'i.organizationId', 'org.id')
      .innerJoin('business.payerCompany as pc', 'i.payerCompanyId', 'pc.id')
      .leftJoin('blockchain.invoiceNft as nft', 'i.id', 'nft.invoiceId')
      .select([
        'i.id',
        'i.invoiceNumber',
        'i.amount',
        'i.apr',
        'i.discountRate',
        'i.invoiceDate',
        'i.dueAt',
        'i.lifecycleStatus',
        'i.riskScore',
        'i.description',
        'i.metadataUri',
        'i.createdAt',
        'org.id as issuerId',
        'org.name as issuerName',
        'org.legalName as issuerLegalName',
        'org.logoUrl as issuerLogoUrl',
        'pc.id as payerId',
        'pc.name as payerName',
        'pc.creditScore as payerCreditScore',
        'pc.industry as payerIndustry',
        'pc.paymentTermsDays as payerPaymentTermsDays',
        'pc.logoUrl as payerLogoUrl',
        'nft.tokenId as nftTokenId',
      ])
      .where('i.id', '=', id)
      .where('i.lifecycleStatus', '=', 'LISTED')
      .where('i.deletedAt', 'is', null)
      .executeTakeFirst();

    if (!invoice) {
      return null;
    }

    // Get underwriting details
    const underwriting = await this.db
      .selectFrom('invoice.invoiceUnderwriting')
      .selectAll()
      .where('invoiceId', '=', id)
      .executeTakeFirst();

    // Get documents
    const documents = await this.db
      .selectFrom('invoice.invoiceDocument')
      .selectAll()
      .where('invoiceId', '=', id)
      .where('deletedAt', 'is', null)
      .execute();

    return {
      invoice,
      underwriting,
      documents,
    };
  }
}
