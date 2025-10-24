import { Injectable, Inject, OnModuleInit, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PublicClient } from 'viem';
import { Kysely } from 'kysely';
import type Database from '../../../../src/types/db/Database';
import { VIEM_CLIENT_TOKEN } from './blockchain.constants';
import { DATABASE_TOKEN } from '../database/database.constants';
import { ViemClients } from './blockchain.provider';
import { getBlockchainConfig } from './blockchain.config';
import { CdpWebhookData, parseEventData } from './dto/webhook-payload.dto';

/**
 * Event Listener Service
 * Processes blockchain events received from webhooks (Alchemy/CDP)
 * with polling backup, and syncs data to PostgreSQL database
 *
 * Events handled:
 * - InvoiceMinted: When a new invoice NFT is created
 * - InvoiceFunded: When an investor funds an invoice
 * - RepaymentDeposited: When repayment funds are deposited
 * - InvoiceSettled: When funds are distributed to investor
 * - InvoiceDefaulted: When an invoice defaults
 *
 * Polling backup runs every 5 minutes to catch any events webhooks might miss
 */
@Injectable()
export class EventListenerService implements OnModuleInit {
  private readonly logger = new Logger(EventListenerService.name);
  private readonly publicClient: PublicClient;
  private readonly config: ReturnType<typeof getBlockchainConfig>;
  private readonly processedTxHashes: Set<string> = new Set();
  private lastSyncedBlock: bigint = BigInt(0);
  private isPolling: boolean = false;

  constructor(
    @Inject(VIEM_CLIENT_TOKEN) private readonly viemClients: ViemClients,
    @Inject(DATABASE_TOKEN) private readonly db: Kysely<Database>
  ) {
    this.publicClient = viemClients.publicClient;
    this.config = getBlockchainConfig();
  }

  async onModuleInit() {
    this.logger.log('Event listener service initialized');
    this.logger.log(`Ready to process events on ${this.config.chainName} (Chain ID: ${this.config.chainId})`);

    const webhookProvider = this.config.webhook?.provider || 'alchemy';
    const pollingEnabled = this.config.webhook?.polling?.enabled || false;

    this.logger.log(`Primary event source: ${webhookProvider} webhooks`);
    if (pollingEnabled) {
      this.logger.log('Polling backup enabled (every 5 minutes)');
    } else {
      this.logger.log('Polling backup disabled');
    }

    // Initialize last synced block (start from recent block to avoid full history sync)
    try {
      const currentBlock = await this.publicClient.getBlockNumber();
      this.lastSyncedBlock = currentBlock - BigInt(100); // Start from 100 blocks ago
      this.logger.log(`Initialized polling from block: ${this.lastSyncedBlock}`);
    } catch (error) {
      this.logger.error('Failed to initialize last synced block:', error);
    }
  }

  /**
   * Check if transaction has already been processed (idempotency)
   */
  private async isTransactionProcessed(txHash: string): Promise<boolean> {
    if (this.processedTxHashes.has(txHash)) {
      return true;
    }

    const existing = await this.db
      .selectFrom('blockchain.transaction')
      .select('txHash')
      .where('txHash', '=', txHash)
      .executeTakeFirst();

    return !!existing;
  }

  /**
   * Mark transaction as processed
   */
  private markTransactionProcessed(txHash: string) {
    this.processedTxHashes.add(txHash);
    // Limit in-memory cache size
    if (this.processedTxHashes.size > 10000) {
      const firstItem = this.processedTxHashes.values().next().value;
      this.processedTxHashes.delete(firstItem);
    }
  }

