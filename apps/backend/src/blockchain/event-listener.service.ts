import { Injectable, Inject, OnModuleInit, Logger } from '@nestjs/common';
import { PublicClient } from 'viem';
import { Kysely } from 'kysely';
import type Database from '../../../../src/types/db/Database';
import { VIEM_CLIENT_TOKEN } from './blockchain.constants';
import { DATABASE_TOKEN } from '../database/database.constants';
import { ViemClients } from './blockchain.provider';
import { getBlockchainConfig } from './blockchain.config';

/**
 * Background service that listens to smart contract events
 * and syncs blockchain data to the database
 *
 * Events to listen for:
 * - InvoiceMinted: When a new invoice NFT is created
 * - InvoiceFunded: When an investor funds an invoice
 * - InvoiceRepaid: When an invoice is repaid
 * - Transfer: When an NFT is transferred (secondary market)
 */
@Injectable()
export class EventListenerService implements OnModuleInit {
  private readonly logger = new Logger(EventListenerService.name);
  private readonly publicClient: PublicClient;
  private readonly config: ReturnType<typeof getBlockchainConfig>;

  constructor(
    @Inject(VIEM_CLIENT_TOKEN) private readonly viemClients: ViemClients,
    @Inject(DATABASE_TOKEN) private readonly db: Kysely<Database>
  ) {
    this.publicClient = viemClients.publicClient;
    this.config = getBlockchainConfig();
  }

  async onModuleInit() {
    // Start listening to events when the module initializes
    // For MVP, we'll implement this as a polling mechanism
    // In production, use watchContractEvent for real-time listening
    this.logger.log('Event listener service initialized');
    this.logger.log(`Monitoring contracts on ${this.config.chainName} (Chain ID: ${this.config.chainId})`);

    // TODO: Implement event watching
    // this.watchInvoiceMintedEvents();
    // this.watchInvoiceFundedEvents();
    // this.watchInvoiceRepaidEvents();
  }

  /**
   * Watch for InvoiceMinted events
   * Triggered when a new invoice NFT is minted
   */
  private async watchInvoiceMintedEvents() {
    this.logger.log('Watching InvoiceMinted events...');

    // TODO: Implement with actual contract ABI
    // this.publicClient.watchContractEvent({
    //   address: this.config.invoiceContractAddress as `0x${string}`,
    //   abi: InvoiceABI,
    //   eventName: 'InvoiceMinted',
    //   onLogs: async (logs) => {
    //     for (const log of logs) {
    //       await this.handleInvoiceMinted(log);
    //     }
    //   },
    // });
  }

  /**
   * Watch for InvoiceFunded events
   * Triggered when an investor funds an invoice
   */
  private async watchInvoiceFundedEvents() {
    this.logger.log('Watching InvoiceFunded events...');

    // TODO: Implement with actual contract ABI
    // this.publicClient.watchContractEvent({
    //   address: this.config.fundingPoolContractAddress as `0x${string}`,
    //   abi: FundingPoolABI,
    //   eventName: 'InvoiceFunded',
    //   onLogs: async (logs) => {
    //     for (const log of logs) {
    //       await this.handleInvoiceFunded(log);
    //     }
    //   },
    // });
  }

  /**
   * Watch for InvoiceRepaid events
   * Triggered when an invoice is repaid
   */
  private async watchInvoiceRepaidEvents() {
    this.logger.log('Watching InvoiceRepaid events...');

    // TODO: Implement with actual contract ABI
  }

  /**
   * Handle InvoiceMinted event
   */
  private async handleInvoiceMinted(log: any) {
    this.logger.log(`Processing InvoiceMinted event: ${log.transactionHash}`);

    try {
      // Extract event data
      // const { tokenId, invoiceId, owner, mintedAt } = log.args;

      // Insert into blockchain.invoice_nft table
      // await this.db
      //   .insertInto('blockchain.invoiceNft')
      //   .values({
      //     invoiceId,
      //     tokenId: tokenId.toString(),
      //     contractAddress: this.config.invoiceContractAddress,
      //     ownerAddress: owner,
      //     mintedAt: BigInt(mintedAt),
      //     mintedTxHash: log.transactionHash,
      //     chainId: this.config.chainId,
      //   })
      //   .execute();

      // Update invoice on_chain_status
      // await this.db
      //   .updateTable('invoice.invoice')
      //   .set({ onChainStatus: 'LISTED' })
      //   .where('id', '=', invoiceId)
      //   .execute();

      this.logger.log(`Successfully processed InvoiceMinted event`);
    } catch (error) {
      this.logger.error(`Error processing InvoiceMinted event:`, error);
    }
  }

  /**
   * Handle InvoiceFunded event
   */
  private async handleInvoiceFunded(log: any) {
    this.logger.log(`Processing InvoiceFunded event: ${log.transactionHash}`);

    try {
      // Extract event data
      // const { tokenId, investor, amount, fundedAt } = log.args;

      // Insert into invoice.invoice_funding_detail
      // Insert into investment.investor_position
      // Update invoice lifecycle_status to 'FUNDED'
      // Update invoice_nft owner_address
      // Insert transaction record

      this.logger.log(`Successfully processed InvoiceFunded event`);
    } catch (error) {
      this.logger.error(`Error processing InvoiceFunded event:`, error);
    }
  }

  /**
   * Manually sync a specific invoice by ID
   * Useful for recovery or testing
   */
  async syncInvoiceById(invoiceId: string): Promise<void> {
    this.logger.log(`Manually syncing invoice: ${invoiceId}`);

    // TODO: Fetch invoice data from blockchain and update database

    this.logger.log(`Successfully synced invoice: ${invoiceId}`);
  }

  /**
   * Sync all invoices from a specific block range
   * Useful for initial sync or recovery
   */
  async syncFromBlock(fromBlock: bigint, toBlock?: bigint): Promise<void> {
    this.logger.log(`Syncing events from block ${fromBlock} to ${toBlock || 'latest'}`);

    // TODO: Fetch historical events and process them

    this.logger.log(`Successfully synced events`);
  }
}
