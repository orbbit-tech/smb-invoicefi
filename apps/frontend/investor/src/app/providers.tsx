'use client';

/**
 * ============================================================================
 * PROVIDER HIERARCHY - All Web3 Providers in One Place
 * ============================================================================
 *
 * This file shows the complete provider nesting structure:
 *
 * <WagmiProvider>                    ← Blockchain connection & state management
 *   <OnchainKitProvider>             ← OnchainKit components (Wallet, Identity, Transaction, etc.)
 *     {children}
 *
 * Note: QueryClientProvider (TanStack Query) is in layout.tsx wrapping this component
 *
 * RainbowKitProvider is commented out - OnchainKit handles wallet connections
 *
 * ============================================================================
 */

// RainbowKit imports - COMMENTED OUT (keeping for reference)
// import '@rainbow-me/rainbowkit/styles.css';
// import {
//   getDefaultConfig,
//   RainbowKitProvider,
//   lightTheme,
// } from '@rainbow-me/rainbowkit';

import '../styles/onchainkit.css';
import { WagmiProvider, http } from 'wagmi';
import { base, baseSepolia } from 'wagmi/chains';
import { createConfig } from 'wagmi';
import { coinbaseWallet, metaMask, walletConnect } from 'wagmi/connectors';
import { OnchainKitProvider } from '@coinbase/onchainkit';
import { useMemo } from 'react';

export function Web3Providers({ children }: { children: React.ReactNode }) {
  const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;
  const cdpApiKey = process.env.NEXT_PUBLIC_CDP_API_KEY;

  // Wagmi config with wallet connectors
  const config = useMemo(() => {
    return createConfig({
      chains: [baseSepolia, base],
      connectors: [
        coinbaseWallet({
          appName: 'Orbbit',
        }),
        metaMask(),
        walletConnect({
          projectId: projectId || '',
        }),
      ],
      ssr: true,
      transports: {
        [baseSepolia.id]: http(),
        [base.id]: http(),
      },
    });
  }, [projectId]);

  // RainbowKit theme - COMMENTED OUT (keeping for reference)
  // const customTheme = lightTheme({
  //   accentColor: 'hsl(180, 85%, 32%)', // Orbbit teal
  //   accentColorForeground: 'white',
  //   borderRadius: 'medium',
  //   fontStack: 'rounded',
  // });

  return (
    <WagmiProvider config={config}>
      <OnchainKitProvider
        chain={baseSepolia}
        apiKey={cdpApiKey || undefined}
        config={{
          appearance: {
            name: 'Orbbit',
            logo: '/orbbit-logo.png',
            mode: 'auto',
            theme: 'default',
          },
          wallet: {
            display: 'modal',
          },
        }}
      >
        {/* RainbowKitProvider - COMMENTED OUT */}
        {/* <RainbowKitProvider theme={customTheme}>{children}</RainbowKitProvider> */}
        {children}
      </OnchainKitProvider>
    </WagmiProvider>
  );
}
