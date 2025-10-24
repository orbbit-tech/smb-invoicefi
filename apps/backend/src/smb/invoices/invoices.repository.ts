import { Injectable, Inject } from '@nestjs/common';
import { Kysely } from 'kysely';
import type Database from '../../../../../src/types/db/Database';
import { DATABASE_TOKEN } from '../../database/database.constants';

export interface InvoiceListParams {
  organizationId: string;
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

@Injectable()
export class InvoicesRepository {
  constructor(
    @Inject(DATABASE_TOKEN) private readonly db: Kysely<Database>
  ) {}

  /**
   * Get paginated list of invoices with filtering
   */
  async list(params: InvoiceListParams) {
    const {
      organizationId,
      status,
      search,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = params;

    let query = this.db
      .selectFrom('invoice.invoice as i')
      .innerJoin('business.payerCompany as pc', 'i.payerCompanyId', 'pc.id')
      .select([
        'i.id',
        'i.invoiceNumber',
        'i.amount',
        'i.apr',
        'i.discountRate',
        'i.invoiceDate',
        'i.dueAt',
        'i.lifecycleStatus',
        'i.onChainStatus',
        'i.riskScore',
        'i.createdAt',
        'pc.id as payerId',
        'pc.name as payerName',
        'pc.creditScore as payerCreditScore',
        'pc.industry as payerIndustry',
        'pc.logoUrl as payerLogoUrl',
      ])
      .where('i.organizationId', '=', organizationId)
      .where('i.deletedAt', 'is', null);

    // Apply filters
    if (status) {
      query = query.where('i.lifecycleStatus', '=', status);
    }

    if (search) {
      query = query.where((eb) =>
        eb.or([
          eb('i.invoiceNumber', 'ilike', `%${search}%`),
          eb('pc.name', 'ilike', `%${search}%`),
        ])
      );
    }

    // Get total count - use separate query to avoid GROUP BY issues
    let countQuery = this.db
      .selectFrom('invoice.invoice as i')
      .innerJoin('business.payerCompany as pc', 'i.payerCompanyId', 'pc.id')
      .select(({ fn }) => [fn.countAll<number>().as('count')])
      .where('i.organizationId', '=', organizationId)
      .where('i.deletedAt', 'is', null);

    // Apply same filters to count query
    if (status) {
      countQuery = countQuery.where('i.lifecycleStatus', '=', status);
    }
    if (search) {
      countQuery = countQuery.where((eb) =>
        eb.or([
          eb('i.invoiceNumber', 'ilike', `%${search}%`),
          eb('pc.name', 'ilike', `%${search}%`),
        ])
      );
    }

    const countResult = await countQuery.executeTakeFirst();
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
   * Get single invoice by ID with all details
   */
  async findById(id: string, organizationId: string) {
    const invoice = await this.db
      .selectFrom('invoice.invoice as i')
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
        'i.onChainStatus',
        'i.riskScore',
        'i.description',
        'i.metadataUri',
        'i.createdAt',
        'pc.id as payerId',
        'pc.name as payerName',
        'pc.creditScore as payerCreditScore',
        'pc.industry as payerIndustry',
        'pc.logoUrl as payerLogoUrl',
        'nft.tokenId as nftTokenId',
        'nft.contractAddress as nftContractAddress',
        'nft.ownerAddress as nftOwnerAddress',
        'nft.mintedAt as nftMintedAt',
        'nft.mintedTxHash as nftMintedTxHash',
      ])
      .where('i.id', '=', id)
      .where('i.organizationId', '=', organizationId)
      .where('i.deletedAt', 'is', null)
      .executeTakeFirst();

    if (!invoice) {
      return null;
    }

    // Get documents
    const documents = await this.db
      .selectFrom('invoice.invoiceDocument')
      .selectAll()
      .where('invoiceId', '=', id)
      .where('deletedAt', 'is', null)
      .execute();

    // Get status history
    const statusHistory = await this.db
      .selectFrom('invoice.invoiceStatusHistory')
      .selectAll()
      .where('invoiceId', '=', id)
      .orderBy('changedAt', 'desc')
      .execute();

    return {
      invoice,
      documents,
      statusHistory,
    };
  }

  /**
   * Create a new invoice
   */
  async create(data: {
    organizationId: string;
    payerCompanyId: string;
    amount: string;
    invoiceNumber: string;
    invoiceDate: string;
    dueAt: string;
    description?: string;
  }) {
    return await this.db.transaction().execute(async (trx) => {
      // Insert invoice
      const invoice = await trx
        .insertInto('invoice.invoice')
        .values({
          organizationId: data.organizationId,
          payerCompanyId: data.payerCompanyId,
          amount: data.amount,
          invoiceNumber: data.invoiceNumber,
          invoiceDate: data.invoiceDate,
          dueAt: data.dueAt,
          description: data.description,
          lifecycleStatus: 'DRAFT',
        })
        .returningAll()
        .executeTakeFirstOrThrow();

      // Insert initial status history
      await trx
        .insertInto('invoice.invoiceStatusHistory')
        .values({
          invoiceId: invoice.id,
          fromStatus: '',
          toStatus: 'DRAFT',
          changedAt: Math.floor(Date.now() / 1000).toString(),
          reason: 'Invoice created',
        })
        .execute();

      return invoice;
    });
  }

  /**
   * Update an invoice (only allowed in DRAFT status)
   */
  async update(id: string, organizationId: string, data: Partial<{
    payerCompanyId: string;
    amount: string;
    invoiceNumber: string;
    invoiceDate: string;
    dueAt: string;
    description: string;
    lifecycleStatus: string;
  }>) {
    return await this.db
      .updateTable('invoice.invoice')
      .set(data)
      .where('id', '=', id)
      .where('organizationId', '=', organizationId)
      .where('lifecycleStatus', '=', 'DRAFT')  // Only allow updates for DRAFT invoices
      .returningAll()
      .executeTakeFirst();
  }

  /**
   * Get status history for an invoice
   */
  async getStatusHistory(invoiceId: string, organizationId: string) {
    // Verify invoice belongs to organization
    const invoice = await this.db
      .selectFrom('invoice.invoice')
      .select('id')
      .where('id', '=', invoiceId)
      .where('organizationId', '=', organizationId)
      .executeTakeFirst();

    if (!invoice) {
      return null;
    }

    return await this.db
      .selectFrom('invoice.invoiceStatusHistory')
      .selectAll()
      .where('invoiceId', '=', invoiceId)
      .orderBy('changedAt', 'desc')
      .execute();
  }

  /**
   * Insert invoice documents
   */
  async insertDocuments(invoiceId: string, documents: Array<{
    documentType: string;
    fileUrl: string;
    fileName: string;
    fileSizeBytes: number;
    mimeType: string;
  }>) {
    if (!documents || documents.length === 0) {
      return [];
    }

    return await this.db
      .insertInto('invoice.invoiceDocument')
      .values(
        documents.map((doc) => ({
          invoiceId,
          documentType: doc.documentType,
          fileUrl: doc.fileUrl,
          fileName: doc.fileName,
          fileSizeBytes: BigInt(doc.fileSizeBytes),
          mimeType: doc.mimeType,
        }))
      )
      .returningAll()
      .execute();
  }
}
