import { useState } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useConfig } from 'wagmi';
import { parseUnits, formatUnits, readContract } from 'viem';
import { getContractAddresses, ERC20_ABI, INVOICE_FUNDING_POOL_ABI } from '@/config/contracts';

export interface RepayInvoiceParams {
  tokenId: number;
  amount: number; // Amount in dollars (will be converted to USDC with 6 decimals)
}

export function useRepayInvoice() {
  const { address, chainId } = useAccount();
  const config = useConfig();
  const { writeContractAsync } = useWriteContract();
  const [isApproving, setIsApproving] = useState(false);
  const [isRepaying, setIsRepaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const repayInvoice = async ({ tokenId, amount }: RepayInvoiceParams) => {
    try {
      setError(null);

      // 1. Check wallet connection
      if (!address || !chainId) {
        throw new Error('Please connect your wallet first');
      }

      // 2. Get contract addresses
      const contracts = getContractAddresses(chainId);
      if (!contracts) {
        throw new Error(`Unsupported network. Please switch to Base Sepolia (chainId: 84532)`);
      }

      // 3. Convert amount to USDC units (6 decimals)
      const amountInUsdc = parseUnits(amount.toString(), 6);

      // 4. Check USDC allowance
      const allowance = await readContract(config.getClient(), {
        address: contracts.usdc,
        abi: ERC20_ABI,
        functionName: 'allowance',
        args: [address, contracts.invoiceFundingPool],
      }) as bigint;

      // 5. Approve USDC if needed
      if (allowance < amountInUsdc) {
        setIsApproving(true);
        const approveHash = await writeContractAsync({
          address: contracts.usdc,
          abi: ERC20_ABI,
          functionName: 'approve',
          args: [contracts.invoiceFundingPool, amountInUsdc],
        });

        // Wait for approval confirmation
        console.log('Approval transaction submitted:', approveHash);
        // Note: In production, you might want to wait for confirmation here
        setIsApproving(false);
      }

      // 6. Call depositRepayment
      setIsRepaying(true);
      const repayHash = await writeContractAsync({
        address: contracts.invoiceFundingPool,
        abi: INVOICE_FUNDING_POOL_ABI,
        functionName: 'depositRepayment',
        args: [BigInt(tokenId)],
      });

      console.log('Repayment transaction submitted:', repayHash);
      setIsRepaying(false);

      return {
        success: true,
        hash: repayHash,
      };
    } catch (err: any) {
      console.error('Repayment error:', err);

      // User rejected transaction
      if (err.message?.includes('User rejected') || err.code === 4001) {
        setError('Transaction cancelled by user');
      }
      // Insufficient funds
      else if (err.message?.includes('insufficient funds')) {
        setError('Insufficient USDC balance in your wallet');
      }
      // Wrong network
      else if (err.message?.includes('chain')) {
        setError('Please switch to Base Sepolia network');
      }
      // Generic error
      else {
        setError(err.message || 'Failed to process repayment');
      }

      setIsApproving(false);
      setIsRepaying(false);

      throw err;
    }
  };

  return {
    repayInvoice,
    isApproving,
    isRepaying,
    isProcessing: isApproving || isRepaying,
    error,
    address,
    chainId,
  };
}