  /**
   * Handle InvoiceMinted event
   * Creates NFT record and updates invoice status to LISTED
   */
  async handleInvoiceMinted(webhookData: CdpWebhookData) {
    const txHash = webhookData.transaction_hash;
    this.logger.log(`Processing InvoiceMinted event: ${txHash}`);

    try {
      // Check idempotency
      if (await this.isTransactionProcessed(txHash)) {
        this.logger.log(`Transaction ${txHash} already processed, skipping`);
        return;
      }

      const eventData = parseEventData<{
        tokenId: string;
        issuer: string;
        amount: string;
        dueAt: string;
        apr: string;
      }>(webhookData);

      // Find invoice by issuer wallet address
      const invoice = await this.db
        .selectFrom('identity.organization')
        .innerJoin('invoice.invoice', 'invoice.invoice.organizationId', 'identity.organization.id')
        .select(['invoice.invoice.id as invoiceId'])
        .where('identity.organization.walletAddress', '=', eventData.issuer)
        .where('invoice.invoice.onChainStatus', 'is', null)
        .orderBy('invoice.invoice.createdAt', 'desc')
        .executeTakeFirst();

      if (!invoice) {
        this.logger.error(`No matching invoice found for issuer ${eventData.issuer}`);
        return;
      }

      // Start transaction
      await this.db.transaction().execute(async (trx) => {
        // Insert NFT record
        await trx
          .insertInto('blockchain.invoiceNft')
          .values({
            id: `nft_${eventData.tokenId}`,
            invoiceId: invoice.invoiceId,
            tokenId: eventData.tokenId,
            contractAddress: webhookData.contract_address,
            chainId: this.config.chainId,
            ownerAddress: this.config.invoiceContractAddress, // Contract holds NFT initially
            metadataUri: `ipfs://invoice-${eventData.tokenId}`,
            mintedAt: String(webhookData.block_timestamp),
            mintedTxHash: txHash,
            createdAt: new Date(),
          })
          .execute();

        // Update invoice status
        await trx
          .updateTable('invoice.invoice')
          .set({
            onChainStatus: 'LISTED',
            lifecycleStatus: 'LISTED',
            updatedAt: new Date(),
          })
          .where('id', '=', invoice.invoiceId)
          .execute();

        // Insert transaction record
        await trx
          .insertInto('blockchain.transaction')
          .values({
            nftId: `nft_${eventData.tokenId}`,
            txHash,
            txType: 'MINT',
            fromAddress: '0x0000000000000000000000000000000000000000',
            toAddress: this.config.invoiceContractAddress,
            amount: '0',
            blockNumber: String(webhookData.block_height),
            blockTimestamp: String(webhookData.block_timestamp),
            status: 'CONFIRMED',
            createdAt: new Date(),
          })
          .execute();

        // Insert contract event
        await trx
          .insertInto('blockchain.contractEvent')
          .values({
            eventName: 'InvoiceMinted',
            contractAddress: webhookData.contract_address,
            txHash,
            blockNumber: String(webhookData.block_height),
            blockTimestamp: String(webhookData.block_timestamp),
            logIndex: webhookData.log_index,
            invoiceTokenId: eventData.tokenId,
            eventData: JSON.stringify(eventData),
            processed: true,
            createdAt: new Date(),
          })
          .execute();
      });

      this.markTransactionProcessed(txHash);
      this.logger.log(`Successfully processed InvoiceMinted event for token ${eventData.tokenId}`);
    } catch (error) {
      this.logger.error(`Error processing InvoiceMinted event:`, error);
      throw error;
    }
  }

