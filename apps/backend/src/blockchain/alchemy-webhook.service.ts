import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as crypto from 'crypto';
import { getBlockchainConfig } from './blockchain.config';

/**
 * Alchemy Webhook Service
 * Manages webhook subscriptions with Alchemy Notify API
 * for real-time blockchain event notifications on Base network
 *
 * Documentation: https://docs.alchemy.com/reference/notify-api-quickstart
 */
@Injectable()
export class AlchemyWebhookService implements OnModuleInit {
  private readonly logger = new Logger(AlchemyWebhookService.name);
  private readonly config: ReturnType<typeof getBlockchainConfig>;
  private readonly alchemyApiKey: string;
  private readonly alchemySigningKey: string;

  constructor() {
    this.config = getBlockchainConfig();
    this.alchemyApiKey = process.env.ALCHEMY_API_KEY || '';
    this.alchemySigningKey = process.env.ALCHEMY_WEBHOOK_SIGNING_KEY || '';
  }

  async onModuleInit() {
    try {
      // Only initialize if Alchemy is the selected webhook provider
      if (process.env.WEBHOOK_PROVIDER !== 'alchemy') {
        this.logger.log('Alchemy webhooks not enabled (WEBHOOK_PROVIDER != alchemy)');
        return;
      }

      if (!this.alchemyApiKey || !this.alchemySigningKey) {
        this.logger.warn(
          'Alchemy API credentials not configured. Set ALCHEMY_API_KEY and ALCHEMY_WEBHOOK_SIGNING_KEY environment variables.'
        );
        return;
      }

      this.logger.log('Alchemy Webhook Service initialized successfully');
      this.logger.log(`Monitoring Base network: ${this.config.chainName} (Chain ID: ${this.config.chainId})`);
      this.logger.log('Webhooks must be configured via Alchemy Dashboard: https://dashboard.alchemy.com/webhooks');
      this.logger.log('See ALCHEMY_WEBHOOK_SETUP.md for detailed setup instructions');
    } catch (error) {
      this.logger.error('Failed to initialize Alchemy Webhook Service:', error);
    }
  }

