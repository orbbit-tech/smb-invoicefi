/**
 * Blockchain configuration
 * Supports local (Hardhat/Anvil), Base Sepolia testnet, and Base Mainnet
 * Includes webhook configuration for multiple providers
 */
export interface BlockchainConfig {
  rpcUrl: string;
  chainId: number;
  chainName: string;
  invoiceContractAddress: string;
  invoiceFundingPoolContractAddress: string;
  whitelistContractAddress: string;
  webhook?: WebhookConfig;
  cdp?: CdpConfig;
}

/**
 * Webhook configuration
 */
export interface WebhookConfig {
  provider: 'alchemy' | 'cdp';
  alchemy?: AlchemyConfig;
  polling?: PollingConfig;
}

/**
 * Alchemy configuration
 */
export interface AlchemyConfig {
  apiKey: string;
  webhookSigningKey: string;
  webhookUrl: string;
}

/**
 * CDP (Coinbase Developer Platform) configuration
 */
export interface CdpConfig {
  webhooksEnabled: boolean;
  webhookNotificationUri?: string;
}

/**
 * Polling backup configuration
 */
export interface PollingConfig {
  enabled: boolean;
  intervalMs: number;
}

/**
 * Get blockchain configuration from environment
 * Supports: local, base-sepolia, base-mainnet
 */
export function getBlockchainConfig(): BlockchainConfig {
  const network = process.env.BLOCKCHAIN_NETWORK || 'base-sepolia';

  const baseConfig = {
    webhook: {
      provider: (process.env.WEBHOOK_PROVIDER || 'alchemy') as 'alchemy' | 'cdp',
      alchemy: {
        apiKey: process.env.ALCHEMY_API_KEY || '',
        webhookSigningKey: process.env.ALCHEMY_WEBHOOK_SIGNING_KEY || '',
        webhookUrl: process.env.ALCHEMY_WEBHOOK_URL || '',
      },
      polling: {
        enabled: process.env.POLLING_ENABLED === 'true',
        intervalMs: parseInt(process.env.POLLING_INTERVAL_MS || '300000', 10),
      },
    },
    cdp: {
      webhooksEnabled: process.env.CDP_WEBHOOKS_ENABLED === 'true',
      webhookNotificationUri: process.env.CDP_WEBHOOK_URL || process.env.WEBHOOK_NOTIFICATION_URI,
    },
  };

  // Local development (Hardhat/Anvil)
  if (network === 'local') {
    return {
      ...baseConfig,
      rpcUrl: process.env.LOCAL_RPC_URL || 'http://127.0.0.1:8545',
      chainId: 31337,
      chainName: 'Local',
      invoiceContractAddress: process.env.INVOICE_CONTRACT_ADDRESS_LOCAL || '',
      invoiceFundingPoolContractAddress: process.env.INVOICE_FUNDING_POOL_CONTRACT_ADDRESS_LOCAL || '',
      whitelistContractAddress: process.env.WHITELIST_CONTRACT_ADDRESS_LOCAL || '',
    };
  }

  // Base Mainnet (production)
  if (network === 'base-mainnet') {
    return {
      ...baseConfig,
      rpcUrl: process.env.BASE_MAINNET_RPC_URL || 'https://mainnet.base.org',
      chainId: 8453,
      chainName: 'Base Mainnet',
      invoiceContractAddress: process.env.INVOICE_CONTRACT_ADDRESS_BASE_MAINNET || '',
      invoiceFundingPoolContractAddress: process.env.INVOICE_FUNDING_POOL_CONTRACT_ADDRESS_BASE_MAINNET || '',
      whitelistContractAddress: process.env.WHITELIST_CONTRACT_ADDRESS_BASE_MAINNET || '',
    };
  }

  // Default to Base Sepolia testnet
  return {
    ...baseConfig,
    rpcUrl: process.env.BASE_SEPOLIA_RPC_URL || 'https://sepolia.base.org',
    chainId: 84532,
    chainName: 'Base Sepolia',
    invoiceContractAddress: process.env.INVOICE_CONTRACT_ADDRESS_BASE_SEPOLIA || '',
    invoiceFundingPoolContractAddress: process.env.INVOICE_FUNDING_POOL_CONTRACT_ADDRESS_BASE_SEPOLIA || '',
    whitelistContractAddress: process.env.WHITELIST_CONTRACT_ADDRESS_BASE_SEPOLIA || '',
  };
}
