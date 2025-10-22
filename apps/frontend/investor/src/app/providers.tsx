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
import { base, baseSepolia } from 'wagmi/chains';
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

  // Create Wagmi config with custom wallet order
  const config = createConfig({
    connectors,
    chains: [baseSepolia, base],
    transports: {
      [baseSepolia.id]: http(),
      [base.id]: http(),
    },
    ssr: true,
  });

  return (
    <WagmiProvider config={config}>
      <RainbowKitProvider modalSize="compact">{children}</RainbowKitProvider>
    </WagmiProvider>
  );
}