  /**
   * Handle InvoiceFunded event
   * Creates funding record, investor position, and updates invoice status
   */
  async handleInvoiceFunded(webhookData: CdpWebhookData) {
    const txHash = webhookData.transaction_hash;
    this.logger.log(`Processing InvoiceFunded event: ${txHash}`);

    try {
      if (await this.isTransactionProcessed(txHash)) {
        this.logger.log(`Transaction ${txHash} already processed, skipping`);
        return;
      }

      const eventData = parseEventData<{
        tokenId: string;
        investor: string;
        amount: string;
        fundedAt: string;
      }>(webhookData);

      // Find NFT and invoice
      const nft = await this.db
        .selectFrom('blockchain.invoiceNft')
        .select(['id', 'invoiceId'])
        .where('tokenId', '=', eventData.tokenId)
        .executeTakeFirstOrThrow();

      const invoice = await this.db
        .selectFrom('invoice.invoice')
        .select(['id', 'amount', 'apr', 'dueAt', 'organizationId'])
        .where('id', '=', nft.invoiceId)
        .executeTakeFirstOrThrow();

      // Find or create investor user
      let investorUser = await this.db
        .selectFrom('identity.user')
        .select('id')
        .where('walletAddress', '=', eventData.investor)
        .executeTakeFirst();

      if (!investorUser) {
        await this.db
          .insertInto('identity.user')
          .values({
            id: `user_${eventData.investor.slice(2, 18)}`,
            email: `${eventData.investor}@temp.orbbit.co`,
            walletAddress: eventData.investor,
            createdAt: new Date(),
          })
          .execute();

        investorUser = { id: `user_${eventData.investor.slice(2, 18)}` };
      }

      // Calculate expected return
      const principal = BigInt(eventData.amount);
      const apr = BigInt(invoice.apr);
      const dueAt = BigInt(invoice.dueAt);
      const fundedAt = BigInt(eventData.fundedAt);
      const durationDays = Number((dueAt - fundedAt) / BigInt(86400));

      // expectedReturn = principal * (1 + apr * days / 365)
      // Using 6 decimal precision
      const yieldAmount = (principal * apr * BigInt(durationDays)) / (BigInt(1000000) * BigInt(365));
      const expectedReturn = principal + yieldAmount;

      await this.db.transaction().execute(async (trx) => {
        // Insert funding detail
        await trx
          .insertInto('invoice.invoiceFundingDetail')
          .values({
            id: `fund_${eventData.tokenId}`,
            invoiceId: invoice.id,
            investorAddress: eventData.investor,
            fundedAmount: eventData.amount,
            fundedAt: String(eventData.fundedAt),
            fundingTxHash: txHash,
            paymentTokenAddress: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', // USDC on Base
            expectedRepayment: expectedReturn.toString(),
            expectedReturn: yieldAmount.toString(),
            createdAt: new Date(),
          })
          .execute();

        // Insert investor position
        await trx
          .insertInto('investment.investorPosition')
          .values({
            id: `pos_${eventData.tokenId}`,
            userId: investorUser!.id,
            invoiceId: invoice.id,
            nftId: nft.id,
            principalAmount: eventData.amount,
            expectedReturn: expectedReturn.toString(),
            apr: invoice.apr,
            fundedAt: String(eventData.fundedAt),
            maturityDate: invoice.dueAt,
            positionStatus: 'ACTIVE',
            createdAt: new Date(),
          })
          .execute();

        // Update invoice status
        await trx
          .updateTable('invoice.invoice')
          .set({
            onChainStatus: 'FUNDED',
            lifecycleStatus: 'AWAITING_PAYMENT',
            updatedAt: new Date(),
          })
          .where('id', '=', invoice.id)
          .execute();

        // Update NFT owner
        await trx
          .updateTable('blockchain.invoiceNft')
          .set({
            ownerAddress: eventData.investor,
            updatedAt: new Date(),
          })
          .where('id', '=', nft.id)
          .execute();

        // Insert transaction record
        await trx
          .insertInto('blockchain.transaction')
          .values({
            nftId: nft.id,
            txHash,
            txType: 'FUNDING',
            fromAddress: eventData.investor,
            toAddress: invoice.organizationId, // Funds go to organization
            amount: eventData.amount,
            blockNumber: String(webhookData.block_height),
            blockTimestamp: String(webhookData.block_timestamp),
            status: 'CONFIRMED',
            createdAt: new Date(),
          })
          .execute();

        // Insert contract event
        await trx
          .insertInto('blockchain.contractEvent')
          .values({
            eventName: 'InvoiceFunded',
            contractAddress: webhookData.contract_address,
            txHash,
            blockNumber: String(webhookData.block_height),
            blockTimestamp: String(webhookData.block_timestamp),
            logIndex: webhookData.log_index,
            invoiceTokenId: eventData.tokenId,
            eventData: JSON.stringify(eventData),
            processed: true,
            createdAt: new Date(),
          })
          .execute();
      });

      this.markTransactionProcessed(txHash);
      this.logger.log(`Successfully processed InvoiceFunded event for token ${eventData.tokenId}`);
    } catch (error) {
      this.logger.error(`Error processing InvoiceFunded event:`, error);
      throw error;
    }
  }

