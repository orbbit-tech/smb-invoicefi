import './tailwind.css';
import '@rainbow-me/rainbowkit/styles.css';

import { Inter } from 'next/font/google';
import { QueryProvider } from '@/providers/query-provider';
import { JotaiProvider } from '@/providers/jotai-provider';
import { WagmiProvider } from '@/providers/wagmi-provider';
import { Metadata } from 'next';
import { Toaster } from 'sonner';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter', // This creates a CSS variable
});

export const metadata: Metadata = {
  title: 'Orbbit',
  description: 'Capital & Financial Intelligence for SMBs',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} w-full`}>
      <body>
        <WagmiProvider>
          <QueryProvider>
            <JotaiProvider>
              {children}
              <Toaster />
            </JotaiProvider>
          </QueryProvider>
        </WagmiProvider>
      </body>
    </html>
  );
}
