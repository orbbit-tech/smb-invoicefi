import { Kysely, Transaction as KyselyTransaction, Selectable, Insertable, Updateable } from 'kysely';
import type Database from '../../../../src/types/db/Database';

/**
 * Base repository with generic CRUD operations for typed entities
 * Follows the pattern from orbbit-monorepo with schema-aware table names
 */
export abstract class BaseRepository<
  TSelect,
  TInsert,
  TUpdate
> {
  constructor(
    protected readonly db: Kysely<Database>,
    protected readonly schema: string,
    protected readonly tableName: string
  ) {}

  /**
   * Get database instance (transaction-aware)
   */
  protected getDb(trx?: KyselyTransaction<Database>): Kysely<Database> | KyselyTransaction<Database> {
    return trx || this.db;
  }

  /**
   * Get the fully qualified table name (schema.table)
   */
  protected get fullTableName(): string {
    return `${this.schema}.${this.tableName}` as any;
  }

  /**
   * Find a single record by ID
   */
  async findById(
    id: string,
    trx?: KyselyTransaction<Database>
  ): Promise<TSelect | undefined> {
    const db = this.getDb(trx);
    return await db
      .selectFrom(this.fullTableName)
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst() as TSelect | undefined;
  }

  /**
   * Find all records with optional filtering
   */
  async findAll(
    trx?: KyselyTransaction<Database>
  ): Promise<TSelect[]> {
    const db = this.getDb(trx);
    return await db
      .selectFrom(this.fullTableName)
      .selectAll()
      .execute() as TSelect[];
  }

  /**
   * Create a new record
   */
  async create(
    data: TInsert,
    trx?: KyselyTransaction<Database>
  ): Promise<TSelect> {
    const db = this.getDb(trx);
    return await db
      .insertInto(this.fullTableName)
      .values(data)
      .returningAll()
      .executeTakeFirstOrThrow() as TSelect;
  }

  /**
   * Update a record by ID
   */
  async update(
    id: string,
    data: TUpdate,
    trx?: KyselyTransaction<Database>
  ): Promise<TSelect> {
    const db = this.getDb(trx);
    return await db
      .updateTable(this.fullTableName)
      .set(data)
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirstOrThrow() as TSelect;
  }

  /**
   * Delete a record by ID (hard delete)
   */
  async delete(
    id: string,
    trx?: KyselyTransaction<Database>
  ): Promise<void> {
    const db = this.getDb(trx);
    await db
      .deleteFrom(this.fullTableName)
      .where('id', '=', id)
      .execute();
  }

  /**
   * Soft delete a record by ID (sets deletedAt)
   */
  async softDelete(
    id: string,
    trx?: KyselyTransaction<Database>
  ): Promise<TSelect> {
    const db = this.getDb(trx);
    return await db
      .updateTable(this.fullTableName)
      .set({ deletedAt: new Date() } as any)
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirstOrThrow() as TSelect;
  }

  /**
   * Execute queries in a transaction
   */
  async transaction<T>(
    callback: (trx: KyselyTransaction<Database>) => Promise<T>
  ): Promise<T> {
    return await this.db.transaction().execute(callback);
  }
}
