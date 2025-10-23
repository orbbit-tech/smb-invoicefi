import { Injectable, Inject } from '@nestjs/common';
import { Kysely } from 'kysely';
import type Database from '../../../../../src/types/db/Database';
import { DATABASE_TOKEN } from '../../database/database.constants';

export interface PositionsListParams {
  investorAddress: string;
  status?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

@Injectable()
export class PortfolioRepository {
  constructor(
    @Inject(DATABASE_TOKEN) private readonly db: Kysely<Database>
  ) {}

  /**
   * Get portfolio summary for an investor
   */
  async getSummary(investorAddress: string) {
    // Get all positions for the investor
    const positions = await this.db
      .selectFrom('investment.investorPosition as ip')
      .innerJoin('invoice.invoice as i', 'ip.invoiceId', 'i.id')
      .innerJoin('invoice.invoiceFundingDetail as fd', 'i.id', 'fd.invoiceId')
      .leftJoin('investment.yieldCalculation as yc', 'ip.id', 'yc.positionId')
      .select([
        'ip.positionStatus',
        'fd.fundedAmountCents',
        'fd.expectedRepaymentCents',
        'yc.actualYieldCents',
        'yc.settledAt',
      ] as any)
      .where('ip.investorAddress' as any, '=', investorAddress)
      .where('ip.deletedAt', 'is', null)
      .execute() as any;

    return positions;
  }

  /**
   * Get paginated list of investor positions
   */
  async getPositions(params: PositionsListParams) {
    const {
      investorAddress,
      status,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = params;

    let query = this.db
      .selectFrom('investment.investorPosition as ip')
      .innerJoin('invoice.invoice as i', 'ip.invoiceId', 'i.id')
      .innerJoin('blockchain.invoiceNft as nft', 'i.id', 'nft.invoiceId')
      .innerJoin('invoice.invoiceFundingDetail as fd', 'i.id', 'fd.invoiceId')
      .innerJoin('identity.organization as org', 'i.organizationId', 'org.id')
      .innerJoin('business.payerCompany as pc', 'i.payerCompanyId', 'pc.id')
      .leftJoin('investment.yieldCalculation as yc', 'ip.id', 'yc.positionId')
      .select([
        'ip.id',
        'ip.positionStatus',
        'ip.createdAt',
        'i.id as invoiceId',
        'i.invoiceNumber',
        'i.amountCents',
        'i.dueAt',
        'i.lifecycleStatus',
        'i.riskScore',
        'nft.tokenId',
        'nft.contractAddress',
        'nft.ownerAddress',
        'nft.metadataUri',
        'fd.fundedAmountCents',
        'fd.fundedAt',
        'fd.fundingTxHash',
        'fd.expectedRepaymentCents',
        'fd.expectedReturn',
        'pc.id as payerId',
        'pc.name as payerName',
        'pc.creditScore as payerCreditScore',
        'pc.industry as payerIndustry',
        'org.id as issuerId',
        'org.name as issuerName',
        'yc.actualYieldCents',
        'yc.settledAt',
      ] as any)
      .where('ip.investorAddress' as any, '=', investorAddress)
      .where('ip.deletedAt', 'is', null);

    // Apply status filter
    if (status) {
      query = query.where('ip.positionStatus', '=', status);
    }

    // Get total count
    const countQuery = query.select(({ fn }) => [fn.countAll<number>().as('count')]);
    const countResult = await countQuery.executeTakeFirst();
    const total = Number(countResult?.count || 0);

    // Apply sorting and pagination
    const orderByColumn = sortBy === 'createdAt' ? 'ip.createdAt' : `ip.${sortBy}`;
    query = query.orderBy(orderByColumn as any, sortOrder).limit(limit).offset((page - 1) * limit);

    const positions = await query.execute() as any;

    return {
      positions,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get single position by ID
   */
  async getPositionById(positionId: string, investorAddress: string) {
    return await this.db
      .selectFrom('investment.investorPosition as ip')
      .innerJoin('invoice.invoice as i', 'ip.invoiceId', 'i.id')
      .innerJoin('blockchain.invoiceNft as nft', 'i.id', 'nft.invoiceId')
      .innerJoin('invoice.invoiceFundingDetail as fd', 'i.id', 'fd.invoiceId')
      .innerJoin('identity.organization as org', 'i.organizationId', 'org.id')
      .innerJoin('business.payerCompany as pc', 'i.payerCompanyId', 'pc.id')
      .leftJoin('investment.yieldCalculation as yc', 'ip.id', 'yc.positionId')
      .select([
        'ip.id',
        'ip.positionStatus',
        'ip.createdAt',
        'i.id as invoiceId',
        'i.invoiceNumber',
        'i.amountCents',
        'i.dueAt',
        'i.lifecycleStatus',
        'i.riskScore',
        'nft.tokenId',
        'nft.contractAddress',
        'nft.ownerAddress',
        'nft.metadataUri',
        'fd.fundedAmountCents',
        'fd.fundedAt',
        'fd.fundingTxHash',
        'fd.expectedRepaymentCents',
        'fd.expectedReturn',
        'pc.id as payerId',
        'pc.name as payerName',
        'pc.creditScore as payerCreditScore',
        'pc.industry as payerIndustry',
        'org.id as issuerId',
        'org.name as issuerName',
        'yc.actualYieldCents',
        'yc.settledAt',
      ] as any)
      .where('ip.id', '=', positionId)
      .where('ip.investorAddress' as any, '=', investorAddress)
      .where('ip.deletedAt', 'is', null)
      .executeTakeFirst() as any;
  }
}
