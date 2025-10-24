/**
 * Smart Contract Configuration
 *
 * This file contains contract addresses and ABIs for all supported networks.
 * Update the addresses after deploying to each network.
 */

import { type Address } from 'viem';
import { hardhat, baseSepolia, base } from 'viem/chains';

// ============================================================================
// Contract ABIs
// ============================================================================

/**
 * ERC20 Token ABI (USDC)
 * Only includes the functions we need: approve, allowance, balanceOf
 */
export const ERC20_ABI = [
  {
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    name: 'approve',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
    ],
    name: 'allowance',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'account', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'decimals',
    outputs: [{ name: '', type: 'uint8' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

/**
 * Invoice NFT Contract ABI
 * Core functions for reading invoice data
 */
export const INVOICE_ABI = [
  {
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    name: 'getInvoice',
    outputs: [
      {
        components: [
          { name: 'amount', type: 'uint256' },
          { name: 'paymentToken', type: 'address' },
          { name: 'dueAt', type: 'uint256' },
          { name: 'apr', type: 'uint256' },
          { name: 'status', type: 'uint8' },
          { name: 'issuer', type: 'address' },
          { name: 'uri', type: 'string' },
        ],
        type: 'tuple',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    name: 'ownerOf',
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    name: 'tokenURI',
    outputs: [{ name: '', type: 'string' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

/**
 * InvoiceFundingPool Contract ABI
 * Core functions for funding invoices and reading funding info
 */
export const FUNDING_POOL_ABI = [
  {
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    name: 'fundInvoice',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    name: 'getFundingInfo',
    outputs: [
      { name: 'investor', type: 'address' },
      { name: 'principal', type: 'uint256' },
      { name: 'repaymentAmount', type: 'uint256' },
      { name: 'fundingTime', type: 'uint256' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { name: 'principal', type: 'uint256' },
      { name: 'apr', type: 'uint256' },
      { name: 'dueAt', type: 'uint256' },
      { name: 'fundingTimestamp', type: 'uint256' },
    ],
    name: 'calculateYield',
    outputs: [
      { name: 'totalYield', type: 'uint256' },
      { name: 'investorYield', type: 'uint256' },
      { name: 'platformFee', type: 'uint256' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'paymentToken',
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'invoice',
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

// ============================================================================
// Contract Addresses by Network
// ============================================================================

export type NetworkConfig = {
  chainId: number;
  chainName: string;
  contracts: {
    usdc: Address;
    invoice: Address;
    fundingPool: Address;
    whitelist: Address;
  };
};

/**
 * Local (Hardhat/Anvil) Configuration
 * NOTE: These addresses change every time you restart the local node!
 * Update these after running: npx hardhat ignition deploy ignition/modules/LocalDevelopment.ts --network localhost
 */
export const LOCALHOST_CONFIG: NetworkConfig = {
  chainId: hardhat.id,
  chainName: 'Hardhat Local',
  contracts: {
    // TODO: Update these addresses after local deployment
    usdc: (process.env.NEXT_PUBLIC_USDC_CONTRACT_ADDRESS_LOCAL ||
      '0x0000000000000000000000000000000000000000') as Address,
    invoice: (process.env.NEXT_PUBLIC_INVOICE_CONTRACT_ADDRESS_LOCAL ||
      '0x0000000000000000000000000000000000000000') as Address,
    fundingPool: (process.env.NEXT_PUBLIC_INVOICE_FUNDING_POOL_CONTRACT_ADDRESS_LOCAL ||
      '0x0000000000000000000000000000000000000000') as Address,
    whitelist: (process.env.NEXT_PUBLIC_WHITELIST_CONTRACT_ADDRESS_LOCAL ||
      '0x0000000000000000000000000000000000000000') as Address,
  },
};

/**
 * Base Sepolia Testnet Configuration
 * Using Circle's official testnet USDC
 */
export const BASE_SEPOLIA_CONFIG: NetworkConfig = {
  chainId: baseSepolia.id,
  chainName: 'Base Sepolia',
  contracts: {
    usdc: '0x036CbD53842c5426634e7929541eC2318f3dCF7e' as Address, // Circle's testnet USDC
    invoice: (process.env.NEXT_PUBLIC_INVOICE_CONTRACT_ADDRESS_BASE_SEPOLIA ||
      '0x0000000000000000000000000000000000000000') as Address,
    fundingPool: (process.env.NEXT_PUBLIC_INVOICE_FUNDING_POOL_CONTRACT_ADDRESS_BASE_SEPOLIA ||
      '0x0000000000000000000000000000000000000000') as Address,
    whitelist: (process.env.NEXT_PUBLIC_WHITELIST_CONTRACT_ADDRESS_BASE_SEPOLIA ||
      '0x0000000000000000000000000000000000000000') as Address,
  },
};

/**
 * Base Mainnet Configuration
 * Using Circle's official USDC on Base
 */
export const BASE_MAINNET_CONFIG: NetworkConfig = {
  chainId: base.id,
  chainName: 'Base',
  contracts: {
    usdc: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' as Address, // Circle's official USDC on Base
    invoice: (process.env.NEXT_PUBLIC_INVOICE_CONTRACT_ADDRESS_BASE_MAINNET ||
      '0x0000000000000000000000000000000000000000') as Address,
    fundingPool: (process.env.NEXT_PUBLIC_INVOICE_FUNDING_POOL_CONTRACT_ADDRESS_BASE_MAINNET ||
      '0x0000000000000000000000000000000000000000') as Address,
    whitelist: (process.env.NEXT_PUBLIC_WHITELIST_CONTRACT_ADDRESS_BASE_MAINNET ||
      '0x0000000000000000000000000000000000000000') as Address,
  },
};

/**
 * Get contract configuration for the current chain
 */
export function getContractConfig(chainId: number): NetworkConfig | null {
  switch (chainId) {
    case hardhat.id:
      return LOCALHOST_CONFIG;
    case baseSepolia.id:
      return BASE_SEPOLIA_CONFIG;
    case base.id:
      return BASE_MAINNET_CONFIG;
    default:
      return null;
  }
}

/**
 * Check if a network is supported
 */
export function isSupportedNetwork(chainId: number): boolean {
  return getContractConfig(chainId) !== null;
}
