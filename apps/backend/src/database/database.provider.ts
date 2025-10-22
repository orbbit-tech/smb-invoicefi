import { Pool } from 'pg';
import { Kysely, PostgresDialect, CamelCasePlugin } from 'kysely';
import type Database from '../../../../src/types/db/Database';
import { DATABASE_TOKEN } from './database.constants';

export const databaseProvider = {
  provide: DATABASE_TOKEN,
  useFactory: (): Kysely<Database> => {
    // Create PostgreSQL connection pool
    const pool = new Pool({
      host: process.env.POSTGRES_HOST || 'localhost',
      port: Number(process.env.POSTGRES_PORT) || 54322,
      database: process.env.POSTGRES_DATABASE || 'postgres',
      user: process.env.POSTGRES_USER || 'postgres',
      password: process.env.POSTGRES_PASSWORD || 'postgres',
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });

    // Create Kysely instance with PostgreSQL dialect and CamelCase plugin
    const database = new Kysely<Database>({
      dialect: new PostgresDialect({ pool }),
      plugins: [new CamelCasePlugin()],
    });

    return database;
  },
};
