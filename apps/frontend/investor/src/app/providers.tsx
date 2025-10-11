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
import { WagmiProvider } from 'wagmi';
import { base, baseSepolia } from 'wagmi/chains';
import {
  getDefaultConfig,
  RainbowKitProvider,
  lightTheme,
} from '@rainbow-me/rainbowkit';

export function Web3Providers({ children }: { children: React.ReactNode }) {
  const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID!;

  // RainbowKit's recommended config - automatically includes all popular wallets
  const config = getDefaultConfig({
    appName: 'Orbbit',
    projectId: projectId,
    chains: [baseSepolia, base],
    ssr: true,
  });

  // RainbowKit theme - Neutral styling for modal (button color overridden in CSS)
  const customTheme = lightTheme({
    accentColor: 'hsl(180, 85%, 32%)', // Neutral gray - keeps modal clean
    accentColorForeground: 'hsl(0, 0%, 100%)',
    borderRadius: 'medium',
    fontStack: 'rounded',
  });

  return (
    <WagmiProvider config={config}>
      <RainbowKitProvider theme={customTheme}>{children}</RainbowKitProvider>
    </WagmiProvider>
  );
}
