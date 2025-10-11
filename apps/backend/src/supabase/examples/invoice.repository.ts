import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase.service';

/**
 * Example Invoice Repository
 *
 * Demonstrates how to use SupabaseService in your repositories
 * to interact with the invoice financing database
 */
@Injectable()
export class InvoiceRepository {
  constructor(private readonly supabase: SupabaseService) {}

  /**
   * Get all listed invoices (marketplace view)
   * Uses Supabase client for simple queries
   */
  async getListedInvoices() {
    const { data, error } = await this.supabase
      .from('invoices')
      .select(`
        *,
        organization:organizations (
          id,
          name,
          industry
        )
      `)
      .in('status', ['listed', 'partially_funded'])
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch invoices: ${error.message}`);
    }

    return data;
  }

  /**
   * Get invoice by ID with investor shares
   * Uses raw SQL for complex joins
   */
  async getInvoiceWithShares(invoiceId: string) {
    const result = await this.supabase.query`
      SELECT
        i.*,
        o.name as organization_name,
        o.industry,
        json_agg(
          json_build_object(
            'investor_id', is_shares.investor_id,
            'invested_amount', is_shares.invested_amount,
            'share_percentage', is_shares.share_percentage,
            'wallet_address', inv.wallet_address,
            'display_name', inv.display_name
          )
        ) FILTER (WHERE is_shares.id IS NOT NULL) as investor_shares
      FROM invoices i
      JOIN organizations o ON i.organization_id = o.id
      LEFT JOIN investor_shares is_shares ON i.id = is_shares.invoice_id
      LEFT JOIN investors inv ON is_shares.investor_id = inv.id
      WHERE i.id = ${invoiceId}
      GROUP BY i.id, o.name, o.industry
    `;

    return result[0] || null;
  }

  /**
   * Create a new invoice
   * Uses Supabase client for insert operations
   */
  async createInvoice(invoiceData: {
    organization_id: string;
    invoice_number: string;
    invoice_amount: number;
    payer_name: string;
    issue_date: string;
    due_date: string;
    fee_rate: number;
  }) {
    const { data, error } = await this.supabase
      .from('invoices')
      .insert([invoiceData])
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create invoice: ${error.message}`);
    }

    return data;
  }

  /**
   * Update invoice funding (when investor deposits USDC)
   * Uses transaction to ensure data consistency
   */
  async updateInvoiceFunding(
    invoiceId: string,
    investorId: string,
    amount: number
  ) {
    return this.supabase.transaction(async (sql) => {
      // 1. Get invoice details
      const [invoice] = await sql`
        SELECT id, total_funded, target_funding_amount
        FROM invoices
        WHERE id = ${invoiceId}
        FOR UPDATE
      `;

      if (!invoice) {
        throw new Error('Invoice not found');
      }

      const newTotalFunded = invoice.total_funded + amount;
      const sharePercentage = amount / invoice.target_funding_amount;

      // 2. Create investor share
      await sql`
        INSERT INTO investor_shares (
          invoice_id,
          investor_id,
          invested_amount,
          share_percentage
        )
        VALUES (
          ${invoiceId},
          ${investorId},
          ${amount},
          ${sharePercentage}
        )
      `;

      // 3. Update invoice total funded
      await sql`
        UPDATE invoices
        SET
          total_funded = ${newTotalFunded},
          updated_at = NOW()
        WHERE id = ${invoiceId}
      `;

      // 4. Create transaction record
      await sql`
        INSERT INTO transactions (
          type,
          amount,
          invoice_id,
          investor_id,
          status
        )
        VALUES (
          'deposit',
          ${amount},
          ${invoiceId},
          ${investorId},
          'confirmed'
        )
      `;

      return { success: true, newTotalFunded };
    });
  }

  /**
   * Get investor portfolio
   * Shows all investments for a specific investor
   */
  async getInvestorPortfolio(investorId: string) {
    const result = await this.supabase.query`
      SELECT
        is_shares.id,
        is_shares.invested_amount,
        is_shares.share_percentage,
        is_shares.expected_yield,
        is_shares.actual_yield,
        is_shares.is_repaid,
        is_shares.created_at,
        i.id as invoice_id,
        i.invoice_number,
        i.invoice_amount,
        i.status,
        i.due_date,
        i.payer_name,
        o.name as organization_name
      FROM investor_shares is_shares
      JOIN invoices i ON is_shares.invoice_id = i.id
      JOIN organizations o ON i.organization_id = o.id
      WHERE is_shares.investor_id = ${investorId}
      ORDER BY is_shares.created_at DESC
    `;

    return result;
  }

  /**
   * Mark invoice as repaid and calculate yields
   * Complex operation using transaction
   */
  async processInvoiceRepayment(invoiceId: string, repaymentAmount: number) {
    return this.supabase.transaction(async (sql) => {
      // 1. Get all investor shares for this invoice
      const shares = await sql`
        SELECT
          id,
          investor_id,
          invested_amount,
          share_percentage
        FROM investor_shares
        WHERE invoice_id = ${invoiceId}
      `;

      // 2. Calculate and update each investor's yield
      for (const share of shares) {
        const actualYield = Math.floor(
          (share.share_percentage * repaymentAmount) - share.invested_amount
        );

        await sql`
          UPDATE investor_shares
          SET
            actual_yield = ${actualYield},
            is_repaid = true,
            repaid_at = NOW()
          WHERE id = ${share.id}
        `;

        // 3. Create yield distribution transaction
        await sql`
          INSERT INTO transactions (
            type,
            amount,
            invoice_id,
            investor_id,
            investor_share_id,
            status,
            description
          )
          VALUES (
            'yield_distribution',
            ${actualYield},
            ${invoiceId},
            ${share.investor_id},
            ${share.id},
            'confirmed',
            'Yield distribution for repaid invoice'
          )
        `;
      }

      // 4. Update invoice status
      await sql`
        UPDATE invoices
        SET
          status = 'repaid',
          repaid_at = NOW(),
          actual_repayment_amount = ${repaymentAmount}
        WHERE id = ${invoiceId}
      `;

      return { success: true, sharesCount: shares.length };
    });
  }
}
