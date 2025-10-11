import './tailwind.css';

import { Inter } from 'next/font/google';
import { QueryProvider } from '@/providers/query-provider';
import { JotaiProvider } from '@/providers/jotai-provider';
import { Web3Providers } from './providers';
import { Metadata } from 'next';
import { Toaster } from 'sonner';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter', // This creates a CSS variable
});

export const metadata: Metadata = {
  title: 'Orbbit HQ',
  description: 'HQ Dashboard for Orbbit',
};

// ============================================================================
// COMPLETE PROVIDER HIERARCHY (Outermost to Innermost)
// ============================================================================

// 1. JotaiProvider                    ← State management (Jotai atoms)
// 2. QueryProvider                    ← TanStack Query (async state & caching)
// 3. Web3Providers (Web3 stack):
//    - WagmiProvider                  ← Blockchain connection & hooks
//    - OnchainKitProvider             ← OnchainKit components (Swap, Identity, etc.)
//    - RainbowKitProvider             ← Wallet connection UI
// 4. {children}                       ← Your app content
//    - SidebarProvider lives here in dashboard layout
// ============================================================================

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} w-full`}>
      <body>
        <JotaiProvider>
          <QueryProvider>
            <Web3Providers>
              {children}
              <Toaster />
            </Web3Providers>
          </QueryProvider>
        </JotaiProvider>
      </body>
    </html>
  );
}
