/**
 * Blockchain configuration
 * Supports Base Sepolia testnet and Base mainnet
 */
export interface BlockchainConfig {
  rpcUrl: string;
  chainId: number;
  chainName: string;
  invoiceContractAddress: string;
  fundingPoolContractAddress: string;
  whitelistContractAddress: string;
}

/**
 * Get blockchain configuration from environment
 */
export function getBlockchainConfig(): BlockchainConfig {
  const network = process.env.BLOCKCHAIN_NETWORK || 'base-sepolia';

  if (network === 'base-mainnet') {
    return {
      rpcUrl: process.env.BASE_MAINNET_RPC_URL || 'https://mainnet.base.org',
      chainId: 8453,
      chainName: 'Base Mainnet',
      invoiceContractAddress: process.env.INVOICE_CONTRACT_ADDRESS_MAINNET || '',
      fundingPoolContractAddress: process.env.FUNDING_POOL_CONTRACT_ADDRESS_MAINNET || '',
      whitelistContractAddress: process.env.WHITELIST_CONTRACT_ADDRESS_MAINNET || '',
    };
  }

  // Default to Base Sepolia testnet
  return {
    rpcUrl: process.env.BASE_SEPOLIA_RPC_URL || process.env.ALCHEMY_BASE_SEPOLIA_URL || 'https://sepolia.base.org',
    chainId: 84532,
    chainName: 'Base Sepolia',
    invoiceContractAddress: process.env.INVOICE_CONTRACT_ADDRESS || '',
    fundingPoolContractAddress: process.env.FUNDING_POOL_CONTRACT_ADDRESS || '',
    whitelistContractAddress: process.env.WHITELIST_CONTRACT_ADDRESS || '',
  };
}
