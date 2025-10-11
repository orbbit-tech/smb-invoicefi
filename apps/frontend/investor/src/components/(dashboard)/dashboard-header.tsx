'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { HeaderUserMenu } from '../navigation/header-user-menu';
import { useSession } from '@/utils/hooks/use-session';

// Dynamically import wallet components with no SSR
const WalletSection = dynamic(
  () => import('./wallet-section').then((mod) => mod.WalletSection),
  {
    ssr: false,
    loading: () => null,
  }
);

/**
 * DashboardHeader - Full-width fixed header
 *
 * Displays Orbbit logo (left), wallet connection and user menu (right)
 * Fixed at top, spans full viewport width
 */
export function DashboardHeader() {
  const session = useSession();

  const memberDisplayData = {
    name: session.member.name ?? '',
    email: session.member.email ?? '',
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background flex h-14 shrink-0 items-center bg-sidebar px-2">
      <div className="mx-auto flex w-full items-center justify-between gap-4 px-3">
        {/* Left: Orbbit Logo */}
        <Link href="/" className="flex items-center">
          <Image
            src="/orbbit-logo-long.png"
            alt="Orbbit"
            width={102}
            height={32}
            className="rounded-lg"
            priority
          />
        </Link>

        {/* Right: Wallet section + User menu */}
        <div className="flex items-center gap-4">
          {/* Wallet Connection & Balance */}
          <WalletSection />
          {/* User Avatar & Menu */}
          <HeaderUserMenu member={memberDisplayData} />
        </div>
      </div>

      {/* COMMENTED OUT: Old header without logo */}
      {/* <div className="mx-auto flex w-full max-w-7xl items-center justify-end gap-4 px-8">
        <div className="flex items-center gap-8">
          <WalletSection />
          <HeaderUserMenu member={memberDisplayData} />
        </div>
      </div> */}
    </header>
  );
}
