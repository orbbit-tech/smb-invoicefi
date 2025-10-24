/**
 * DTOs for Alchemy Webhook Payloads
 * Based on Alchemy Notify API webhook event structures
 * Documentation: https://docs.alchemy.com/reference/notify-api-quickstart
 */

/**
 * Base webhook payload structure from Alchemy
 */
export interface AlchemyWebhookPayload {
  webhookId: string;
  id: string;
  createdAt: string;
  type: 'GRAPHQL' | 'ADDRESS_ACTIVITY' | 'NFT_ACTIVITY';
  event: AlchemyWebhookEvent;
}

/**
 * Webhook event containing activity details
 */
export interface AlchemyWebhookEvent {
  network: 'BASE_MAINNET' | 'BASE_SEPOLIA';
  activity: AlchemyActivity[];
}

/**
 * Activity entry containing transaction and log data
 */
export interface AlchemyActivity {
  fromAddress: string;
  toAddress: string;
  blockNum: string; // Hex string
  hash: string; // Transaction hash
  value: number;
  asset: string;
  category: 'external' | 'internal' | 'token' | 'erc20' | 'erc721' | 'erc1155';
  rawContract: AlchemyRawContract;
  log?: AlchemyLog;
  typeTraceAddress?: string;
}

/**
 * Raw contract information
 */
export interface AlchemyRawContract {
  rawValue: string; // Hex string
  address: string;
  decimals: number;
}

/**
 * Log entry for smart contract events
 */
export interface AlchemyLog {
  address: string;
  topics: string[]; // Array of 32-byte hex strings
  data: string; // Hex string
  blockNumber: string; // Hex string
  transactionHash: string;
  transactionIndex: string; // Hex string
  blockHash: string;
  logIndex: string; // Hex string
  removed: boolean;
}

/**
 * Custom webhook payload with GraphQL data
 */
export interface AlchemyGraphQLPayload {
  webhookId: string;
  id: string;
  createdAt: string;
  type: 'GRAPHQL';
  event: {
    data: {
      block: AlchemyBlock;
    };
    sequenceNumber: string;
  };
}

/**
 * Block data from GraphQL webhook
 */
export interface AlchemyBlock {
  hash: string;
  number: number;
  timestamp: number;
  logs: AlchemyLog[];
}

/**
 * Normalized event data structure (converts Alchemy format to internal format)
 */
export interface NormalizedEventData {
  network: string;
  blockNumber: number;
  blockHash: string;
  blockTimestamp: string;
  transactionHash: string;
  transactionIndex: number;
  logIndex: number;
  contractAddress: string;
  eventName: string;
  eventData: Record<string, any>;
  from_address?: string;
  to_address?: string;
  token_id?: string;
}

/**
 * Helper to convert hex string to decimal number
 */
export function hexToNumber(hex: string): number {
  return parseInt(hex, 16);
}

/**
 * Helper to parse Alchemy log topics into event data
 * Topics structure: [eventSignature, indexed1, indexed2, indexed3]
 */
export function parseLogTopics(log: AlchemyLog): {
  eventSignature: string;
  indexedParams: string[];
} {
  const [eventSignature, ...indexedParams] = log.topics;
  return {
    eventSignature,
    indexedParams,
  };
}

/**
 * Helper to decode event name from event signature
 * Maps common event signatures to event names
 */
export function getEventNameFromSignature(signature: string): string {
  const EVENT_SIGNATURES: Record<string, string> = {
    // ERC721 Transfer (mint, transfer, burn)
    '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef': 'Transfer',

    // Custom Invoice Events (TODO: Add actual signatures after contract deployment)
    // InvoiceMinted(uint256 tokenId, address issuer, uint256 amount, uint256 dueAt, uint256 apr)
    // '0xTODO1': 'InvoiceMinted',

    // InvoiceFunded(uint256 tokenId, address investor, uint256 amount, uint256 fundedAt)
    // '0xTODO2': 'InvoiceFunded',

    // RepaymentDeposited(uint256 tokenId, uint256 amount, address depositedBy, uint256 depositedAt)
    // '0xTODO3': 'RepaymentDeposited',

    // InvoiceSettled(uint256 tokenId, address investor, uint256 principal, uint256 yield, uint256 totalAmount, uint256 settledAt)
    // '0xTODO4': 'InvoiceSettled',

    // InvoiceDefaulted(uint256 tokenId, address investor, uint256 principal, uint256 defaultedAt)
    // '0xTODO5': 'InvoiceDefaulted',
  };

  return EVENT_SIGNATURES[signature] || 'UnknownEvent';
}

