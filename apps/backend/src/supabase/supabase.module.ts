import { Module, Global } from '@nestjs/common';
import { SupabaseService } from './supabase.service';

/**
 * Supabase Module
 *
 * Global module that provides Supabase client and PostgreSQL connection
 * throughout the application. Import this module in AppModule.
 *
 * @example
 * ```ts
 * // In your service:
 * @Injectable()
 * export class InvoiceService {
 *   constructor(private readonly supabase: SupabaseService) {}
 *
 *   async getInvoices() {
 *     // Using Supabase client
 *     const { data, error } = await this.supabase
 *       .from('invoices')
 *       .select('*')
 *       .eq('status', 'listed');
 *
 *     // Or using raw SQL
 *     const result = await this.supabase.query`
 *       SELECT * FROM invoices WHERE status = 'listed'
 *     `;
 *
 *     return data || result;
 *   }
 * }
 * ```
 */
@Global()
@Module({
  providers: [SupabaseService],
  exports: [SupabaseService],
})
export class SupabaseModule {}
