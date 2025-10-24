/**
 * Smart Contract Configuration
 * Contract addresses and ABIs for blockchain interactions
 */

export interface ContractAddresses {
  usdc: `0x${string}`;
  whitelist: `0x${string}`;
  invoice: `0x${string}`;
  invoiceFundingPool: `0x${string}`;
}

/**
 * Get contract addresses for the current chain
 */
export function getContractAddresses(chainId: number): ContractAddresses | null {
  // Base Sepolia (testnet)
  if (chainId === 84532) {
    return {
      usdc: (process.env.NEXT_PUBLIC_USDC_CONTRACT_ADDRESS_BASE_SEPOLIA || '0x036CbD53842c5426634e7929541eC2318f3dCF7e') as `0x${string}`,
      whitelist: '0xD7E57FD288B2D5B221a3BD2C37dAe20B1dC5C85e',
      invoice: '0x668761d52226f14A7535785eA52Aa2cdae2B13A1',
      invoiceFundingPool: '0xB54f376E13f48298b71034B9E03eba473beB4b71',
    };
  }

  // Base Mainnet
  if (chainId === 8453) {
    return {
      usdc: (process.env.NEXT_PUBLIC_USDC_CONTRACT_ADDRESS_BASE_MAINNET || '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913') as `0x${string}`,
      whitelist: (process.env.NEXT_PUBLIC_WHITELIST_CONTRACT_ADDRESS_BASE_MAINNET || '') as `0x${string}`,
      invoice: (process.env.NEXT_PUBLIC_INVOICE_CONTRACT_ADDRESS_BASE_MAINNET || '') as `0x${string}`,
      invoiceFundingPool: (process.env.NEXT_PUBLIC_INVOICE_FUNDING_POOL_CONTRACT_ADDRESS_BASE_MAINNET || '') as `0x${string}`,
    };
  }

  // Local development (Hardhat/Anvil)
  if (chainId === 31337) {
    return {
      usdc: (process.env.NEXT_PUBLIC_USDC_CONTRACT_ADDRESS_LOCAL || '') as `0x${string}`,
      whitelist: (process.env.NEXT_PUBLIC_WHITELIST_CONTRACT_ADDRESS_LOCAL || '') as `0x${string}`,
      invoice: (process.env.NEXT_PUBLIC_INVOICE_CONTRACT_ADDRESS_LOCAL || '') as `0x${string}`,
      invoiceFundingPool: (process.env.NEXT_PUBLIC_INVOICE_FUNDING_POOL_CONTRACT_ADDRESS_LOCAL || '') as `0x${string}`,
    };
  }

  return null;
}

/**
 * ERC20 (USDC) ABI - minimal interface for approval and balance checks
 */
export const ERC20_ABI = [
  {
    name: 'approve',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
  {
    name: 'allowance',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'decimals',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint8' }],
  },
] as const;

/**
 * InvoiceFundingPool ABI - minimal interface for repayment
 */
export const INVOICE_FUNDING_POOL_ABI = [
  {
    name: 'depositRepayment',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    outputs: [],
  },
  {
    name: 'fundedAmounts',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'calculateYield',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'principal', type: 'uint256' },
      { name: 'apr', type: 'uint256' },
      { name: 'dueAt', type: 'uint256' },
      { name: 'fundingTime', type: 'uint256' },
    ],
    outputs: [
      { name: 'totalYield', type: 'uint256' },
      { name: 'platformFee', type: 'uint256' },
      { name: 'investorYield', type: 'uint256' },
    ],
  },
] as const;
