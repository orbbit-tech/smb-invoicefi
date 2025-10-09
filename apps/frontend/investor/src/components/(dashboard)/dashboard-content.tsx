'use client';

import React from 'react';
import { SidebarInset, SidebarTrigger } from '@ui';
import dynamic from 'next/dynamic';

interface DashboardContentProps {
  children: React.ReactNode;
}

// Dynamically import wallet components with no SSR
// This prevents hydration issues and allows graceful fallback when Web3 providers aren't configured
const WalletSection = dynamic(
  () => import('./wallet-section').then((mod) => mod.WalletSection),
  {
    ssr: false,
    loading: () => null,
  }
);

export function DashboardContent({ children }: DashboardContentProps) {
  return (
    <SidebarInset className="flex h-full flex-col">
      <header className="bg-background/95 supports-[backdrop-filter]:bg-background/60 flex h-16 shrink-0 items-center backdrop-blur">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8 pt-6">
          <SidebarTrigger className="-ml-1" />
          {/* Wallet Connection & Balance - Compact header placement */}
          <WalletSection />
        </div>
      </header>

      <div className="bg-background flex flex-1 flex-col overflow-y-auto scrollbar-gutter-stable pb-10 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-4">
        {children}
      </div>
    </SidebarInset>
  );
}
