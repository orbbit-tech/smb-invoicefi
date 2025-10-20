/**
 * @title Deployment Configuration
 * @notice Centralized configuration for Orbbit smart contract deployments
 * @dev This file contains all configurable parameters that can be overridden via environment variables
 */

export interface ChainConfig {
  chainId: number;
  name: string;
  paymentToken: string;
  isMainnet: boolean;
  requiresMultisig: boolean;
  multisigAddress?: string;
}

export interface TokenConfig {
  name: string;
  symbol: string;
  metadataBaseUri: string;
  metadataExtension: string;
}

export interface ContractConfig {
  gracePeriodDays: number;
  basisPointsDivisor: number;
  daysPerYear: number;
}

export interface DeploymentConfig {
  chains: Record<string, ChainConfig>;
  token: TokenConfig;
  contract: ContractConfig;
}

/**
 * Default deployment configuration
 * Can be overridden via environment variables
 */
export const defaultConfig: DeploymentConfig = {
  chains: {
    'base-mainnet': {
      chainId: 8453,
      name: 'Base Mainnet',
      paymentToken: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', // Circle's official USDC on Base
      isMainnet: true,
      requiresMultisig: true,
      multisigAddress: process.env.MULTISIG_ADDRESS,
    },
    'base-sepolia': {
      chainId: 84532,
      name: 'Base Sepolia',
      paymentToken: '0x036CbD53842c5426634e7929541eC2318f3dCF7e', // Circle's official USDC on Base Sepolia
      isMainnet: false,
      requiresMultisig: false,
    },
  },
  token: {
    name: process.env.INVOICE_TOKEN_NAME || 'Orbbit Invoice',
    symbol: process.env.INVOICE_TOKEN_SYMBOL || 'ORBINV',
    metadataBaseUri:
      process.env.INVOICE_METADATA_BASE_URI ||
      'https://api.orbbit.com/metadata/',
    metadataExtension: process.env.INVOICE_METADATA_EXTENSION || '.json',
  },
  contract: {
    gracePeriodDays: parseInt(process.env.GRACE_PERIOD_DAYS || '30', 10),
    basisPointsDivisor: 10000,
    daysPerYear: 365,
  },
};

/**
 * Get chain configuration by chain ID
 */
export function getChainConfig(chainId: number): ChainConfig | undefined {
  return Object.values(defaultConfig.chains).find(
    (chain) => chain.chainId === chainId
  );
}

/**
 * Get chain configuration by name
 */
export function getChainConfigByName(name: string): ChainConfig | undefined {
  return defaultConfig.chains[name];
}

/**
 * Check if chain is mainnet
 */
export function isMainnet(chainId: number): boolean {
  const chain = getChainConfig(chainId);
  return chain?.isMainnet ?? false;
}

/**
 * Get payment token address for chain (USDC for V1)
 */
export function getPaymentTokenAddress(chainId: number): string {
  const chain = getChainConfig(chainId);
  if (!chain) {
    throw new Error(`Unknown chain ID: ${chainId}`);
  }
  return chain.paymentToken;
}

export default defaultConfig;
