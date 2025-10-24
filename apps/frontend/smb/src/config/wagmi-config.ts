'use client';

import { createConfig, http } from 'wagmi';
import { base, baseSepolia } from 'wagmi/chains';
import { baseAccount } from 'wagmi/connectors';
import { connectorsForWallets } from '@rainbow-me/rainbowkit';
import {
  metaMaskWallet,
  walletConnectWallet,
  coinbaseWallet,
  rainbowWallet,
} from '@rainbow-me/rainbowkit/wallets';

// Get WalletConnect project ID from environment variable
// Get your free project ID at https://cloud.walletconnect.com
// This is a temporary placeholder UUID - replace with your own project ID
const projectId =
  process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ||
  '00000000-0000-0000-0000-000000000000';

if (!process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID) {
  console.warn(
    '⚠️ NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID is not set. Please get your free project ID at https://cloud.walletconnect.com'
  );
}

// Configure RainbowKit wallets for existing wallet connections
const rainbowKitConnectors = connectorsForWallets(
  [
    {
      groupName: 'Recommended',
      wallets: [
        metaMaskWallet,
        coinbaseWallet,
        walletConnectWallet,
        rainbowWallet,
      ],
    },
  ],
  {
    appName: 'Orbbit',
    projectId: projectId,
  }
);

export const wagmiConfig = createConfig({
  chains: [base, baseSepolia],
  connectors: [
    // Base Account connector for new wallet creation
    baseAccount({
      appName: 'Orbbit',
      appLogoUrl: 'https://media.cdn.orbbit.co/brand/orbbit-logo-circle.svg', // Update with your actual logo path
    }),
    // RainbowKit connectors for existing wallets
    ...rainbowKitConnectors,
  ],
  transports: {
    [base.id]: http(),
    [baseSepolia.id]: http(),
  },
  ssr: true, // Enable SSR for Next.js
});
