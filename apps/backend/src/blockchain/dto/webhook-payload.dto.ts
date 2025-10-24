/**
 * DTOs for CDP Webhook Payloads
 * Based on Coinbase Developer Platform webhook event structures
 */

/**
 * Base webhook payload structure from CDP
 */
export interface CdpWebhookPayload {
  id: string;
  type: string; // 'wallet.transfer' | 'erc721.transfer' | 'smart_contract_event'
  created_at: string;
  data: CdpWebhookData;
}

/**
 * Webhook data containing event details
 */
export interface CdpWebhookData {
  network_id: string; // 'base-mainnet' | 'base-sepolia'
  block_height: number;
  block_hash: string;
  block_timestamp: string;
  transaction_hash: string;
  transaction_index: number;
  log_index: number;
  contract_address: string;
  event_signature?: string;
  event_name?: string;
  event_data?: Record<string, any>;
  from_address?: string;
  to_address?: string;
  token_id?: string;
}

/**
 * Invoice Minted Event Data
 * Emitted when a new invoice NFT is created
 */
export interface InvoiceMintedEventData {
  tokenId: string;
  issuer: string; // Organization wallet address
  amount: string; // Invoice amount in wei (6 decimals for USDC)
  dueAt: string; // Unix timestamp
  apr: string; // APR in basis points (6 decimals)
}

/**
 * Invoice Funded Event Data
 * Emitted when an investor funds an invoice
 */
export interface InvoiceFundedEventData {
  tokenId: string;
  investor: string; // Investor wallet address
  amount: string; // Funded amount in wei
  fundedAt: string; // Unix timestamp
  paymentToken: string; // USDC contract address
}

/**
 * Invoice Repaid Event Data
 * Emitted when an invoice is repaid
 */
export interface InvoiceRepaidEventData {
  tokenId: string;
  amount: string; // Repayment amount in wei
  repaidAt: string; // Unix timestamp
  repaidBy: string; // Organization wallet address
}

/**
 * Repayment Deposited Event Data
 * Emitted when repayment is deposited to contract
 */
export interface RepaymentDepositedEventData {
  tokenId: string;
  amount: string;
  depositedBy: string;
  depositedAt: string;
}

/**
 * Invoice Settled Event Data
 * Emitted when funds are distributed to investor
 */
export interface InvoiceSettledEventData {
  tokenId: string;
  investor: string;
  principal: string;
  yield: string;
  totalAmount: string;
  settledAt: string;
}

/**
 * Invoice Defaulted Event Data
 * Emitted when an invoice defaults
 */
export interface InvoiceDefaultedEventData {
  tokenId: string;
  investor: string;
  principal: string;
  defaultedAt: string;
}

/**
 * ERC721 Transfer Event Data (NFT ownership transfer)
 */
export interface Erc721TransferEventData {
  from: string;
  to: string;
  tokenId: string;
}

/**
 * Helper to parse event data from CDP webhook
 */
export function parseEventData<T>(webhookData: CdpWebhookData): T {
  if (!webhookData.event_data) {
    throw new Error('No event data in webhook payload');
  }
  return webhookData.event_data as T;
}

/**
 * Helper to get event type from webhook
 */
export function getEventType(payload: CdpWebhookPayload): string {
  return payload.data.event_name || payload.type;
}

/**
 * Helper to validate webhook payload structure
 */
export function isValidWebhookPayload(payload: any): payload is CdpWebhookPayload {
  return (
    payload &&
    typeof payload.id === 'string' &&
    typeof payload.type === 'string' &&
    payload.data &&
    typeof payload.data.transaction_hash === 'string'
  );
}
