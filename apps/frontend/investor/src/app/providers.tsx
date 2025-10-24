'use client';

/**
 * ============================================================================
 * PROVIDER HIERARCHY - All Web3 Providers in One Place
 * ============================================================================
 *
 * This file shows the complete provider nesting structure:
 *
 * <WagmiProvider>                    ← Blockchain connection & state management
 *   <RainbowKitProvider>             ← RainbowKit wallet connection UI
 *     {children}
 *
 * Note: QueryClientProvider (TanStack Query) is in layout.tsx wrapping this component
 *
 * ============================================================================
 */

import '@rainbow-me/rainbowkit/styles.css';
import '../styles/onchainkit.css';
import '../styles/rainbowkit-custom.css';
import { WagmiProvider, createConfig, http } from 'wagmi';
import { base, baseSepolia, hardhat } from 'wagmi/chains';
import { baseAccount } from 'wagmi/connectors';
import {
  connectorsForWallets,
  RainbowKitProvider,
  lightTheme,
} from '@rainbow-me/rainbowkit';
import {
  coinbaseWallet,
  metaMaskWallet,
  rainbowWallet,
  walletConnectWallet,
} from '@rainbow-me/rainbowkit/wallets';

export function Web3Providers({ children }: { children: React.ReactNode }) {
  const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID!;

  // Custom wallet connectors with Coinbase Wallet at the top
  const connectors = connectorsForWallets(
    [
      {
        groupName: 'Recommended',
        wallets: [
          coinbaseWallet, // Coinbase Wallet first
          metaMaskWallet,
          rainbowWallet,
          walletConnectWallet,
        ],
      },
    ],
    {
      appName: 'Orbbit',
      projectId: projectId,
    }
  );

  // Determine if we should include localhost (for development)
  const isDevelopment = process.env.NODE_ENV === 'development';
  const includeLocalhost =
    isDevelopment && process.env.NEXT_PUBLIC_ENABLE_LOCALHOST === 'true';

  // Get Alchemy RPC URLs from environment
  const baseSepoliaRpc =
    process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL || 'https://sepolia.base.org';
  const baseMainnetRpc =
    process.env.NEXT_PUBLIC_BASE_MAINNET_RPC_URL || 'https://mainnet.base.org';

  // Create Wagmi config with Base Account connector + custom wallet order
  const config = createConfig({
    connectors: [
      // Base Account connector for new wallet creation
      baseAccount({
        appName: 'Orbbit',
        appLogoUrl: 'https://media.cdn.orbbit.co/brand/orbbit-logo-circle.svg',
      }),
      // RainbowKit connectors for existing wallets
      ...connectors,
    ],
    chains: includeLocalhost
      ? [hardhat, baseSepolia, base]
      : [baseSepolia, base],
    transports: includeLocalhost
      ? {
          [hardhat.id]: http('http://127.0.0.1:8545'),
          [baseSepolia.id]: http(baseSepoliaRpc),
          [base.id]: http(baseMainnetRpc),
        }
      : {
          [baseSepolia.id]: http(baseSepoliaRpc),
          [base.id]: http(baseMainnetRpc),
        },
    ssr: true,
  });

  return (
    <WagmiProvider config={config}>
      <RainbowKitProvider modalSize="compact">{children}</RainbowKitProvider>
    </WagmiProvider>
  );
}
