import { Injectable, Inject } from '@nestjs/common';
import { Kysely } from 'kysely';
import type Database from '../../../../../src/types/db/Database';
import { DATABASE_TOKEN } from '../../database/database.constants';

@Injectable()
export class ProfileRepository {
  constructor(
    @Inject(DATABASE_TOKEN) private readonly db: Kysely<Database>
  ) {}

  /**
   * Find user by ID
   */
  async findById(userId: string) {
    return await this.db
      .selectFrom('identity.user')
      .select([
        'id',
        'email',
        'walletAddress',
        'firstName',
        'lastName',
        'kycStatus',
        'isWhitelisted',
        'isAccreditedInvestor',
        'createdAt',
      ])
      .where('id', '=', userId)
      .where('deletedAt', 'is', null)
      .executeTakeFirst();
  }
}