  /**
   * Handle RepaymentDeposited event
   * Records repayment deposit (intermediate step before settlement)
   */
  async handleRepaymentDeposited(webhookData: CdpWebhookData) {
    const txHash = webhookData.transaction_hash;
    this.logger.log(`Processing RepaymentDeposited event: ${txHash}`);

    try {
      if (await this.isTransactionProcessed(txHash)) {
        this.logger.log(`Transaction ${txHash} already processed, skipping`);
        return;
      }

      const eventData = parseEventData<{
        tokenId: string;
        amount: string;
        depositedBy: string;
        depositedAt: string;
      }>(webhookData);

      const nft = await this.db
        .selectFrom('blockchain.invoiceNft')
        .select(['id', 'invoiceId'])
        .where('tokenId', '=', eventData.tokenId)
        .executeTakeFirstOrThrow();

      await this.db.transaction().execute(async (trx) => {
        // Update invoice status to FULLY_PAID
        await trx
          .updateTable('invoice.invoice')
          .set({
            onChainStatus: 'FULLY_PAID',
            lifecycleStatus: 'FULLY_PAID',
            updatedAt: new Date(),
          })
          .where('id', '=', nft.invoiceId)
          .execute();

        // Insert transaction record
        await trx
          .insertInto('blockchain.transaction')
          .values({
            nftId: nft.id,
            txHash,
            txType: 'REPAYMENT',
            fromAddress: eventData.depositedBy,
            toAddress: webhookData.contract_address,
            amount: eventData.amount,
            blockNumber: String(webhookData.block_height),
            blockTimestamp: String(webhookData.block_timestamp),
            status: 'CONFIRMED',
            createdAt: new Date(),
          })
          .execute();

        // Insert contract event
        await trx
          .insertInto('blockchain.contractEvent')
          .values({
            eventName: 'RepaymentDeposited',
            contractAddress: webhookData.contract_address,
            txHash,
            blockNumber: String(webhookData.block_height),
            blockTimestamp: String(webhookData.block_timestamp),
            logIndex: webhookData.log_index,
            invoiceTokenId: eventData.tokenId,
            eventData: JSON.stringify(eventData),
            processed: true,
            createdAt: new Date(),
          })
          .execute();
      });

      this.markTransactionProcessed(txHash);
      this.logger.log(`Successfully processed RepaymentDeposited event for token ${eventData.tokenId}`);
    } catch (error) {
      this.logger.error(`Error processing RepaymentDeposited event:`, error);
      throw error;
    }
  }

  /**
   * Handle InvoiceSettled/InvoiceRepaid event
   * Records final settlement and distribution to investor
   */
  async handleInvoiceRepaid(webhookData: CdpWebhookData) {
    const txHash = webhookData.transaction_hash;
    this.logger.log(`Processing InvoiceSettled event: ${txHash}`);

    try {
      if (await this.isTransactionProcessed(txHash)) {
        this.logger.log(`Transaction ${txHash} already processed, skipping`);
        return;
      }

      const eventData = parseEventData<{
        tokenId: string;
        investor: string;
        principal: string;
        yield: string;
        totalAmount: string;
        settledAt: string;
      }>(webhookData);

      const nft = await this.db
        .selectFrom('blockchain.invoiceNft')
        .select(['id', 'invoiceId'])
        .where('tokenId', '=', eventData.tokenId)
        .executeTakeFirstOrThrow();

      const position = await this.db
        .selectFrom('investment.investorPosition')
        .select('id')
        .where('nftId', '=', nft.id)
        .executeTakeFirstOrThrow();

      await this.db.transaction().execute(async (trx) => {
        // Insert repayment record
        await trx
          .insertInto('invoice.invoiceRepayment')
          .values({
            id: `rep_${eventData.tokenId}`,
            invoiceId: nft.invoiceId,
            repaymentAmount: eventData.totalAmount,
            depositedBy: eventData.investor, // Contract sends to investor
            depositedAt: String(eventData.settledAt),
            settledAt: String(eventData.settledAt),
            repaymentTxHash: txHash,
            settlementTxHash: txHash,
            repaymentMethod: 'WALLET',
            createdAt: new Date(),
          })
          .execute();

        // Insert repayment distribution
        await trx
          .insertInto('investment.repaymentDistribution')
          .values({
            id: `dist_${eventData.tokenId}`,
            positionId: position.id,
            invoiceId: nft.invoiceId,
            investorAddress: eventData.investor,
            principalReturned: eventData.principal,
            yieldReceived: eventData.yield,
            totalAmount: eventData.totalAmount,
            distributedAt: String(eventData.settledAt),
            distributionTxHash: txHash,
            createdAt: new Date(),
          })
          .execute();

        // Update invoice status to SETTLED
        await trx
          .updateTable('invoice.invoice')
          .set({
            onChainStatus: 'SETTLED',
            lifecycleStatus: 'SETTLED',
            updatedAt: new Date(),
          })
          .where('id', '=', nft.invoiceId)
          .execute();

        // Update investor position
        await trx
          .updateTable('investment.investorPosition')
          .set({
            actualReturn: eventData.totalAmount,
            positionStatus: 'CLOSED',
            updatedAt: new Date(),
          })
          .where('id', '=', position.id)
          .execute();

        // Insert transaction record
        await trx
          .insertInto('blockchain.transaction')
          .values({
            nftId: nft.id,
            txHash,
            txType: 'SETTLEMENT',
            fromAddress: webhookData.contract_address,
            toAddress: eventData.investor,
            amount: eventData.totalAmount,
            blockNumber: String(webhookData.block_height),
            blockTimestamp: String(webhookData.block_timestamp),
            status: 'CONFIRMED',
            createdAt: new Date(),
          })
          .execute();

        // Insert contract event
        await trx
          .insertInto('blockchain.contractEvent')
          .values({
            eventName: 'InvoiceSettled',
            contractAddress: webhookData.contract_address,
            txHash,
            blockNumber: String(webhookData.block_height),
            blockTimestamp: String(webhookData.block_timestamp),
            logIndex: webhookData.log_index,
            invoiceTokenId: eventData.tokenId,
            eventData: JSON.stringify(eventData),
            processed: true,
            createdAt: new Date(),
          })
          .execute();
      });

      this.markTransactionProcessed(txHash);
      this.logger.log(`Successfully processed InvoiceSettled event for token ${eventData.tokenId}`);
    } catch (error) {
      this.logger.error(`Error processing InvoiceSettled event:`, error);
      throw error;
    }
  }

