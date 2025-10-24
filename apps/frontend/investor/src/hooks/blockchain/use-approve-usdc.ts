/**
 * React hook for approving USDC spending by InvoiceFundingPool contract
 */

import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { Address } from 'viem';
import { ERC20_ABI } from '@/config/contracts';

export interface UseApproveUSDCParams {
  usdcAddress: Address | undefined;
  spender: Address | undefined; // InvoiceFundingPool address
  amount: bigint | undefined;
}

export interface UseApproveUSDCReturn {
  approve: () => void;
  isApproving: boolean;
  isApproveConfirming: boolean;
  isApproveSuccess: boolean;
  approveError: Error | null;
  approveHash: Address | undefined;
}

/**
 * Hook to approve USDC spending
 *
 * Usage:
 * ```ts
 * const { approve, isApproving, isApproveSuccess, approveError } = useApproveUSDC({
 *   usdcAddress: config.contracts.usdc,
 *   spender: config.contracts.fundingPool,
 *   amount: parseUnits('1000', 6), // 1000 USDC
 * });
 *
 * // Call approve() when user clicks button
 * ```
 */
export function useApproveUSDC({
  usdcAddress,
  spender,
  amount,
}: UseApproveUSDCParams): UseApproveUSDCReturn {
  // Write contract hook for approval
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
   * Execute the approval transaction
   */
  const approve = () => {
    if (!usdcAddress || !spender || !amount) {
      console.error('Missing required parameters for approval');
      return;
    }

    writeContract({
      address: usdcAddress,
      abi: ERC20_ABI,
      functionName: 'approve',
      args: [spender, amount],
    });
  };

  return {
    approve,
    isApproving: isWritePending,
    isApproveConfirming: isConfirming,
    isApproveSuccess: isConfirmed,
    approveError: writeError || confirmError,
    approveHash: hash,
  };
}
