import { Injectable, Inject } from '@nestjs/common';
import { Kysely } from 'kysely';
import type Database from '../../../../../src/types/db/Database';
import { DATABASE_TOKEN } from '../../database/database.constants';

@Injectable()
export class DashboardRepository {
  constructor(
    @Inject(DATABASE_TOKEN) private readonly db: Kysely<Database>
  ) {}

  /**
   * Get aggregate metrics for SMB dashboard
   */
  async getMetrics(organizationId: string) {
    // Total invoices submitted
    const totalInvoicesResult = await this.db
      .selectFrom('invoice.invoice')
      .select(({ fn }) => [fn.countAll<number>().as('count')])
      .where('organizationId', '=', organizationId)
      .where('deletedAt', 'is', null)
      .executeTakeFirst();

    const totalInvoicesSubmitted = Number(totalInvoicesResult?.count || 0);

    // Active funding amount (LISTED or FULLY_FUNDED status)
    const activeFundingResult = await this.db
      .selectFrom('invoice.invoice')
      .select(({ fn }) => [fn.sum<string>('amountCents').as('sum')])
      .where('organizationId', '=', organizationId)
      .where('lifecycleStatus', 'in', ['LISTED', 'FULLY_FUNDED'])
      .where('deletedAt', 'is', null)
      .executeTakeFirst();

    const activeFundingAmount = Number(activeFundingResult?.sum || 0);

    // Total funded to date (all invoices that have been funded)
    const totalFundedResult = await this.db
      .selectFrom('invoice.invoice')
      .select(({ fn }) => [fn.sum<string>('amountCents').as('sum')])
      .where('organizationId', '=', organizationId)
      .where('lifecycleStatus', 'in', [
        'FULLY_FUNDED',
        'DISBURSED',
        'PENDING_REPAYMENT',
        'PARTIALLY_REPAID',
        'FULLY_REPAID',
        'SETTLED',
      ])
      .where('deletedAt', 'is', null)
      .executeTakeFirst();

    const totalFundedToDate = Number(totalFundedResult?.sum || 0);

    // Pending repayments (PENDING_REPAYMENT or PARTIALLY_REPAID status)
    const pendingRepaymentsResult = await this.db
      .selectFrom('invoice.invoice')
      .select(({ fn }) => [fn.sum<string>('amountCents').as('sum')])
      .where('organizationId', '=', organizationId)
      .where('lifecycleStatus', 'in', ['PENDING_REPAYMENT', 'PARTIALLY_REPAID'])
      .where('deletedAt', 'is', null)
      .executeTakeFirst();

    const pendingRepayments = Number(pendingRepaymentsResult?.sum || 0);

    return {
      totalInvoicesSubmitted,
      activeFundingAmount,
      totalFundedToDate,
      pendingRepayments,
    };
  }
}