  /**
   * Handle InvoiceDefaulted event
   * Marks invoice as defaulted and updates investor position
   */
  async handleInvoiceDefaulted(webhookData: CdpWebhookData) {
    const txHash = webhookData.transaction_hash;
    this.logger.log(`Processing InvoiceDefaulted event: ${txHash}`);

    try {
      if (await this.isTransactionProcessed(txHash)) {
        this.logger.log(`Transaction ${txHash} already processed, skipping`);
        return;
      }

      const eventData = parseEventData<{
        tokenId: string;
        investor: string;
        principal: string;
        defaultedAt: string;
      }>(webhookData);

      const nft = await this.db
        .selectFrom('blockchain.invoiceNft')
        .select(['id', 'invoiceId'])
        .where('tokenId', '=', eventData.tokenId)
        .executeTakeFirstOrThrow();

      const position = await this.db
        .selectFrom('investment.investorPosition')
        .select('id')
        .where('nftId', '=', nft.id)
        .executeTakeFirstOrThrow();

      await this.db.transaction().execute(async (trx) => {
        // Insert default record
        await trx
          .insertInto('invoice.invoiceDefault')
          .values({
            id: `def_${eventData.tokenId}`,
            invoiceId: nft.invoiceId,
            defaultedAt: String(eventData.defaultedAt),
            gracePeriodEnd: String(eventData.defaultedAt),
            collectionStatus: 'IN_PROGRESS',
            recoveredAmount: '0',
            notes: 'Automatically marked as defaulted by smart contract',
            createdAt: new Date(),
          })
          .execute();

        // Update invoice status
        await trx
          .updateTable('invoice.invoice')
          .set({
            onChainStatus: 'DEFAULTED',
            lifecycleStatus: 'COLLECTION',
            updatedAt: new Date(),
          })
          .where('id', '=', nft.invoiceId)
          .execute();

        // Update investor position
        await trx
          .updateTable('investment.investorPosition')
          .set({
            actualReturn: '0',
            positionStatus: 'DEFAULTED',
            updatedAt: new Date(),
          })
          .where('id', '=', position.id)
          .execute();

        // Insert contract event
        await trx
          .insertInto('blockchain.contractEvent')
          .values({
            eventName: 'InvoiceDefaulted',
            contractAddress: webhookData.contract_address,
            txHash,
            blockNumber: String(webhookData.block_height),
            blockTimestamp: String(webhookData.block_timestamp),
            logIndex: webhookData.log_index,
            invoiceTokenId: eventData.tokenId,
            eventData: JSON.stringify(eventData),
            processed: true,
            createdAt: new Date(),
          })
          .execute();
      });

      this.markTransactionProcessed(txHash);
      this.logger.log(`Successfully processed InvoiceDefaulted event for token ${eventData.tokenId}`);
    } catch (error) {
      this.logger.error(`Error processing InvoiceDefaulted event:`, error);
      throw error;
    }
  }

