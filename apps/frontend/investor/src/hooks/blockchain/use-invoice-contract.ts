/**
 * React hooks for reading Invoice NFT contract data
 */

import { useReadContract, useReadContracts } from 'wagmi';
import { Address, isAddress } from 'viem';

// Invoice contract ABI - add more functions as needed
const INVOICE_ABI = [
  {
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    name: 'getInvoiceData',
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
] as const;

/**
 * Status enum matching the smart contract
 */
export enum InvoiceStatus {
  LISTED = 0,
  FUNDED = 1,
  FULLY_PAID = 2,
  SETTLED = 3,
  DEFAULTED = 4,
}

export interface InvoiceContractData {
  amount: bigint;
  paymentToken: Address;
  dueAt: bigint;
  apr: bigint;
  status: InvoiceStatus;
  issuer: Address;
  uri: string;
}

/**
 * Hook to read invoice data from the Invoice NFT contract
 */
export function useInvoiceData(tokenId: string | undefined, contractAddress: Address | undefined) {
  const isValidAddress = contractAddress && isAddress(contractAddress);

  return useReadContract({
    address: isValidAddress ? contractAddress : undefined,
    abi: INVOICE_ABI,
    functionName: 'getInvoiceData',
    args: tokenId ? [BigInt(tokenId)] : undefined,
    query: {
      enabled: !!tokenId && !!isValidAddress,
      staleTime: 60 * 1000, // 1 minute
      refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
    },
  });
}

/**
 * Hook to get the owner of an Invoice NFT
 */
export function useInvoiceOwner(tokenId: string | undefined, contractAddress: Address | undefined) {
  const isValidAddress = contractAddress && isAddress(contractAddress);

  return useReadContract({
    address: isValidAddress ? contractAddress : undefined,
    abi: INVOICE_ABI,
    functionName: 'ownerOf',
    args: tokenId ? [BigInt(tokenId)] : undefined,
    query: {
      enabled: !!tokenId && !!isValidAddress,
      staleTime: 60 * 1000, // 1 minute
    },
  });
}

/**
 * Hook to read multiple invoice contract data in parallel
 */
export function useInvoicesData(
  tokenIds: string[],
  contractAddress: Address | undefined
) {
  const isValidAddress = contractAddress && isAddress(contractAddress);

  const contracts = tokenIds.map((tokenId) => ({
    address: contractAddress as Address,
    abi: INVOICE_ABI,
    functionName: 'getInvoiceData' as const,
    args: [BigInt(tokenId)],
  }));

  return useReadContracts({
    contracts: isValidAddress ? contracts : [],
    query: {
      enabled: tokenIds.length > 0 && !!isValidAddress,
      staleTime: 60 * 1000, // 1 minute
    },
  });
}
