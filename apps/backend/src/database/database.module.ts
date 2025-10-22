import { Global, Module } from '@nestjs/common';
import { databaseProvider } from './database.provider';

/**
 * Global database module providing Kysely instance to all modules
 * No need to import this module explicitly in feature modules
 */
@Global()
@Module({
  providers: [databaseProvider],
  exports: [databaseProvider],
})
export class DatabaseModule {}