  /**
   * Polling backup - runs every 5 minutes
   * Catches any events that webhooks might have missed
   */
  @Cron('*/5 * * * *') // Every 5 minutes
  async pollBlockchainEvents() {
    // Only poll if enabled in config
    if (!this.config.webhook?.polling?.enabled) {
      return;
    }

    // Prevent concurrent polling
    if (this.isPolling) {
      this.logger.warn('Polling already in progress, skipping this run');
      return;
    }

    this.isPolling = true;

    try {
      const latestBlock = await this.publicClient.getBlockNumber();

      // Skip if no new blocks
      if (latestBlock <= this.lastSyncedBlock) {
        this.isPolling = false;
        return;
      }

      this.logger.log(`Polling blocks ${this.lastSyncedBlock + BigInt(1)} to ${latestBlock}`);

      await this.syncFromBlock(this.lastSyncedBlock + BigInt(1), latestBlock);

      this.lastSyncedBlock = latestBlock;
      this.logger.log(`Polling complete. Synced up to block ${latestBlock}`);
    } catch (error) {
      this.logger.error('Error during polling:', error);
    } finally {
      this.isPolling = false;
    }
  }

  /**
   * Manually sync a specific invoice by ID
   * Useful for recovery or testing
   */
  async syncInvoiceById(invoiceId: string): Promise<void> {
    this.logger.log(`Manually syncing invoice: ${invoiceId}`);

    // Get invoice tokenId from database
    const invoice = await this.db
      .selectFrom('invoice.invoice')
      .innerJoin('blockchain.invoiceNft', 'blockchain.invoiceNft.invoiceId', 'invoice.invoice.id')
      .select('blockchain.invoiceNft.tokenId')
      .where('invoice.invoice.id', '=', invoiceId)
      .executeTakeFirst();

    if (!invoice) {
      this.logger.error(`Invoice not found: ${invoiceId}`);
      return;
    }

    // Query blockchain for all events related to this token
    this.logger.log(`Syncing events for tokenId: ${invoice.tokenId}`);

    // Get current block for range
    const toBlock = await this.publicClient.getBlockNumber();
    const fromBlock = toBlock - BigInt(10000); // Last ~10k blocks (adjust as needed)

    await this.syncFromBlock(fromBlock, toBlock);

    this.logger.log(`Successfully synced invoice: ${invoiceId}`);
  }

