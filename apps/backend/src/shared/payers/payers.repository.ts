import { Injectable, Inject } from '@nestjs/common';
import { Kysely } from 'kysely';
import type Database from '../../../../../src/types/db/Database';
import { DATABASE_TOKEN } from '../../database/database.constants';

@Injectable()
export class PayersRepository {
  constructor(
    @Inject(DATABASE_TOKEN) private readonly db: Kysely<Database>
  ) {}

  /**
   * Find payer company by ID with aggregated performance metrics
   */
  async findById(payerId: string) {
    // Get payer company details
    const payer = await this.db
      .selectFrom('business.payerCompany')
      .selectAll()
      .where('id', '=', payerId)
      .where('deletedAt', 'is', null)
      .executeTakeFirst();

    if (!payer) {
      return null;
    }

    // Get aggregated metrics from payer_relationship table
    const relationships = await this.db
      .selectFrom('business.payerRelationship as pr')
      .select([
        'pr.totalInvoicesCount',
        'pr.totalInvoicesValue',
        'pr.paidOnTimeCount',
        'pr.latePaymentCount',
        'pr.defaultCount',
        'pr.reliabilityScore',
      ])
      .where('pr.payerCompanyId', '=', payerId)
      .execute();

    return {
      payer,
      relationships,
    };
  }
}
