'use client';

import { useAccount, useReadContract } from 'wagmi';
import { formatUnits } from 'viem';
import { cn } from '@ui';

interface TokenBalanceProps {
  tokenAddress: `0x${string}`;
  label?: string;
  decimals?: number;
  className?: string;
}

const ERC20_ABI = [
  {
    inputs: [{ name: 'account', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

/**
 * TokenBalance component displays the balance of an ERC20 token for the connected wallet.
 * Uses wagmi's useReadContract to fetch the balance from the blockchain.
 */
export function TokenBalance({
  tokenAddress,
  label = 'Balance',
  decimals = 6, // USDC uses 6 decimals
  className,
}: TokenBalanceProps) {
  const { address, isConnected } = useAccount();

  const { data: balance, isLoading } = useReadContract({
    address: tokenAddress,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      enabled: Boolean(address && isConnected),
    },
  });

  if (!isConnected || !address) {
    return null;
  }

  if (isLoading) {
    return (
      <div
        className={cn(
          'text-muted-foreground flex items-center gap-2 text-sm',
          className
        )}
      >
        <span>{label}:</span>
        <span className="animate-pulse">...</span>
      </div>
    );
  }

  const formattedBalance = balance
    ? Number(formatUnits(balance, decimals)).toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    : '0.00';

  return (
    <div
      className={cn(
        'flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm',
        className
      )}
    >
      <span className="text-muted-foreground">{label}:</span>
      <span className="font-medium">{formattedBalance}</span>
    </div>
  );
}
