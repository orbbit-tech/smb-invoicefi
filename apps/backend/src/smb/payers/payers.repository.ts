import { Injectable, Inject } from '@nestjs/common';
import { Kysely } from 'kysely';
import type Database from '../../../../../src/types/db/Database';
import { DATABASE_TOKEN } from '../../database/database.constants';

@Injectable()
export class PayersRepository {
  constructor(
    @Inject(DATABASE_TOKEN) private readonly db: Kysely<Database>
  ) {}

  async list(search?: string, industry?: string) {
    let query = this.db
      .selectFrom('business.payerCompany')
      .selectAll()
      .where('deletedAt', 'is', null);

    if (search) {
      query = query.where((eb) =>
        eb.or([
          eb('name', 'ilike', `%${search}%`),
          eb('legalName', 'ilike', `%${search}%`),
        ])
      );
    }

    if (industry) {
      query = query.where('industry', '=', industry);
    }

    return await query.orderBy('name', 'asc').execute();
  }
}
