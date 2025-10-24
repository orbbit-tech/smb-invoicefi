/**
 * React hook for funding invoices via InvoiceFundingPool contract
 */

import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { Address } from 'viem';
import { FUNDING_POOL_ABI } from '@/config/contracts';

export interface UseFundInvoiceParams {
  fundingPoolAddress: Address | undefined;
  tokenId: string | undefined;
}

export interface UseFundInvoiceReturn {
  fundInvoice: () => void;
  isFunding: boolean;
  isFundingConfirming: boolean;
  isFundingSuccess: boolean;
  fundingError: Error | null;
  fundingHash: Address | undefined;
}

/**
 * Hook to fund an invoice
 *
 * Prerequisites:
 * - User must have approved USDC spending (use useApproveUSDC first)
 * - User must be whitelisted as INVESTOR
 * - Invoice must be in LISTED status
 *
 * Usage:
 * ```ts
 * const { fundInvoice, isFunding, isFundingSuccess, fundingError, fundingHash } = useFundInvoice({
 *   fundingPoolAddress: config.contracts.fundingPool,
 *   tokenId: '1',
 * });
 *
 * // After USDC approval succeeds, call fundInvoice()
 * ```
 */
export function useFundInvoice({
  fundingPoolAddress,
  tokenId,
}: UseFundInvoiceParams): UseFundInvoiceReturn {
  // Write contract hook for funding
  const {
    writeContract,
    data: hash,
    isPending: isWritePending,
    error: writeError,
  } = useWriteContract();

  // Wait for transaction confirmation
  const {
    isLoading: isConfirming,
    isSuccess: isConfirmed,
    error: confirmError,
  } = useWaitForTransactionReceipt({
    hash,
  });

  /**
   * Execute the funding transaction
   */
  const fundInvoice = () => {
    if (!fundingPoolAddress || !tokenId) {
      console.error('Missing required parameters for funding');
      return;
    }

    writeContract({
      address: fundingPoolAddress,
      abi: FUNDING_POOL_ABI,
      functionName: 'fundInvoice',
      args: [BigInt(tokenId)],
    });
  };

  return {
    fundInvoice,
    isFunding: isWritePending,
    isFundingConfirming: isConfirming,
    isFundingSuccess: isConfirmed,
    fundingError: writeError || confirmError,
    fundingHash: hash,
  };
}
