import { Injectable, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as stytch from 'stytch';
import { Kysely } from 'kysely';
import type Database from '../../../../../src/types/db/Database';
import { DATABASE_TOKEN } from '../../database/database.constants';
import { STYTCH_SMB_CLIENT } from '../../stytch/stytch.provider';
import { BaseAuthService } from '../../shared/auth/base-auth.service';

/**
 * SMB-specific authentication service using SMB Stytch project
 */
@Injectable()
export class SMBAuthService extends BaseAuthService {
  constructor(
    @Inject(STYTCH_SMB_CLIENT)
    stytchClient: stytch.B2BClient,
    configService: ConfigService,
    @Inject(DATABASE_TOKEN) db: Kysely<Database>,
  ) {
    super(stytchClient, configService, db);
  }
}