/**
 * Helper to normalize Alchemy webhook payload to internal format
 * Converts Alchemy's structure to match CDP webhook structure for compatibility
 */
export function normalizeAlchemyPayload(
  payload: AlchemyWebhookPayload
): NormalizedEventData[] {
  const normalized: NormalizedEventData[] = [];

  // Handle GRAPHQL type (custom webhook with logs)
  if (payload.type === 'GRAPHQL') {
    const graphQLPayload = payload as unknown as AlchemyGraphQLPayload;
    const { block } = graphQLPayload.event.data;

    for (const log of block.logs) {
      const { eventSignature, indexedParams } = parseLogTopics(log);
      const eventName = getEventNameFromSignature(eventSignature);

      normalized.push({
        network: payload.event.network,
        blockNumber: block.number,
        blockHash: block.hash,
        blockTimestamp: block.timestamp.toString(),
        transactionHash: log.transactionHash,
        transactionIndex: hexToNumber(log.transactionIndex),
        logIndex: hexToNumber(log.logIndex),
        contractAddress: log.address.toLowerCase(),
        eventName,
        eventData: {
          // Event-specific data parsing will be done by event handlers
          // based on event name and log.data
          rawData: log.data,
          topics: log.topics,
        },
      });
    }
  }

  // Handle ADDRESS_ACTIVITY and NFT_ACTIVITY types
  if (payload.type === 'ADDRESS_ACTIVITY' || payload.type === 'NFT_ACTIVITY') {
    for (const activity of payload.event.activity) {
      if (activity.log) {
        const { eventSignature, indexedParams } = parseLogTopics(activity.log);
        const eventName = getEventNameFromSignature(eventSignature);

        normalized.push({
          network: payload.event.network,
          blockNumber: hexToNumber(activity.blockNum),
          blockHash: activity.log.blockHash,
          blockTimestamp: '', // Not provided in ADDRESS_ACTIVITY
          transactionHash: activity.hash,
          transactionIndex: hexToNumber(activity.log.transactionIndex),
          logIndex: hexToNumber(activity.log.logIndex),
          contractAddress: activity.log.address.toLowerCase(),
          eventName,
          eventData: {
            rawData: activity.log.data,
            topics: activity.log.topics,
          },
          from_address: activity.fromAddress,
          to_address: activity.toAddress,
        });
      }
    }
  }

  return normalized;
}

/**
 * Helper to validate Alchemy webhook payload structure
 */
export function isValidAlchemyWebhookPayload(
  payload: any
): payload is AlchemyWebhookPayload {
  return (
    payload &&
    typeof payload.webhookId === 'string' &&
    typeof payload.id === 'string' &&
    typeof payload.createdAt === 'string' &&
    typeof payload.type === 'string' &&
    payload.event &&
    typeof payload.event === 'object'
  );
}

/**
 * Helper to parse event data based on event name
 * Decodes the log.data field into structured event data
 */
export function parseEventDataByName(
  eventName: string,
  rawData: string,
  topics: string[]
): Record<string, any> {
  // Remove '0x' prefix
  const data = rawData.startsWith('0x') ? rawData.slice(2) : rawData;

  switch (eventName) {
    case 'Transfer':
      // ERC721 Transfer: topics[0] = signature, topics[1] = from, topics[2] = to, topics[3] = tokenId
      return {
        from: topics[1] ? '0x' + topics[1].slice(26) : null, // Remove padding
        to: topics[2] ? '0x' + topics[2].slice(26) : null,
        tokenId: topics[3] ? BigInt('0x' + topics[3]).toString() : null,
      };

    // Add custom event parsing here after deployment
    // case 'InvoiceMinted':
    //   return {
    //     tokenId: ...,
    //     issuer: ...,
    //     amount: ...,
    //     dueAt: ...,
    //     apr: ...,
    //   };

    default:
      return {
        rawData,
        topics,
      };
  }
}
