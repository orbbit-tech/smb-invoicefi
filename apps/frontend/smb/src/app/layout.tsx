import './tailwind.css';

import { Inter } from 'next/font/google';
import { QueryProvider } from '@/providers/query-provider';
import { JotaiProvider } from '@/providers/jotai-provider';
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
        <JotaiProvider>
          <QueryProvider>
            {children}
            <Toaster />
          </QueryProvider>
        </JotaiProvider>
      </body>
    </html>
  );
}
