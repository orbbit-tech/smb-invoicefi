import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import postgres from 'postgres';

/**
 * Supabase Service
 *
 * Provides integration with Supabase PostgreSQL database
 * Supports both Supabase client (for Auth, Storage, Realtime)
 * and direct PostgreSQL connection (for raw queries)
 */
@Injectable()
export class SupabaseService implements OnModuleInit {
  private readonly logger = new Logger(SupabaseService.name);
  private supabaseClient: SupabaseClient;
  private postgresClient: postgres.Sql;

  onModuleInit() {
    this.initializeSupabase();
    this.initializePostgres();
  }

  /**
   * Initialize Supabase client
   * Uses Supabase's JavaScript client for Auth, Storage, Realtime features
   */
  private initializeSupabase() {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      this.logger.warn(
        'Supabase URL or Key not configured. Supabase client will not be available.'
      );
      return;
    }

    this.supabaseClient = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: false,
      },
    });

    this.logger.log('Supabase client initialized successfully');
  }

  /**
   * Initialize direct PostgreSQL connection
   * Uses postgres.js for raw SQL queries with better performance
   */
  private initializePostgres() {
    const databaseUrl = process.env.DATABASE_URL;

    if (!databaseUrl) {
      this.logger.warn(
        'DATABASE_URL not configured. Direct PostgreSQL connection will not be available.'
      );
      return;
    }

    this.postgresClient = postgres(databaseUrl, {
      max: 10, // Connection pool size
      idle_timeout: 20,
      connect_timeout: 10,
    });

    this.logger.log('PostgreSQL client initialized successfully');
  }

  /**
   * Get Supabase client instance
   * Use this for Supabase-specific features (Auth, Storage, Realtime)
   */
  getClient(): SupabaseClient {
    if (!this.supabaseClient) {
      throw new Error('Supabase client not initialized. Check your environment variables.');
    }
    return this.supabaseClient;
  }

  /**
   * Get PostgreSQL client instance
   * Use this for raw SQL queries with better performance
   */
  getPostgresClient(): postgres.Sql {
    if (!this.postgresClient) {
      throw new Error('PostgreSQL client not initialized. Check DATABASE_URL environment variable.');
    }
    return this.postgresClient;
  }

  /**
   * Execute a query using Supabase client
   * @param tableName - Name of the table
   * @returns Supabase query builder
   */
  from<T = any>(tableName: string) {
    return this.getClient().from(tableName) as any;
  }

  /**
   * Execute raw SQL query using postgres.js
   * @param query - SQL query string or template
   * @param params - Query parameters
   * @returns Query result
   *
   * @example
   * ```ts
   * // Using template strings
   * const result = await supabaseService.query`
   *   SELECT * FROM invoices WHERE id = ${invoiceId}
   * `;
   *
   * // Using parameterized queries
   * const result = await supabaseService.query(
   *   'SELECT * FROM invoices WHERE status = $1',
   *   ['listed']
   * );
   * ```
   */
  async query(query: TemplateStringsArray | string, ...params: any[]) {
    const sql = this.getPostgresClient();

    if (typeof query === 'string') {
      return sql.unsafe(query, params);
    }

    return sql(query, ...params);
  }

  /**
   * Execute a transaction
   * @param callback - Transaction callback
   * @returns Transaction result
   *
   * @example
   * ```ts
   * const result = await supabaseService.transaction(async (sql) => {
   *   await sql`INSERT INTO invoices ...`;
   *   await sql`INSERT INTO investor_shares ...`;
   *   return { success: true };
   * });
   * ```
   */
  async transaction<T>(
    callback: (sql: postgres.Sql) => Promise<T>
  ): Promise<T> {
    const sql = this.getPostgresClient();
    return sql.begin(callback) as Promise<T>;
  }

  /**
   * Health check for database connection
   * @returns true if connection is healthy
   */
  async healthCheck(): Promise<boolean> {
    try {
      const sql = this.getPostgresClient();
      await sql`SELECT 1`;
      return true;
    } catch (error) {
      this.logger.error('Database health check failed', error);
      return false;
    }
  }

  /**
   * Close all database connections
   * Call this on application shutdown
   */
  async onModuleDestroy() {
    if (this.postgresClient) {
      await this.postgresClient.end();
      this.logger.log('PostgreSQL client closed');
    }
  }
}
