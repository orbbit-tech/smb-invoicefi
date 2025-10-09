'use client';

import React from 'react';
// RainbowKit import - COMMENTED OUT
// import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';
import { TokenBalance } from '../token-balance';
import {
  Wallet,
  ConnectWallet,
  WalletDropdown,
  WalletDropdownDisconnect,
} from '@coinbase/onchainkit/wallet';
import { Avatar, Name, Identity, Address } from '@coinbase/onchainkit/identity';

// USDC contract address on Base Sepolia (testnet)
const USDC_BASE_SEPOLIA = '0x036CbD53842c5426634e7929541eC2318f3dCF7e' as const;

export function WalletSection() {
  // Gracefully handle when Web3 providers aren't configured
  try {
    const { isConnected } = useAccount();

    return (
      <div className="flex items-center gap-3">
        {isConnected && (
          <TokenBalance
            tokenAddress={USDC_BASE_SEPOLIA}
            label="USDC"
            className="hidden text-sm text-muted-foreground sm:flex"
          />
        )}

        {/* ============================================================
            RAINBOWKIT - COMMENTED OUT (Replaced by OnchainKit)
            Traditional multi-wallet support only (no smart wallet)
            ============================================================ */}
        {/* <ConnectButton
          chainStatus="none"
          showBalance={false}
          accountStatus={{
            smallScreen: 'avatar',
            largeScreen: 'full',
          }}
        /> */}

        {/* Separator - commented out since we only have one button now */}
        {/* <div className="hidden sm:block text-muted-foreground">or</div> */}

        {/* OnchainKit - Smart Wallet + Coinbase + MetaMask + Phantom */}
        <Wallet>
          <ConnectWallet className="h-8 px-3 py-1.5 text-sm rounded-md bg-primary hover:bg-primary/90 text-primary-foreground font-medium transition-all">
            <Avatar className="h-6 w-6" />
            <Name />
          </ConnectWallet>
          <WalletDropdown>
            <Identity hasCopyAddressOnClick>
              <Avatar />
              <Name />
              <Address />
            </Identity>
            <WalletDropdownDisconnect />
          </WalletDropdown>
        </Wallet>
      </div>
    );
  } catch (error) {
    // If Web3 providers aren't available, don't render wallet section
    return null;
  }
}