  /**
   * Verify webhook signature to ensure authenticity
   * Alchemy signs all webhook payloads using HMAC SHA-256
   *
   * @param body - Raw request body as string
   * @param signature - X-Alchemy-Signature header value
   * @returns true if signature is valid
   */
  verifyWebhookSignature(body: string, signature: string): boolean {
    try {
      if (!this.alchemySigningKey) {
        this.logger.error('Alchemy signing key not configured');
        return false;
      }

      // Generate HMAC SHA-256 hash
      const hmac = crypto.createHmac('sha256', this.alchemySigningKey);
      hmac.update(body, 'utf8');
      const digest = hmac.digest('hex');

      // Compare signatures (timing-safe comparison)
      const isValid = crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(digest)
      );

      if (!isValid) {
        this.logger.warn('Invalid Alchemy webhook signature detected');
      }

      return isValid;
    } catch (error) {
      this.logger.error('Error verifying Alchemy webhook signature:', error);
      return false;
    }
  }

  /**
   * Create a custom webhook via Alchemy API
   * Note: In production, webhooks are typically created via dashboard
   *
   * @param webhookUrl - Your public webhook endpoint URL
   * @param contractAddresses - Array of contract addresses to monitor
   * @returns Webhook ID if successful
   */
  async createWebhook(
    webhookUrl: string,
    contractAddresses: string[]
  ): Promise<string | null> {
    try {
      const network = this.config.chainId === 8453 ? 'BASE_MAINNET' : 'BASE_SEPOLIA';

      // Alchemy Webhook API endpoint
      const apiUrl = 'https://dashboard.alchemy.com/api/create-webhook';

      const payload = {
        network,
        webhook_type: 'GRAPHQL',
        webhook_url: webhookUrl,
        graphql_query: {
          skip_empty_messages: true,
          block: {
            logs: {
              address: contractAddresses,
              topics: [], // Listen to all events
            },
          },
        },
      };

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Alchemy-Token': this.alchemyApiKey,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to create webhook: ${error}`);
      }

      const result = await response.json();
      this.logger.log(`Created Alchemy webhook: ${result.id}`);

      return result.id;
    } catch (error) {
      this.logger.error('Failed to create Alchemy webhook:', error);
      return null;
    }
  }

  /**
   * List all active webhooks for this Alchemy app
   * Useful for debugging and monitoring
   */
  async listWebhooks(): Promise<any[]> {
    try {
      const apiUrl = 'https://dashboard.alchemy.com/api/team-webhooks';

      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'X-Alchemy-Token': this.alchemyApiKey,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to list webhooks: ${response.statusText}`);
      }

      const result = await response.json();
      return result.data || [];
    } catch (error) {
      this.logger.error('Failed to list Alchemy webhooks:', error);
      return [];
    }
  }

  /**
   * Delete a webhook by ID
   *
   * @param webhookId - Webhook ID to delete
   */
  async deleteWebhook(webhookId: string): Promise<boolean> {
    try {
      const apiUrl = `https://dashboard.alchemy.com/api/delete-webhook`;

      const response = await fetch(apiUrl, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'X-Alchemy-Token': this.alchemyApiKey,
        },
        body: JSON.stringify({ webhook_id: webhookId }),
      });

      if (!response.ok) {
        throw new Error(`Failed to delete webhook: ${response.statusText}`);
      }

      this.logger.log(`Deleted Alchemy webhook: ${webhookId}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to delete Alchemy webhook ${webhookId}:`, error);
      return false;
    }
  }

  /**
   * Test webhook by sending a test notification
   *
   * @param webhookId - Webhook ID to test
   */
  async testWebhook(webhookId: string): Promise<boolean> {
    try {
      const apiUrl = `https://dashboard.alchemy.com/api/test-webhook`;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Alchemy-Token': this.alchemyApiKey,
        },
        body: JSON.stringify({ webhook_id: webhookId }),
      });

      if (!response.ok) {
        throw new Error(`Failed to test webhook: ${response.statusText}`);
      }

      this.logger.log(`Test notification sent for webhook: ${webhookId}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to test webhook ${webhookId}:`, error);
      return false;
    }
  }

  /**
   * Get webhook statistics and health
   *
   * @param webhookId - Webhook ID
   */
  async getWebhookStats(webhookId: string): Promise<any> {
    try {
      const apiUrl = `https://dashboard.alchemy.com/api/webhook-stats/${webhookId}`;

      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'X-Alchemy-Token': this.alchemyApiKey,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to get webhook stats: ${response.statusText}`);
      }

      const stats = await response.json();
      return stats;
    } catch (error) {
      this.logger.error(`Failed to get webhook stats for ${webhookId}:`, error);
      return null;
    }
  }

  /**
   * Setup webhooks for invoice contracts
   * Called manually or via API endpoint
   */
  async setupInvoiceWebhooks(): Promise<void> {
    const webhookUrl = process.env.ALCHEMY_WEBHOOK_URL;

    if (!webhookUrl) {
      this.logger.error('ALCHEMY_WEBHOOK_URL not configured');
      return;
    }

    const contractAddresses = [
      this.config.invoiceContractAddress,
      this.config.invoiceFundingPoolContractAddress,
    ].filter(Boolean);

    if (contractAddresses.length === 0) {
      this.logger.warn('No contract addresses configured. Deploy contracts first.');
      return;
    }

    this.logger.log('Setting up Alchemy webhooks for contracts:', contractAddresses);

    const webhookId = await this.createWebhook(webhookUrl, contractAddresses);

    if (webhookId) {
      this.logger.log(`✅ Alchemy webhook created successfully: ${webhookId}`);
      this.logger.log(`Webhook URL: ${webhookUrl}`);
      this.logger.log(`Monitoring contracts: ${contractAddresses.join(', ')}`);
    } else {
      this.logger.error('❌ Failed to create Alchemy webhook');
      this.logger.log('Please create webhook manually via Alchemy Dashboard:');
      this.logger.log('https://dashboard.alchemy.com/webhooks');
    }
  }
}
