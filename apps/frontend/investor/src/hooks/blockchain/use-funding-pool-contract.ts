/**
 * React hooks for reading InvoiceFundingPool contract data
 */

import { useReadContract, useSimulateContract } from 'wagmi';
import { Address, isAddress } from 'viem';

// FundingPool contract ABI - add more functions as needed
const FUNDING_POOL_ABI = [
  {
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    name: 'getRepaymentInfo',
    outputs: [
      {
        components: [
          { name: 'isDeposited', type: 'bool' },
          { name: 'amount', type: 'uint256' },
          { name: 'depositedAt', type: 'uint256' },
        ],
        type: 'tuple',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'gracePeriod',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { name: 'tokenId', type: 'uint256' },
      { name: 'amount', type: 'uint256' },
    ],
    name: 'fundInvoice',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const;

export interface RepaymentInfo {
  isDeposited: boolean;
  amount: bigint;
  depositedAt: bigint;
}

/**
 * Hook to get repayment information for an invoice
 */
export function useRepaymentInfo(
  tokenId: string | undefined,
  contractAddress: Address | undefined
) {
  const isValidAddress = contractAddress && isAddress(contractAddress);

  return useReadContract({
    address: isValidAddress ? contractAddress : undefined,
    abi: FUNDING_POOL_ABI,
    functionName: 'getRepaymentInfo',
    args: tokenId ? [BigInt(tokenId)] : undefined,
    query: {
      enabled: !!tokenId && !!isValidAddress,
      staleTime: 60 * 1000, // 1 minute
      refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes for repayment updates
    },
  });
}

/**
 * Hook to get the grace period setting
 */
export function useGracePeriod(contractAddress: Address | undefined) {
  const isValidAddress = contractAddress && isAddress(contractAddress);

  return useReadContract({
    address: isValidAddress ? contractAddress : undefined,
    abi: FUNDING_POOL_ABI,
    functionName: 'gracePeriod',
    query: {
      enabled: !!isValidAddress,
      staleTime: 10 * 60 * 1000, // 10 minutes - this doesn't change often
    },
  });
}

/**
 * Hook to simulate funding an invoice (for validation before actual transaction)
 */
export function useSimulateFundInvoice(
  tokenId: string | undefined,
  amount: bigint | undefined,
  contractAddress: Address | undefined
) {
  const isValidAddress = contractAddress && isAddress(contractAddress);

  return useSimulateContract({
    address: isValidAddress ? contractAddress : undefined,
    abi: FUNDING_POOL_ABI,
    functionName: 'fundInvoice',
    args: tokenId && amount ? [BigInt(tokenId), amount] : undefined,
    query: {
      enabled: !!tokenId && !!amount && !!isValidAddress,
    },
  });
}
