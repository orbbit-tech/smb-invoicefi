'use client';

import React from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';
import { TokenBalance } from '../token-balance';

// USDC contract address on Base Sepolia (testnet)
const USDC_BASE_SEPOLIA = '0x036CbD53842c5426634e7929541eC2318f3dCF7e' as const;

export function WalletSection() {
  // Gracefully handle when Web3 providers aren't configured
  try {
    const { isConnected } = useAccount();

    return (
      <div className="flex items-center gap-3">
        {/* RainbowKit - Multi-wallet support with elegant design */}
        <ConnectButton
          chainStatus="none"
          showBalance={false}
          accountStatus={{
            smallScreen: 'avatar',
            largeScreen: 'full',
          }}
        />
      </div>
    );
  } catch (error) {
    // If Web3 providers aren't available, don't render wallet section
    return null;
  }
}