  /**
   * Sync all invoices from a specific block range
   * Queries blockchain and processes events
   * Uses chunked processing to respect Alchemy free tier limits (10 blocks per request)
   */
  async syncFromBlock(fromBlock: bigint, toBlock?: bigint): Promise<void> {
    const targetBlock = toBlock || (await this.publicClient.getBlockNumber());

    this.logger.log(`Syncing events from block ${fromBlock} to ${targetBlock}`);

    // Get max block range from config (default 10 for Alchemy free tier)
    const maxBlockRange = BigInt(this.config.webhook?.polling?.maxBlockRangePerQuery || 10);
    const totalBlocks = targetBlock - fromBlock + BigInt(1);

    // If range is within limit, process directly
    if (totalBlocks <= maxBlockRange) {
      await this.syncBlockChunk(fromBlock, targetBlock);
      return;
    }

    // Otherwise, split into chunks
    this.logger.log(`Splitting ${totalBlocks} blocks into chunks of ${maxBlockRange} blocks`);

    let currentFromBlock = fromBlock;
    let chunkCount = 0;

    while (currentFromBlock <= targetBlock) {
      const currentToBlock = currentFromBlock + maxBlockRange - BigInt(1);
      const chunkEndBlock = currentToBlock > targetBlock ? targetBlock : currentToBlock;

      chunkCount++;
      this.logger.log(`Processing chunk ${chunkCount}: blocks ${currentFromBlock} to ${chunkEndBlock}`);

      try {
        await this.syncBlockChunk(currentFromBlock, chunkEndBlock);
      } catch (error) {
        this.logger.error(`Error processing chunk ${chunkCount} (blocks ${currentFromBlock}-${chunkEndBlock}):`, error);

        // If we still get a block range error, try with even smaller chunks
        if (error.message?.includes('block range') && maxBlockRange > BigInt(1)) {
          this.logger.warn(`Retrying chunk ${chunkCount} with smaller range...`);
          await this.syncBlockChunkWithRetry(currentFromBlock, chunkEndBlock, maxBlockRange / BigInt(2));
        } else {
          throw error;
        }
      }

      currentFromBlock = chunkEndBlock + BigInt(1);

      // Small delay between chunks to avoid rate limiting
      if (currentFromBlock <= targetBlock) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    this.logger.log(`Successfully synced all ${chunkCount} chunks from block ${fromBlock} to ${targetBlock}`);
  }

  /**
   * Sync a single chunk of blocks
   */
  private async syncBlockChunk(fromBlock: bigint, toBlock: bigint): Promise<void> {
    try {
      // Get all contract events in parallel
      const [invoiceMintedLogs, invoiceFundedLogs, repaymentDepositedLogs, invoiceSettledLogs, invoiceDefaultedLogs] =
        await Promise.all([
          // InvoiceMinted events (ERC721 Transfer from 0x0)
          this.publicClient.getLogs({
            address: this.config.invoiceContractAddress as `0x${string}`,
            event: {
              type: 'event',
              name: 'Transfer',
              inputs: [
                { type: 'address', indexed: true, name: 'from' },
                { type: 'address', indexed: true, name: 'to' },
                { type: 'uint256', indexed: true, name: 'tokenId' },
              ],
            },
            fromBlock,
            toBlock,
          }),

          // InvoiceFunded events
          this.publicClient.getLogs({
            address: this.config.invoiceFundingPoolContractAddress as `0x${string}`,
            fromBlock,
            toBlock,
          }),

          // RepaymentDeposited events
          this.publicClient.getLogs({
            address: this.config.invoiceFundingPoolContractAddress as `0x${string}`,
            fromBlock,
            toBlock,
          }),

          // InvoiceSettled events
          this.publicClient.getLogs({
            address: this.config.invoiceFundingPoolContractAddress as `0x${string}`,
            fromBlock,
            toBlock,
          }),

          // InvoiceDefaulted events
          this.publicClient.getLogs({
            address: this.config.invoiceFundingPoolContractAddress as `0x${string}`,
            fromBlock,
            toBlock,
          }),
        ]);

      // Process InvoiceMinted events (Transfer from 0x0)
      for (const log of invoiceMintedLogs) {
        if (log.args.from === '0x0000000000000000000000000000000000000000') {
          const webhookData = this.convertLogToWebhookData(log, 'InvoiceMinted');
          await this.handleInvoiceMinted(webhookData);
        }
      }

      // Process other events (simplified - in production, filter by event signature)
      // Note: You'll need to add proper event signature filtering based on your contract ABI
      this.logger.log(`Processed ${invoiceMintedLogs.length} InvoiceMinted events`);
      this.logger.log(`Found ${invoiceFundedLogs.length + repaymentDepositedLogs.length + invoiceSettledLogs.length + invoiceDefaultedLogs.length} other contract events`);
    } catch (error) {
      this.logger.error(`Error syncing chunk from block ${fromBlock} to ${toBlock}:`, error);
      throw error;
    }
  }

  /**
   * Retry syncing a chunk with a smaller block range
   */
  private async syncBlockChunkWithRetry(fromBlock: bigint, toBlock: bigint, retryMaxRange: bigint): Promise<void> {
    this.logger.log(`Retrying with smaller range of ${retryMaxRange} blocks`);

    let currentFromBlock = fromBlock;

    while (currentFromBlock <= toBlock) {
      const currentToBlock = currentFromBlock + retryMaxRange - BigInt(1);
      const chunkEndBlock = currentToBlock > toBlock ? toBlock : currentToBlock;

      await this.syncBlockChunk(currentFromBlock, chunkEndBlock);
      currentFromBlock = chunkEndBlock + BigInt(1);

      // Small delay between retries
      if (currentFromBlock <= toBlock) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
  }

  /**
   * Convert viem log to webhook data format
   * Helper for polling to reuse webhook handlers
   */
  private convertLogToWebhookData(log: any, eventName: string): CdpWebhookData {
    return {
      network_id: this.config.chainId === 8453 ? 'base-mainnet' : 'base-sepolia',
      block_height: Number(log.blockNumber),
      block_hash: log.blockHash,
      block_timestamp: '', // Not available in log, will be fetched if needed
      transaction_hash: log.transactionHash,
      transaction_index: log.transactionIndex,
      log_index: log.logIndex,
      contract_address: log.address.toLowerCase(),
      event_name: eventName,
      event_data: log.args,
      from_address: log.args?.from,
      to_address: log.args?.to,
      token_id: log.args?.tokenId?.toString(),
    } as CdpWebhookData;
  }
}
